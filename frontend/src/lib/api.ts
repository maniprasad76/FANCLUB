import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
if (API_URL.includes('localhost') && typeof window !== 'undefined') {
  API_URL = API_URL.replace('localhost', window.location.hostname);
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies with every request
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
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true }
        );

        // Store the new refresh_token and updated user data
        if (data.session?.refresh_token) {
          localStorage.setItem('refresh_token', data.session.refresh_token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        processQueue(null);

        // Retry the original request (cookie is now updated by the server)
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        // Refresh failed — clear everything and force re-login
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');

        // Dispatch a custom event so AuthContext can react
        window.dispatchEvent(new CustomEvent('auth:session-expired'));

        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // For non-401 errors or auth endpoint 401s, just reject normally
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('refresh_token');
    }

    return Promise.reject(error);
  }
);

export default api;
