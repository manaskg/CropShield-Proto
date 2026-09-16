import { GoogleGenAI, Type } from '@google/genai';
import { SoilReport } from '../models/SoilReport.js';
import { generateWithRetry } from './aiController.js';
import { getCache, setCache } from '../config/redis.js';
import { DEMO_SOIL_REPORTS } from '../data/sampleFallbackData.js';

const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API Key missing in backend environment.');
  }
  return new GoogleGenAI({ apiKey });
};

function getEstimatedSoilChemistry(lat, lon) {
  if (lat > 24 && lon > 75 && lon < 88) {
    return { ph: 7.2, profile: 'Gangetic Alluvial (Neutral to slightly alkaline)' };
  } else if (lat > 18 && lat <= 24 && lon > 72 && lon < 80) {
    return { ph: 7.8, profile: 'Deccan Black Cotton (Regur - Rich in Clay)' };
  } else if (lat < 18 && lon > 74 && lon < 80) {
    return { ph: 6.2, profile: 'Southern Red Soil (Slightly Acidic, porous)' };
  } else if (lat > 26 && lon < 76) {
    return { ph: 8.2, profile: 'Arid Desert Soil (Sandy, alkaline)' };
  } else {
    return { ph: 6.8, profile: 'Standard Indian Agricultural Soil (Loamy)' };
  }
}

/**
 * 1. Fetch satellite soil physics & heuristic chemistry
 */
export const getSatelliteSoil = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 28.6139; // Default Delhi lat
    const lon = parseFloat(req.query.lon) || 77.2090; // Default Delhi lon

    // Check Cache
    const cacheKey = `sat_soil:${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, fromCache: true });
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=soil_temperature_0cm,soil_moisture_0_to_1cm`
    );

    if (!response.ok) {
      throw new Error('Satellite Open-Meteo request failed.');
    }

    const data = await response.json();
    const chemistry = getEstimatedSoilChemistry(lat, lon);

    const satelliteData = {
      temperature: data.current?.soil_temperature_0cm || 24,
      moisture: Math.round((data.current?.soil_moisture_0_to_1cm || 0.25) * 100),
      estimatedPh: chemistry.ph,
      regionProfile: chemistry.profile,
    };

    await setCache(cacheKey, satelliteData, 3600 * 6); // 6 hours
    return res.json({ success: true, data: satelliteData });
  } catch (error) {
    console.error('[Soil Controller] Satellite Error:', error);
    const chemistry = getEstimatedSoilChemistry(28.61, 77.20);
    return res.json({
      success: true,
      data: {
        temperature: 26,
        moisture: 28,
        estimatedPh: chemistry.ph,
        regionProfile: chemistry.profile,
      },
      isFallback: true,
    });
  }
};

/**
 * 2. Analyze Soil Lab data (satellite, vision, ocr, manual) with Gemini & Fallback
 */
export const analyzeSoil = async (req, res) => {
  try {
    const { mode = 'satellite', inputData, language = 'Hindi' } = req.body;

    // 1. Check Redis Cache
    const inputHash = typeof inputData === 'string'
      ? inputData.substring(0, 60).replace(/[^a-zA-Z0-9]/g, '')
      : JSON.stringify(inputData || {}).substring(0, 60).replace(/[^a-zA-Z0-9]/g, '');
    const cacheKey = `soil_lab:${mode}_${inputHash}_${language}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('⚡ [Redis Cache HIT] Returning cached Soil Analysis Report');
      return res.json({ success: true, result: cached, fromCache: true });
    }

    const ai = getAiClient();
    const parts = [];

    if (mode === 'satellite') {
      const data = inputData || {};
      const promptContext = `Source: Satellite Data. Region: ${data.regionProfile}. Est pH: ${data.estimatedPh}. Moisture: ${data.moisture}%. Temp: ${data.temperature}°C.`;
      parts.push({
        text: `Analyze this soil data. Target Language: ${language}. Context: ${promptContext}. Return all textual fields strictly in ${language}.`,
      });
    } else if (mode === 'vision') {
      let mimeType = 'image/jpeg';
      if (typeof inputData === 'string') {
        const match = inputData.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
        if (match) mimeType = match[1];
      }
      const cleanBase64 = (inputData || '').replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
      parts.push({ inlineData: { mimeType, data: cleanBase64 } });
      parts.push({
        text: `Analyze this soil photo. Identify texture (Clay/Sandy/Loam), moisture status, and estimate pH. Target Language: ${language}. Return all text strictly in ${language}.`,
      });
    } else if (mode === 'ocr') {
      let mimeType = 'image/jpeg';
      if (typeof inputData === 'string') {
        const match = inputData.match(/^data:(image\/[a-zA-Z0-9.+]+);base64,/);
        if (match) mimeType = match[1];
      }
      const cleanBase64 = (inputData || '').replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, '');
      parts.push({ inlineData: { mimeType, data: cleanBase64 } });
      parts.push({
        text: `Read this Indian Soil Health Card. Extract pH, Organic Carbon, and NPK nutrients. Provide recommendations in ${language}. Return all text in ${language}.`,
      });
    } else {
      const promptContext = `Manual Input. pH: ${inputData?.ph || 7}. Type: ${inputData?.type || 'Loam'}.`;
      parts.push({
        text: `Analyze this manual soil data. Target Language: ${language}. Context: ${promptContext}. Return all text in ${language}.`,
      });
    }

    try {
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

      if (response && response.text) {
        const parsed = JSON.parse(response.text || '{}');
        const result = { ...parsed, source: mode };
        await setCache(cacheKey, result, 86400 * 7);

        // If user is authenticated, optionally persist report
        if (req.user?.id) {
          try {
            await SoilReport.create({
              userId: req.user.id,
              source: mode,
              soilType: result.soilType || 'Loam',
              phLevel: result.phLevel || '7.0',
              organicCarbon: result.organicCarbon || 'Medium',
              moisture: result.moisture || 'Normal',
              deficiencies: result.deficiencies || [],
              recommendations: result.recommendations || [],
              suitableCrops: result.suitableCrops || [],
            });
          } catch (dbErr) {
            console.warn('Could not persist soil report to DB:', dbErr.message);
          }
        }

        return res.json({ success: true, result });
      }
    } catch (aiErr) {
      console.warn('[AI Soil] Gemini rate limit/quota reached. Using fallback soil report:', aiErr.message);
    }

    // 2. Curated Fallback Soil Report
    const fallbackReport = {
      ...(DEMO_SOIL_REPORTS[mode] || DEMO_SOIL_REPORTS.satellite),
      source: mode,
    };
    await setCache(cacheKey, fallbackReport, 86400 * 7);
    return res.json({ success: true, result: fallbackReport, isFallback: true });

  } catch (error) {
    console.error('[Soil Controller] Analysis Error:', error);
    const fallbackReport = { ...DEMO_SOIL_REPORTS.satellite, source: 'satellite' };
    return res.json({ success: true, result: fallbackReport, isFallback: true });
  }
};
