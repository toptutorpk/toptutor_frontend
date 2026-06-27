import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

/**
 * Central Axios instance. All real backend calls flow through here.
 * Token is read lazily from localStorage so the auth store stays decoupled.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'toptutor.token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore quota / privacy mode */
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) config.headers.set?.('Authorization', `Bearer ${token}`);
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      setStoredToken(null);
      // A real app would redirect to /login here via a router event.
    }
    return Promise.reject(error);
  },
);
