import apiClient from './apiClient';

/**
 * Satellite & Soil Lab Analysis API Services
 */
export const soilApi = {
  /**
   * Fetches Open-Meteo satellite physical soil moisture & temperature
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   */
  fetchSatelliteData: (lat, lon) => apiClient.get(`/soil/satellite?lat=${lat}&lon=${lon}`),

  /**
   * Analyzes soil health data across satellite, vision, OCR, and manual modes
   * @param {'satellite'|'vision'|'ocr'|'manual'} mode - Soil input modality
   * @param {string|object} inputData - Image data or telemetry object
   * @param {string} [language='Hindi'] - Target language
   */
  analyzeSoil: (mode, inputData, language = 'Hindi') =>
    apiClient.post('/soil/analyze', { mode, inputData, language }),
};

export default soilApi;
