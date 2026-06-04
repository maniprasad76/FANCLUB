import axios from 'axios';
import toast from 'react-hot-toast';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_URL.includes('localhost') && typeof window !== 'undefined') {
  API_URL = API_URL.replace('localhost', window.location.hostname);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies with every request
});

// Request interceptor: inject access_token as Authorization header (cross-domain fallback)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Token refresh mechanism:
 * When a 401 occurs, we try to refresh the token using the stored refresh_token.
 * If refresh succeeds, we retry the original request automatically.
 * If refresh fails, we clear the session and let the user re-login.
 */
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(undefined);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 errors, and not on auth endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/signin') &&
      !originalRequest.url?.includes('/auth/signup') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/logout')
    ) {
      if (isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = sessionStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        // Store the new tokens and updated user data
        if (data.session?.access_token) {
          sessionStorage.setItem('access_token', data.session.access_token);
        }
        if (data.session?.refresh_token) {
          sessionStorage.setItem('refresh_token', data.session.refresh_token);
        }
        if (data.user) {
          sessionStorage.setItem('user', JSON.stringify(data.user));
        }

        processQueue(null);

        // Retry the original request (cookie is now updated by the server)
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Refresh failed — clear everything and force re-login
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('access_token');

        // Dispatch a custom event so AuthContext can react
        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // For non-401 errors or auth endpoint 401s, just reject normally
    if (error.response?.status === 401) {
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('access_token');
    } else if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
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
