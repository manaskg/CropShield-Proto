import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Request Interceptor: Attach JWT Token if available
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

// Response Interceptor: Clean error extraction & 401 handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Clear invalid session token if desired
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        // localStorage.removeItem('cropshield_token');
      }
    }
    const message = error.response?.data?.message || error.message || 'Network error occurred.';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
