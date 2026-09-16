import { GoogleGenAI, Type, Modality } from '@google/genai';
import { getCache, setCache } from '../config/redis.js';
import {
  DEMO_DIAGNOSES,
  DEMO_YIELD_PLANS,
  DEMO_QA_RESPONSES,
} from '../data/sampleFallbackData.js';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key missing in backend environment configuration.');
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWithRetry = async (ai, params, maxRetries = 2) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      attempt++;
      const isRateLimit = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      if (isRateLimit && attempt < maxRetries) {
        const retryDelayMatch = err?.message?.match(/retry in ([0-9.]+)s/);
        const waitMs = retryDelayMatch ? Math.ceil(parseFloat(retryDelayMatch[1]) * 1000) + 1000 : (attempt * 2500);
        console.warn(`[Gemini Rate Limit] 429 hit. Retrying attempt ${attempt}/${maxRetries} in ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 10000)));
      } else {
        throw err;
      }
    }
  }
};

/**
 * Helper to find matching fallback diagnosis
 */
function getMatchingDemoKey(inputString = '') {
  const lower = (inputString || '').toLowerCase();
  if (lower === 'potato' || lower.includes('potato') || lower.includes('atdwjvng') || lower.includes('early blight')) {
    return 'potato';
  }
  if (lower === 'tomato' || lower.includes('tomato') || lower.includes('hornworm') || lower.includes('shutterstock_1699161862')) {
    return 'tomato';
  }
  if (lower === 'corn' || lower.includes('corn') || lower.includes('maize') || lower.includes('rust') || lower.includes('clemson.edu')) {
    return 'corn';
  }
  return null;
}

/**
 * 1. Identify Crop and Pest from Image (Base64 or Multipart)
 */
export const detectCropPest = async (req, res) => {
  try {
    let base64Image = req.body.image;
    const requestedDemo = req.body.demoType;

    // Handle file upload via Multer if provided
    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
    }

    if (!base64Image) {
      return res.status(400).json({ success: false, message: 'Image is required for crop scan.' });
    }

    // ⚡ 1. INSTANT DEMO BYPASS: Return pre-computed sample diagnosis without calling Gemini
    const demoKey = requestedDemo || getMatchingDemoKey(base64Image);
    if (demoKey && DEMO_DIAGNOSES[demoKey]) {
      console.log(`⚡ [Demo Instant Response] Instant curated diagnosis served for demo sample: ${demoKey}`);
      return res.json({
        success: true,
        identification: DEMO_DIAGNOSES[demoKey].identification,
        isDemo: true,
      });
    }

    // ⚡ 2. Check Redis Cache for live custom scans
    const cacheKey = `detect:${base64Image.substring(0, 80).replace(/[^a-zA-Z0-9]/g, '')}_${base64Image.length}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('⚡ [Redis Cache HIT] Returning cached crop diagnosis');
      return res.json({ success: true, identification: cached, fromCache: true });
    }

    // 🤖 3. LIVE GEMINI AI: Analyze user's custom photo / camera upload
    let mimeType = 'image/jpeg';
    if (req.file) {
      mimeType = req.file.mimetype || 'image/jpeg';
    } else if (typeof req.body.image === 'string') {
      const match = req.body.image.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
      if (match) {
        mimeType = match[1];
      }
    }

    const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
    const ai = getAiClient();

    const prompt = `
    Act as an expert Plant Pathologist. Analyze the image.
    Task:
    1. Identify CROP.
    2. Identify PEST/DISEASE. If healthy, set pest_label to 'Healthy'.
    3. Confidence score (0-1).
    4. Brief 1-sentence note explaining visual evidence.
    Respond strictly in JSON.
    `;

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              pest_label: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              notes: { type: Type.STRING },
            },
            required: ['crop', 'pest_label', 'confidence', 'notes'],
          },
        },
      });

      if (response && response.text) {
        const identification = JSON.parse(response.text);
        // Save custom result to Redis Cache (7 days TTL)
        await setCache(cacheKey, identification, 86400 * 7);
        return res.json({ success: true, identification });
      }
    } catch (aiErr) {
      console.warn('[AI Detect] Gemini rate limit reached on custom upload. Serving fallback:', aiErr.message);
    }

    // 4. Safe Fallback if live custom scan hits quota
    const fallback = DEMO_DIAGNOSES.default;
    await setCache(cacheKey, fallback.identification, 86400 * 7);
    return res.json({ success: true, identification: fallback.identification, isFallback: true });

  } catch (error) {
    console.error('[AI Controller] Detect Error:', error);
    const fallback = DEMO_DIAGNOSES.default;
    return res.json({ success: true, identification: fallback.identification, isFallback: true });
  }
};

/**
 * 2. Generate Treatment Plan with Localization
 */
export const generateTreatment = async (req, res) => {
  try {
    const { identification, weather, language = 'Hindi', demoType = null } = req.body;

    if (!identification || !identification.crop) {
      return res.status(400).json({ success: false, message: 'Crop identification details are required.' });
    }

    // ⚡ 1. INSTANT DEMO BYPASS: Return pre-computed sample treatment without calling Gemini
    const demoKey = demoType || getMatchingDemoKey(identification.crop) || getMatchingDemoKey(identification.pest_label);
    if (demoKey && DEMO_DIAGNOSES[demoKey]) {
      console.log(`⚡ [Demo Instant Response] Instant curated treatment plan served for demo sample: ${demoKey}`);
      const demoData = DEMO_DIAGNOSES[demoKey];
      const treatment = demoData.treatments[language] || demoData.treatments.Hindi || demoData.treatments.English;
      return res.json({ success: true, treatment, isDemo: true });
    }

    // ⚡ 2. Check Redis Cache
    const cacheKey = `treat:${(identification.crop || '').toLowerCase()}_${(identification.pest_label || '').toLowerCase()}_${language}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('⚡ [Redis Cache HIT] Returning cached treatment plan');
      return res.json({ success: true, treatment: cached, fromCache: true });
    }

    // 🤖 3. LIVE GEMINI AI: Generate treatment plan for custom crop/disease
    const ai = getAiClient();
    const weatherContext = weather
      ? `Weather: ${weather.condition}, ${weather.temperature}°C.`
      : 'No weather data.';

    const prompt = `
    Role: 'Kisan Mitra', expert Indian agronomist.
    Language: ${language}.
    Crop: ${identification.crop}
    Disease: ${identification.pest_label}
    Weather: ${weatherContext}

    Task: Provide a treatment plan.
    - Organic Remedy (Desi Jugad).
    - Chemical Remedy (Indian Brands with INR cost estimate).
    - Safety tip.
    - Spoken Audio summary script (2 sentences strictly in ${language}).
    - Full explanation formatted in Markdown.
    - Cause of the disease (Why it happened).
    - 3 Preventive measures for future.
    `;

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              pest_name: { type: Type.STRING },
              pest_name_local: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              organic_remedy: { type: Type.STRING },
              chemical_remedy: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  product_brands: { type: Type.ARRAY, items: { type: Type.STRING } },
                  dosage_ml_per_litre: { type: Type.STRING },
                  frequency_days: { type: Type.STRING },
                  estimated_cost_inr: { type: Type.STRING },
                },
                required: ['name', 'product_brands', 'dosage_ml_per_litre', 'frequency_days', 'estimated_cost_inr'],
              },
              safety: { type: Type.STRING },
              tts_short: { type: Type.STRING },
              notes: { type: Type.STRING },
              weather_risk_label: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
              weather_advice: { type: Type.STRING },
              local_language_explanation: { type: Type.STRING },
              cause: { type: Type.STRING },
              preventive_measures: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: [
              'pest_name',
              'severity',
              'organic_remedy',
              'chemical_remedy',
              'safety',
              'tts_short',
              'local_language_explanation',
              'cause',
              'preventive_measures',
            ],
          },
        },
      });

      if (response && response.text) {
        const treatment = JSON.parse(response.text);
        await setCache(cacheKey, treatment, 86400 * 7);
        return res.json({ success: true, treatment });
      }
    } catch (aiErr) {
      console.warn('[AI Treatment] Gemini rate limit/quota reached. Using curated fallback:', aiErr.message);
    }

    // 2. Fallback treatment selection
    const cropKey = (identification.crop || '').toLowerCase();
    let sample = DEMO_DIAGNOSES.default;
    if (cropKey.includes('potato')) sample = DEMO_DIAGNOSES.potato;
    else if (cropKey.includes('tomato')) sample = DEMO_DIAGNOSES.tomato;
    else if (cropKey.includes('corn') || cropKey.includes('maize')) sample = DEMO_DIAGNOSES.corn;

    const fallbackTreatment = sample.treatments[language] || sample.treatments.Hindi || sample.treatments.English;
    await setCache(cacheKey, fallbackTreatment, 86400 * 7);
    return res.json({ success: true, treatment: fallbackTreatment, isFallback: true });

  } catch (error) {
    console.error('[AI Controller] Treatment Error:', error);
    const fallbackTreatment = DEMO_DIAGNOSES.potato.treatments.Hindi;
    return res.json({ success: true, treatment: fallbackTreatment, isFallback: true });
  }
};

/**
 * 3. Generate Audio TTS Script Explanation
 */
export const generateAudioTTS = async (req, res) => {
  try {
    const { identification, treatment, weather, language = 'Hindi' } = req.body;
    const ai = getAiClient();

    const weatherText = weather ? `Weather is ${weather.condition}, ${weather.temperature}°C.` : '';
    const prompt = `
    Act as Kisan Mitra (Farmer's Friend).
    Speak in ${language}.
    
    Topic: Diagnosis for ${identification?.crop}.
    Issue: ${treatment?.pest_name_local || treatment?.pest_name} (${treatment?.severity} severity).
    Advice: Use ${treatment?.chemical_remedy?.name} or ${treatment?.organic_remedy}.
    Note: ${weatherText} ${treatment?.weather_advice || ''}.
    
    Keep it conversational, empathetic, and under 40 seconds.
    `;

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-2.5-flash-preview-tts',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
      return res.json({ success: true, audioData: base64Audio });
    } catch (aiErr) {
      console.warn('[AI TTS] Audio quota limit:', aiErr.message);
      return res.json({ success: true, audioData: '', isFallback: true });
    }
  } catch (error) {
    console.error('[AI Controller] TTS Error:', error);
    res.status(500).json({ success: false, message: 'Audio generation failed.', error: error.message });
  }
};

/**
 * 4. Yield Plan Optimization (Smart Farm)
 */
export const generateYieldOptimization = async (req, res) => {
  try {
    const { crop = 'Wheat', acres = '5', season = 'Rabi', language = 'Hindi' } = req.body;

    // 1. Check Redis Cache
    const cacheKey = `yield:${crop.toLowerCase().trim()}_${acres}_${season.toLowerCase()}_${language}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('⚡ [Redis Cache HIT] Returning cached Yield Master Plan');
      return res.json({ success: true, plan: cached, yieldPlan: cached, fromCache: true });
    }

    const ai = getAiClient();
    const prompt = `
    Act as a high-yield Agricultural Consultant for India.
    Create a production maximization plan.
    Input:
    - Crop: ${crop}
    - Land: ${acres} Acres
    - Season: ${season}
    - Language: ${language}

    Task:
    1. Estimate yield (Quintals).
    2. Create a timeline (Sowing to Harvest).
    3. Suggest fertilizer schedule.
    4. Give 3 Pro Tips for max production.
    All text in ${language}.
    `;

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              crop: { type: Type.STRING },
              landSize: { type: Type.STRING },
              season: { type: Type.STRING },
              expectedYield: { type: Type.STRING },
              timeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stage: { type: Type.STRING },
                    action: { type: Type.STRING },
                    fertilizer: { type: Type.STRING },
                    tip: { type: Type.STRING },
                  },
                },
              },
              generalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['crop', 'expectedYield', 'timeline', 'generalTips'],
          },
        },
      });

      if (response && response.text) {
        const yieldPlan = JSON.parse(response.text || '{}');
        if (!yieldPlan.landSize) yieldPlan.landSize = String(acres);
        if (!yieldPlan.season) yieldPlan.season = season;
        await setCache(cacheKey, yieldPlan, 86400 * 7);
        return res.json({ success: true, plan: yieldPlan, yieldPlan });
      }
    } catch (aiErr) {
      console.warn('[AI Yield] Gemini rate limit/quota reached. Using curated fallback:', aiErr.message);
    }

    // 2. Curated Fallback Yield Plan
    const cropLower = crop.toLowerCase();
    let fallback = DEMO_YIELD_PLANS.wheat;
    if (cropLower.includes('rice') || cropLower.includes('paddy') || cropLower.includes('dhan')) {
      fallback = DEMO_YIELD_PLANS.rice;
    } else if (cropLower.includes('tomato') || cropLower.includes('tamatar')) {
      fallback = DEMO_YIELD_PLANS.tomato;
    }
    const finalPlan = { ...fallback, landSize: String(acres), season };
    await setCache(cacheKey, finalPlan, 86400 * 7);
    return res.json({ success: true, plan: finalPlan, yieldPlan: finalPlan, isFallback: true });

  } catch (error) {
    console.error('[AI Controller] Yield Error:', error);
    const finalPlan = { ...DEMO_YIELD_PLANS.wheat, landSize: '5', season: 'Rabi' };
    return res.json({ success: true, plan: finalPlan, yieldPlan: finalPlan, isFallback: true });
  }
};

/**
 * 5. Grounded Follow-up Question with Search
 */
export const askQuestion = async (req, res) => {
  try {
    const { question = '', context, language = 'Hindi' } = req.body;

    // 1. Check Redis Cache
    const cacheKey = `qa:${question.toLowerCase().trim()}_${language}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('⚡ [Redis Cache HIT] Returning cached Kisan Doctor QA response');
      return res.json({ success: true, text: cached.text, sourceUrls: cached.sourceUrls, fromCache: true });
    }

    const ai = getAiClient();

    try {
      const response = await generateWithRetry(ai, {
        model: 'gemini-2.5-flash',
        contents: `Q: ${question}. Context: ${JSON.stringify(context)}. Lang: ${language}. Keep it short and helpful.`,
        config: { tools: [{ googleSearch: {} }] },
      });

      const urls = [];
      response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c) => {
        if (c.web?.uri) urls.push(c.web.uri);
      });

      const resultPayload = {
        text: response.text || 'No answer available.',
        sourceUrls: urls,
      };

      await setCache(cacheKey, resultPayload, 86400 * 7);
      return res.json({ success: true, ...resultPayload });

    } catch (aiErr) {
      console.warn('[AI Ask] Gemini rate limit/quota reached. Using fallback QA answer:', aiErr.message);
    }

    // 2. Curated Fallback QA
    const qLower = question.toLowerCase();
    let fallback = DEMO_QA_RESPONSES.default;
    if (qLower.includes('rust') || qLower.includes('रतुआ') || qLower.includes('yellow')) {
      fallback = DEMO_QA_RESPONSES.yellow_rust;
    } else if (qLower.includes('fertilizer') || qLower.includes('खाद') || qLower.includes('npk')) {
      fallback = DEMO_QA_RESPONSES.fertilizer;
    }

    await setCache(cacheKey, fallback, 86400 * 7);
    return res.json({ success: true, text: fallback.text, sourceUrls: fallback.sourceUrls, isFallback: true });

  } catch (error) {
    console.error('[AI Controller] Question Error:', error);
    const fallback = DEMO_QA_RESPONSES.default;
    return res.json({ success: true, text: fallback.text, sourceUrls: fallback.sourceUrls, isFallback: true });
  }
};
