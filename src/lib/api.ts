import axios from 'axios';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
export const API_BASE_URL = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory GET response cache to make tab navigation and repeated calls instant
const getCache = new Map<string, { data: any; status: number; headers: any; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds for general data

export const clearApiCache = () => {
  getCache.clear();
};

// Request interceptor to attach bearer token & serve from in-memory cache
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  const method = (config.method || 'get').toLowerCase();

  // Invalidate cache immediately on any mutating operation
  if (method !== 'get') {
    getCache.clear();
    return config;
  }

  // Check GET cache
  const isNoCache = config.headers?.['Cache-Control'] === 'no-cache';
  if (!isNoCache) {
    const paramsString = config.params ? new URLSearchParams(config.params).toString() : '';
    const cacheKey = `${config.baseURL || ''}${config.url || ''}${paramsString ? `?${paramsString}` : ''}`;
    const cached = getCache.get(cacheKey);
    const ttl = config.url?.includes('/dealerships') ? 60000 : CACHE_TTL_MS;

    if (cached && Date.now() - cached.timestamp < ttl) {
      config.adapter = () =>
        Promise.resolve({
          data: cached.data,
          status: cached.status,
          statusText: 'OK',
          headers: cached.headers,
          config,
          request: {},
        });
    }
  }

  return config;
});

// Response interceptor to handle caching & token expiry/refresh
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Store successful GET responses in cache
    const method = (response.config.method || 'get').toLowerCase();
    if (method === 'get' && response.status === 200) {
      const isNoCache = response.config.headers?.['Cache-Control'] === 'no-cache';
      if (!isNoCache) {
        const paramsString = response.config.params ? new URLSearchParams(response.config.params).toString() : '';
        const cacheKey = `${response.config.baseURL || ''}${response.config.url || ''}${paramsString ? `?${paramsString}` : ''}`;
        getCache.set(cacheKey, {
          data: response.data,
          status: response.status,
          headers: response.headers,
          timestamp: Date.now(),
        });
      }
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
