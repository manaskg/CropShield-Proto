import axios from 'axios';

/**
 * Standardized Axios HTTP client instance with automatic JWT auth injection
 * and clean error message unwrapping.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Request Interceptor: Attach JWT Token from localStorage if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cropshield_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatically unwrap response data & format error messages
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'A network error occurred. Please check your connection.';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
