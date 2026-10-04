import { SoilReport } from '../models/SoilReport.js';
import { getCache, setCache } from '../config/redis.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { analyzeSoilAI } from '../services/geminiService.js';
import { DEMO_SOIL_REPORTS } from '../data/fallbackData.js';

/**
 * Calculates estimated Indian regional soil chemistry heuristics based on GPS coordinates
 */
function getEstimatedSoilChemistry(lat, lon) {
  if (lat > 24 && lon > 75 && lon < 88) {
    return { ph: 7.2, profile: 'Gangetic Alluvial (Neutral to slightly alkaline)' };
  } else if (lat > 18 && lat <= 24 && lon > 72 && lon < 80) {
    return { ph: 7.8, profile: 'Deccan Black Cotton (Regur - Rich in Clay)' };
  } else if (lat < 18 && lon > 74 && lon < 80) {
    return { ph: 6.2, profile: 'Southern Red Soil (Slightly Acidic, porous)' };
  } else if (lat > 26 && lon < 76) {
    return { ph: 8.2, profile: 'Arid Desert Soil (Sandy, alkaline)' };
  }
  return { ph: 6.8, profile: 'Standard Indian Agricultural Soil (Loamy)' };
}

/**
 * 1. Fetch satellite soil physical telemetry and heuristic chemistry
 */
export const getSatelliteSoil = asyncHandler(async (req, res) => {
  const lat = parseFloat(req.query.lat) || 28.6139; // Default Delhi lat
  const lon = parseFloat(req.query.lon) || 77.2090; // Default Delhi lon

  const cacheKey = `sat_soil:${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, data: cached, fromCache: true });
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=soil_temperature_0cm,soil_moisture_0_to_1cm`
    );

    if (!response.ok) {
      throw new Error('Open-Meteo satellite request failed.');
    }

    const data = await response.json();
    const chemistry = getEstimatedSoilChemistry(lat, lon);

    const satelliteData = {
      temperature: data.current?.soil_temperature_0cm || 24,
      moisture: Math.round((data.current?.soil_moisture_0_to_1cm || 0.25) * 100),
      estimatedPh: chemistry.ph,
      regionProfile: chemistry.profile,
    };

    await setCache(cacheKey, satelliteData, 3600 * 6); // 6 hours TTL
    return res.json({ success: true, data: satelliteData });
  } catch (err) {
    console.warn('[Soil Controller] Satellite fetch warning, using heuristic fallback:', err.message);
    const chemistry = getEstimatedSoilChemistry(lat, lon);
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
});

/**
 * 2. Analyze Soil Lab data (satellite, vision, OCR, manual) with Gemini & Redis
 */
export const analyzeSoil = asyncHandler(async (req, res) => {
  const { mode = 'satellite', inputData, language = 'Hindi' } = req.body;

  // 1. Redis Cache Lookup
  const inputHash = typeof inputData === 'string'
    ? inputData.substring(0, 60).replace(/[^a-zA-Z0-9]/g, '')
    : JSON.stringify(inputData || {}).substring(0, 60).replace(/[^a-zA-Z0-9]/g, '');
  const cacheKey = `soil_lab:${mode}_${inputHash}_${language}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ success: true, result: cached, fromCache: true });
  }

  // 2. Live Gemini Soil Analysis with Fallback
  let result = null;
  try {
    result = await analyzeSoilAI(mode, inputData, language);
  } catch (err) {
    console.warn('[Soil Controller] Gemini analysis quota reached. Serving curated fallback:', err.message);
    result = {
      ...(DEMO_SOIL_REPORTS[mode] || DEMO_SOIL_REPORTS.satellite),
      source: mode,
    };
  }

  await setCache(cacheKey, result, 86400 * 7);

  // 3. Persist report to MongoDB if user is authenticated
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
      console.warn('[Soil Controller] Could not persist report to DB:', dbErr.message);
    }
  }

  return res.json({ success: true, result });
});
