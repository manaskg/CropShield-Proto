import apiClient from './apiClient';

export const aiApi = {
  detectCrop: (base64Image, demoType = null) => apiClient.post('/ai/detect', { image: base64Image, demoType }),
  getTreatmentPlan: (identification, weather, language = 'Hindi', demoType = null) =>
    apiClient.post('/ai/treatment-plan', { identification, weather, language, demoType }),
  getAudioTTS: (identification, treatment, weather, language = 'Hindi') =>
    apiClient.post('/ai/audio-tts', { identification, treatment, weather, language }),
  getYieldPlan: (crop, acres, season, language = 'Hindi') =>
    apiClient.post('/ai/yield-plan', { crop, acres, season, language }),
  askQuestion: (question, context, language = 'Hindi') =>
    apiClient.post('/ai/ask', { question, context, language }),
};

