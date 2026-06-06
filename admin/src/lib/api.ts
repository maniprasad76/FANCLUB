import axios from 'axios';
import toast from 'react-hot-toast';

let API_URL = import.meta.env.VITE_API_URL || 'https://fanclub-backend.onrender.com/api';
if (API_URL.includes('localhost') && typeof window !== 'undefined') {
  API_URL = API_URL.replace('localhost', window.location.hostname);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request interceptor: inject access_token as Authorization header (cross-domain fallback)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Token refresh for admin panel.
 * Same mechanism as the frontend — retry failed 401 requests after refreshing the token.
 */
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(undefined);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/admin/signin') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        if (data.session?.access_token) {
          localStorage.setItem('admin_access_token', data.session.access_token);
        }
        if (data.session?.refresh_token) {
          localStorage.setItem('admin_refresh_token', data.session.refresh_token);
        }
        if (data.user) {
          localStorage.setItem('admin_user', JSON.stringify(data.user));
        }

        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_access_token');
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('admin_user');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('admin_access_token');
    } else if (error.response) {
      const status = error.response.status;
      
      // Global error toasts
      if (status === 413) {
        toast.error('File is too large. Please select a smaller file.');
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else if (status >= 500) {
        toast.error('An unexpected server error occurred. Please try again later.');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
