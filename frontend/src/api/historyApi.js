import apiClient from './apiClient';

/**
 * Farmer Scan History API Services
 */
export const historyApi = {
  /**
   * Retrieves all previous crop scans for the authenticated user
   */
  getHistory: () => apiClient.get('/history'),

  /**
   * Persists a newly completed crop diagnosis to scan history
   * @param {object} scanData - Diagnosis details and image preview
   */
  addScan: (scanData) => apiClient.post('/history', scanData),

  /**
   * Removes a scan record from history
   * @param {string} id - Scan document ID
   */
  deleteScan: (id) => apiClient.delete(`/history/${id}`),
};

export default historyApi;
