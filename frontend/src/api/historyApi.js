import apiClient from './apiClient';

export const historyApi = {
  getHistory: () => apiClient.get('/history'),
  addScan: (scanData) => apiClient.post('/history', scanData),
  deleteScan: (id) => apiClient.delete(`/history/${id}`),
};
