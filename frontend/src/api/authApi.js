import apiClient from './apiClient';

/**
 * Authentication & Farmer Profile API Services
 */
export const authApi = {
  /**
   * Registers a new farmer user account
   * @param {object} data - { name, email, password, farmLocation, farmSize, primaryCrops }
   */
  register: (data) => apiClient.post('/auth/register', data),

  /**
   * Authenticates user credentials and retrieves JWT token
   * @param {object} data - { email, password }
   */
  login: (data) => apiClient.post('/auth/login', data),

  /**
   * Logs out user and invalidates session token in Redis blacklist
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * Retrieves profile data of currently authenticated farmer
   */
  getMe: () => apiClient.get('/auth/me'),

  /**
   * Updates user profile fields in MongoDB Atlas
   * @param {object} data - { name, profileImage, farmLocation, farmSize, primaryCrops }
   */
  updateProfile: (data) => apiClient.put('/auth/profile', data),
};

export default authApi;
