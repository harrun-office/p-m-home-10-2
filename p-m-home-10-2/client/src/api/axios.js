import axios from 'axios';
import { getToken, removeToken } from '../utils/authToken.js';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request: attach JWT when present
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: on 401 remove token and redirect to login (prevent loops)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      const path = window.location.pathname;
      const isLoginPage = path === '/login' || path === '/';
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginPage && !isLoginRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
