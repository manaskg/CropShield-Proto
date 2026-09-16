import apiClient from './apiClient';

export const soilApi = {
  fetchSatelliteData: (lat, lon) => apiClient.get(`/soil/satellite?lat=${lat}&lon=${lon}`),
  analyzeSoil: (mode, inputData, language = 'Hindi') =>
    apiClient.post('/soil/analyze', { mode, inputData, language }),
};
