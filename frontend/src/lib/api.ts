import axios from 'axios';
import toast from 'react-hot-toast';

let API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').trim();
if (API_URL.includes('localhost') && typeof window !== 'undefined') {
  API_URL = API_URL.replace('localhost', window.location.hostname);
}
if (!import.meta.env.VITE_API_URL && import.meta.env.DEV) {
  console.warn('[api] VITE_API_URL not set — using localhost fallback. Set this in .env for production.');
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send httpOnly cookies with every request
});

// ── Request deduplication for concurrent identical GET requests ──
// Prevents multiple components firing the same GET simultaneously
const inflightRequests = new Map<string, Promise<any>>();

function getDedupeKey(config: any): string | null {
  // Only deduplicate GET requests
  if (config.method?.toLowerCase() !== 'get') return null;
  const url = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
  const params = config.params ? JSON.stringify(config.params) : '';
  return `GET:${url}:${params}`;
}

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

/**
 * Retry a request with exponential backoff on 429 (Too Many Requests).
 * Uses Retry-After header if available, otherwise 1s/2s/4s backoff.
 */
async function retryWithBackoff(error: any, maxRetries = 3): Promise<any> {
  const config = error.config;
  if (!config) return Promise.reject(error);

  config._retryCount = (config._retryCount || 0) + 1;

  if (config._retryCount > maxRetries) {
    return Promise.reject(error);
  }

  // Use Retry-After header if the server provides it, else exponential backoff
  const retryAfter = error.response?.headers?.['retry-after'];
  const delay = retryAfter
    ? parseInt(retryAfter, 10) * 1000
    : Math.min(1000 * Math.pow(2, config._retryCount - 1), 8000);

  await new Promise((resolve) => setTimeout(resolve, delay));

  return api(config);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ── 429 Rate Limit: auto-retry with backoff ──
    if (error.response?.status === 429 && (!originalRequest._retryCount || originalRequest._retryCount < 3)) {
      return retryWithBackoff(error);
    }

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
      
      // Global error toasts
      if (status === 413) {
        toast.error('File is too large. Please select a smaller file.');
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
        // Dispatch event so pages can redirect to /access-denied if needed
        window.dispatchEvent(new CustomEvent('auth:access-denied', {
          detail: { url: error.config?.url, method: error.config?.method },
        }));
      } else if (status === 429) {
        // Only show toast after all retries are exhausted
        toast.error('Too many requests. Please try again later.');
      } else if (status >= 500) {
        toast.error('An unexpected server error occurred. Please try again later.');
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Wrapper around api.get() that deduplicates concurrent identical GET requests.
 * If a request to the same URL+params is already in-flight, the same promise is returned.
 */
const originalGet = api.get.bind(api);
api.get = function deduplicatedGet(url: string, config?: any) {
  const dedupeKey = getDedupeKey({ method: 'get', baseURL: API_URL, url, ...config });
  if (dedupeKey && inflightRequests.has(dedupeKey)) {
    return inflightRequests.get(dedupeKey)!;
  }

  const promise = originalGet(url, config).finally(() => {
    if (dedupeKey) inflightRequests.delete(dedupeKey);
  });

  if (dedupeKey) inflightRequests.set(dedupeKey, promise);
  return promise;
} as typeof api.get;

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/fanclub",
  whatsapp: "https://wa.me/917569428709",
  facebook: "https://facebook.com/fanclub",
  youtube: "https://youtube.com/@fanclub",
  twitter: "https://twitter.com/fanclub",
};

export default api;
