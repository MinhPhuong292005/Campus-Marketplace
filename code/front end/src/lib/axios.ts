import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check if request is an admin API or if user is currently inside /admin route
    const isAdminRoute =
      config.url?.startsWith('/admin') ||
      (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

    const adminToken = localStorage.getItem('admin_access_token');
    const customerToken = localStorage.getItem('access_token');

    // Admin endpoints strictly prioritize admin_access_token
    const token = isAdminRoute ? (adminToken || customerToken) : customerToken;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const isAdminRoute =
        error.config?.url?.startsWith('/admin') ||
        (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

      if (isAdminRoute) {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_user_info');
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
      }
    }
    return Promise.reject(error);
  }
);
