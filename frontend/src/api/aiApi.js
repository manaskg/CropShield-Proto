import apiClient from './apiClient';

/**
 * AI Services API Endpoints for CropShield
 */
export const aiApi = {
  /**
   * Scans a crop leaf image for pests, diseases, and nutritional stress
   * @param {string} base64Image - Clean base64 image data or data URI
   * @param {string|null} [demoType=null] - Precomputed demo key for instant bypass
   * @returns {Promise<{success: boolean, identification: object, isDemo?: boolean}>}
   */
  detectCrop: (base64Image, demoType = null) =>
    apiClient.post('/ai/detect', { image: base64Image, demoType }),

  /**
   * Generates localized agronomic treatment plan with organic and chemical remedies
   * @param {object} identification - Crop and disease identification object
   * @param {object} weather - Environmental weather context (temp, humidity, condition)
   * @param {string} [language='Hindi'] - Target language
   * @param {string|null} [demoType=null] - Optional demo identifier
   * @returns {Promise<{success: boolean, treatment: object}>}
   */
  getTreatmentPlan: (identification, weather, language = 'Hindi', demoType = null) =>
    apiClient.post('/ai/treatment-plan', { identification, weather, language, demoType }),

  /**
   * Synthesizes audio spoken explanation via Gemini TTS
   * @param {object} identification - Crop diagnosis details
   * @param {object} treatment - Recommended treatment plan
   * @param {object} weather - Current weather conditions
   * @param {string} [language='Hindi'] - Target language
   * @returns {Promise<{success: boolean, audioData: string}>}
   */
  getAudioTTS: (identification, treatment, weather, language = 'Hindi') =>
    apiClient.post('/ai/audio-tts', { identification, treatment, weather, language }),

  /**
   * Generates Smart Farm harvest yield maximization schedule
   * @param {string} crop - Target crop name
   * @param {string|number} acres - Land parcel size in acres
   * @param {string} season - Growing season (Kharif/Rabi/Zaid)
   * @param {string} [language='Hindi'] - Output language
   * @returns {Promise<{success: boolean, plan: object}>}
   */
  getYieldPlan: (crop, acres, season, language = 'Hindi') =>
    apiClient.post('/ai/yield-plan', { crop, acres, season, language }),

  /**
   * Submits a grounded follow-up question with real-time Google Search integration
   * @param {string} question - Farmer's question text
   * @param {object} context - Diagnosis and crop context
   * @param {string} [language='Hindi'] - Language
   * @returns {Promise<{success: boolean, text: string, sourceUrls: string[]}>}
   */
  askQuestion: (question, context, language = 'Hindi') =>
    apiClient.post('/ai/ask', { question, context, language }),

  /**
   * Communicates with the live AI Voice Advisor and receives HD speech audio
   * @param {string} question - Spoken or typed question
   * @param {object} context - Agronomic context
   * @param {string} [language='Hindi'] - Target language
   * @param {string} [voiceName='Kore'] - Gemini prebuilt voice
   * @returns {Promise<{success: boolean, text: string, audioUrl: string}>}
   */
  askVoice: (question, context, language = 'Hindi', voiceName = 'Kore') =>
    apiClient.post('/ai/ask-voice', { question, context, language, voiceName }),
};

export default aiApi;
