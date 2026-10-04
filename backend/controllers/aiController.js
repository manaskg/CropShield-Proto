import { getCache, setCache } from '../config/redis.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import {
  analyzeCropVision,
  generateTreatmentPlanAI,
  generateYieldPlanAI,
  askGroundedQaAI,
  askVoiceAdvisorAI,
  getAiClient,
} from '../services/geminiService.js';
import { synthesizeGeminiVoice } from '../services/audioService.js';
import {
  DEMO_DIAGNOSES,
  getMatchingDemoKey,
  getFallbackTreatment,
  getFallbackYieldPlan,
  getFallbackQA,
} from '../data/fallbackData.js';

/**
 * 1. Identify Crop and Pest from Image (Base64 or Multipart Upload)
 */
export const detectCropPest = asyncHandler(async (req, res) => {
  let base64Image = req.file ? req.file.buffer.toString('base64') : req.body.image;
  const requestedDemo = req.body.demoType;

  if (!base64Image) {
    return res.status(400).json({ success: false, message: 'Image is required for crop scan.' });
  }

  // 1. Instant Demo Sample Bypass
  const demoKey = requestedDemo || getMatchingDemoKey(base64Image);
  if (demoKey && DEMO_DIAGNOSES[demoKey]) {
    return res.json({
      success: true,
      identification: DEMO_DIAGNOSES[demoKey].identification,
      isDemo: true,
    });
  }

  // 2. Redis Cache Lookup (7-day TTL)
  const cacheKey = `detect:${base64Image.substring(0, 80).replace(/[^a-zA-Z0-9]/g, '')}_${base64Image.length}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, identification: cached, fromCache: true });
  }

  // 3. Live Gemini Vision Analysis with Graceful Fallback
  const mimeType = req.file?.mimetype || (req.body.image?.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/)?.[1] || 'image/jpeg');
  const cleanBase64 = base64Image.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');

  try {
    const identification = await analyzeCropVision(cleanBase64, mimeType);
    await setCache(cacheKey, identification, 86400 * 7);
    return res.json({ success: true, identification });
  } catch (err) {
    console.warn('[AI Detect] Gemini rate limit reached. Serving fallback:', err.message);
    const fallback = DEMO_DIAGNOSES.default.identification;
    await setCache(cacheKey, fallback, 86400 * 7);
    return res.json({ success: true, identification: fallback, isFallback: true });
  }
});

/**
 * 2. Generate Localized Agronomic Treatment Plan
 */
export const generateTreatment = asyncHandler(async (req, res) => {
  const { identification, weather, language = 'Hindi', demoType = null } = req.body;

  if (!identification?.crop) {
    return res.status(400).json({ success: false, message: 'Crop identification details are required.' });
  }

  // 1. Instant Demo Bypass
  const demoKey = demoType || getMatchingDemoKey(identification.crop) || getMatchingDemoKey(identification.pest_label);
  if (demoKey && DEMO_DIAGNOSES[demoKey]) {
    const demo = DEMO_DIAGNOSES[demoKey];
    const treatment = demo.treatments[language] || demo.treatments.Hindi || demo.treatments.English;
    return res.json({ success: true, treatment, isDemo: true });
  }

  // 2. Redis Cache Lookup
  const cacheKey = `treat:${(identification.crop || '').toLowerCase()}_${(identification.pest_label || '').toLowerCase()}_${language}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, treatment: cached, fromCache: true });
  }

  // 3. Live Gemini Treatment Generation with Fallback
  try {
    const treatment = await generateTreatmentPlanAI(identification, weather, language);
    await setCache(cacheKey, treatment, 86400 * 7);
    return res.json({ success: true, treatment });
  } catch (err) {
    console.warn('[AI Treatment] Gemini quota reached. Using fallback:', err.message);
    const fallbackTreatment = getFallbackTreatment(identification.crop, language);
    await setCache(cacheKey, fallbackTreatment, 86400 * 7);
    return res.json({ success: true, treatment: fallbackTreatment, isFallback: true });
  }
});

/**
 * 3. Generate Spoken Audio Explanation via Gemini TTS
 */
export const generateAudioTTS = asyncHandler(async (req, res) => {
  const { identification, treatment, weather, language = 'Hindi' } = req.body;
  const ai = getAiClient();

  const weatherText = weather ? `Weather is ${weather.condition}, ${weather.temperature}°C.` : '';
  const promptText = `
  Act as Kisan Mitra (Farmer's Friend). Speak in ${language}.
  Diagnosis: ${identification?.crop}. Issue: ${treatment?.pest_name_local || treatment?.pest_name}.
  Remedy: ${treatment?.chemical_remedy?.name || treatment?.organic_remedy}. ${weatherText}.
  Keep it conversational and under 35 seconds.
  `;

  const audioUrl = await synthesizeGeminiVoice(ai, promptText, { voiceName: 'Kore' });
  return res.json({ success: true, audioData: audioUrl, isFallback: !audioUrl });
});

/**
 * 4. Yield Plan Optimization (Smart Farm)
 */
export const generateYieldOptimization = asyncHandler(async (req, res) => {
  const { crop = 'Wheat', acres = '5', season = 'Rabi', language = 'Hindi' } = req.body;

  // 1. Redis Cache Lookup
  const cacheKey = `yield:${crop.toLowerCase().trim()}_${acres}_${season.toLowerCase()}_${language}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, plan: cached, yieldPlan: cached, fromCache: true });
  }

  // 2. Live Gemini Yield Plan Generation with Fallback
  try {
    const plan = await generateYieldPlanAI(crop, acres, season, language);
    await setCache(cacheKey, plan, 86400 * 7);
    return res.json({ success: true, plan, yieldPlan: plan });
  } catch (err) {
    console.warn('[AI Yield] Gemini quota reached. Using fallback:', err.message);
    const fallback = getFallbackYieldPlan(crop, acres, season);
    await setCache(cacheKey, fallback, 86400 * 7);
    return res.json({ success: true, plan: fallback, yieldPlan: fallback, isFallback: true });
  }
});

/**
 * 5. Grounded Follow-up Question with Real-time Google Search
 */
export const askQuestion = asyncHandler(async (req, res) => {
  const { question = '', context, language = 'Hindi' } = req.body;

  // 1. Redis Cache Lookup
  const cacheKey = `qa:${question.toLowerCase().trim()}_${language}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, text: cached.text, sourceUrls: cached.sourceUrls, fromCache: true });
  }

  // 2. Live Gemini Grounded Search QA with Fallback
  try {
    const result = await askGroundedQaAI(question, context, language);
    await setCache(cacheKey, result, 86400 * 7);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.warn('[AI Ask] Gemini quota reached. Using fallback:', err.message);
    const fallback = getFallbackQA(question);
    await setCache(cacheKey, fallback, 86400 * 7);
    return res.json({ success: true, ...fallback, isFallback: true });
  }
});

/**
 * 6. High-Definition AI Voice Advisor with Gemini Speech Synthesis
 */
export const askVoiceAdvisor = asyncHandler(async (req, res) => {
  const { question = '', context = {}, language = 'Hindi', voiceName = 'Kore' } = req.body;
  const ai = getAiClient();

  // 1. Generate Conversational Text
  let text = '';
  try {
    text = await askVoiceAdvisorAI(question, context, language);
  } catch (err) {
    console.warn('[Voice Advisor] Text generation warning:', err.message);
  }

  if (!text) {
    text = language === 'hi'
      ? 'फसल की नियमित निगरानी करें और संतुलित मात्रा में पानी और जैविक खाद का प्रयोग करें।'
      : 'Regularly inspect your crop and ensure proper balanced watering and organic nutrition.';
  }

  // 2. Synthesize High-Definition Audio (24kHz WAV)
  const audioUrl = await synthesizeGeminiVoice(ai, text, { voiceName });

  return res.json({
    success: true,
    text,
    audioUrl,
    isAiVoice: Boolean(audioUrl),
  });
});
