import {
  DEMO_DIAGNOSES,
  DEMO_YIELD_PLANS,
  DEMO_SOIL_REPORTS,
  DEMO_QA_RESPONSES,
} from './sampleFallbackData.js';

export { DEMO_DIAGNOSES, DEMO_YIELD_PLANS, DEMO_SOIL_REPORTS, DEMO_QA_RESPONSES };

/**
 * Matches input strings (filenames, image hashes, or keywords) to predefined demo diagnostic keys
 *
 * @param {string} input - Input text or base64 excerpt
 * @returns {string|null} Demo diagnosis key or null
 */
export function getMatchingDemoKey(input = '') {
  const lower = (input || '').toLowerCase();
  if (lower.includes('potato') || lower.includes('atdwjvng') || lower.includes('early blight')) {
    return 'potato';
  }
  if (lower.includes('tomato') || lower.includes('hornworm') || lower.includes('shutterstock_1699161862')) {
    return 'tomato';
  }
  if (lower.includes('corn') || lower.includes('maize') || lower.includes('rust') || lower.includes('clemson.edu')) {
    return 'corn';
  }
  return null;
}

/**
 * Returns localized fallback treatment for a crop
 */
export function getFallbackTreatment(crop = '', language = 'Hindi') {
  const key = getMatchingDemoKey(crop) || 'default';
  const sample = DEMO_DIAGNOSES[key] || DEMO_DIAGNOSES.default;
  return sample.treatments[language] || sample.treatments.Hindi || sample.treatments.English;
}

/**
 * Returns fallback yield optimization plan
 */
export function getFallbackYieldPlan(crop = '', acres = '5', season = 'Rabi') {
  const lower = (crop || '').toLowerCase();
  let plan = DEMO_YIELD_PLANS.wheat;
  if (lower.includes('rice') || lower.includes('paddy') || lower.includes('dhan')) {
    plan = DEMO_YIELD_PLANS.rice;
  } else if (lower.includes('tomato') || lower.includes('tamatar')) {
    plan = DEMO_YIELD_PLANS.tomato;
  }
  return { ...plan, landSize: String(acres), season };
}

/**
 * Returns fallback QA answer
 */
export function getFallbackQA(question = '') {
  const q = question.toLowerCase();
  if (q.includes('rust') || q.includes('रतुआ') || q.includes('yellow')) {
    return DEMO_QA_RESPONSES.yellow_rust;
  }
  if (q.includes('fertilizer') || q.includes('खाद') || q.includes('npk')) {
    return DEMO_QA_RESPONSES.fertilizer;
  }
  return DEMO_QA_RESPONSES.default;
}
