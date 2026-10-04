import { GoogleGenAI, Type } from '@google/genai';
import {
  buildCropDetectionPrompt,
  buildTreatmentPlanPrompt,
  buildYieldOptimizationPrompt,
  buildSearchQaPrompt,
  buildVoiceAdvisorPrompt,
} from './promptTemplates.js';

/**
 * Initializes and returns the Google Gemini AI client
 */
export const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key missing in backend environment configuration.');
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Executes a Gemini model call with exponential backoff on 429 rate limits.
 *
 * @param {object} ai - GoogleGenAI client
 * @param {object} params - Model generation parameters
 * @param {number} maxRetries - Maximum retry attempts (default: 2)
 */
export const generateWithRetry = async (ai, params, maxRetries = 2) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      attempt++;
      const isRateLimit =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.includes('RESOURCE_EXHAUSTED');

      if (isRateLimit && attempt < maxRetries) {
        const retryDelayMatch = err?.message?.match(/retry in ([0-9.]+)s/);
        const waitMs = retryDelayMatch
          ? Math.ceil(parseFloat(retryDelayMatch[1]) * 1000) + 1000
          : attempt * 2500;
        console.warn(`[Gemini AI] Rate limit (429) hit. Retrying (${attempt}/${maxRetries}) in ${waitMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, Math.min(waitMs, 10000)));
      } else {
        throw err;
      }
    }
  }
};

/**
 * Analyzes crop image using Gemini 2.5 Flash Vision
 */
export async function analyzeCropVision(cleanBase64, mimeType = 'image/jpeg') {
  const ai = getAiClient();
  const prompt = buildCropDetectionPrompt();

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

  return JSON.parse(response.text || '{}');
}

/**
 * Generates an agronomic treatment plan with localized remedies
 */
export async function generateTreatmentPlanAI(identification, weather, language = 'Hindi') {
  const ai = getAiClient();
  const prompt = buildTreatmentPlanPrompt({
    crop: identification.crop,
    pest: identification.pest_label,
    weather,
    language,
  });

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

  return JSON.parse(response.text || '{}');
}

/**
 * Generates Smart Farm harvest yield maximization strategy
 */
export async function generateYieldPlanAI(crop, acres, season, language = 'Hindi') {
  const ai = getAiClient();
  const prompt = buildYieldOptimizationPrompt({ crop, acres, season, language });

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

  const plan = JSON.parse(response.text || '{}');
  if (!plan.landSize) plan.landSize = String(acres);
  if (!plan.season) plan.season = season;
  return plan;
}

/**
 * Grounded QA search with real-time Google Search integration
 */
export async function askGroundedQaAI(question, context, language = 'Hindi') {
  const ai = getAiClient();
  const prompt = buildSearchQaPrompt({ question, context, language });

  const response = await generateWithRetry(ai, {
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { tools: [{ googleSearch: {} }] },
  });

  const urls = [];
  response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c) => {
    if (c.web?.uri) urls.push(c.web.uri);
  });

  return {
    text: response.text || 'No answer available.',
    sourceUrls: urls,
  };
}

/**
 * Generates warm, conversational voice advisor response
 */
export async function askVoiceAdvisorAI(question, context, language = 'Hindi') {
  const ai = getAiClient();
  const prompt = buildVoiceAdvisorPrompt({ question, context, language });

  const response = await generateWithRetry(ai, {
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text?.trim() || '';
}

/**
 * Analyzes soil metrics across satellite, vision, OCR, and manual modes
 */
export async function analyzeSoilAI(mode, inputData, language = 'Hindi') {
  const ai = getAiClient();
  const parts = [];

  if (mode === 'satellite') {
    const data = inputData || {};
    const context = `Source: Satellite Data. Region: ${data.regionProfile}. Est pH: ${data.estimatedPh}. Moisture: ${data.moisture}%. Temp: ${data.temperature}°C.`;
    parts.push({ text: `Analyze soil data. Language: ${language}. Context: ${context}. Return all text in ${language}.` });
  } else if (mode === 'vision' || mode === 'ocr') {
    let mimeType = 'image/jpeg';
    if (typeof inputData === 'string') {
      const match = inputData.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
      if (match) mimeType = match[1];
    }
    const cleanBase64 = (inputData || '').replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
    parts.push({ inlineData: { mimeType, data: cleanBase64 } });
    const instruction = mode === 'vision'
      ? `Identify soil texture, moisture status, and estimate pH in ${language}.`
      : `Extract pH, Organic Carbon, and NPK nutrients from this Indian Soil Health Card in ${language}.`;
    parts.push({ text: `${instruction} Return all text in ${language}.` });
  } else {
    const context = `Manual Input. pH: ${inputData?.ph || 7}. Type: ${inputData?.type || 'Loam'}.`;
    parts.push({ text: `Analyze manual soil data. Language: ${language}. Context: ${context}. Return all text in ${language}.` });
  }

  const response = await generateWithRetry(ai, {
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING },
          soilType: { type: Type.STRING },
          phLevel: { type: Type.STRING },
          organicCarbon: { type: Type.STRING },
          moisture: { type: Type.STRING },
          deficiencies: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          suitableCrops: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['soilType', 'phLevel', 'organicCarbon', 'recommendations', 'suitableCrops'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');
  return { ...parsed, source: mode };
}
