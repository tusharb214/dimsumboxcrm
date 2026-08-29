import axios from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
const API_BASE_URL =
  // process.env.REACT_APP_API_URL || 'http://10.0.2.2:8080/api';
 
  process.env.REACT_APP_API_URL || 'http://72.61.242.24:8081/api';
// const API_BASE_URL = process.env.REACT_APP_API_URL || (window as any).__ENV__?.VITE_API_URL || 'http://72.61.242.24:8081/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor - attach JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
export const getFileUrl = (relativePath?: string | null): string => {
  if (!relativePath) return '';
  const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
  const cleanPath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${rootUrl}/${cleanPath}`;
};
export default apiClient;
