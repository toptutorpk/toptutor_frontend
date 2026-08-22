import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';

/**
 * Central Axios instance. All real backend calls flow through here.
 *
 * The backend wraps every response in a standard envelope
 * (`{ success, message, data, error, correlationId, timestamp }`), so the typed `http`
 * helpers below unwrap `.data` for callers. Access + refresh tokens are persisted in
 * localStorage; a 401 transparently triggers a single refresh-and-retry.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    // ngrok free tier otherwise returns an HTML "browser warning" page instead
    // of the JSON body; this header tells ngrok to skip it. Harmless off-ngrok.
    'ngrok-skip-browser-warning': 'true',
  },
});

/** The envelope every backend endpoint returns. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  error?: {
    code: string;
    status: number;
    path: string;
    fieldErrors?: { field: string; message: string }[];
  } | null;
  correlationId?: string;
  timestamp?: string;
}

/** Error thrown by the `http` helpers, carrying the backend's machine-readable code/message. */
export class ApiError extends Error {
  code: string;
  status?: number;
  fieldErrors?: { field: string; message: string }[];

  constructor(
    message: string,
    code: string,
    status?: number,
    fieldErrors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// ---- Token storage ----------------------------------------------------------
const ACCESS_KEY = 'toptutor.token';
const REFRESH_KEY = 'toptutor.refresh';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens(accessToken: string | null, refreshToken?: string | null) {
  try {
    if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken);
    else localStorage.removeItem(ACCESS_KEY);
    if (refreshToken !== undefined) {
      if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
      else localStorage.removeItem(REFRESH_KEY);
    }
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function clearTokens() {
  setTokens(null, null);
}

// ---- Session-ended notification ---------------------------------------------

/** Why the session ended, so the login screen can say something specific. */
export type SessionEndedReason = 'IDLE_TIMEOUT' | 'SESSION_EXPIRED' | 'INVALID';

type SessionEndedHandler = (reason: SessionEndedReason) => void;
const sessionEndedHandlers = new Set<SessionEndedHandler>();

/**
 * Subscribes to sessions ending for a reason other than the user asking.
 *
 * <p>An event rather than a direct call because this module cannot reach the auth store: the store
 * imports the services, which import this client, and closing that loop would be a cycle. The
 * listener also has to be inside the router to navigate, which this file is not.
 */
export function onSessionEnded(handler: SessionEndedHandler): () => void {
  sessionEndedHandlers.add(handler);
  return () => sessionEndedHandlers.delete(handler);
}

/**
 * Drops the tokens and tells the app the session is over.
 *
 * <p>Clearing storage was never enough on its own. The auth store keeps its own persisted
 * `isAuthenticated`, so a silent token clear left the app convinced someone was signed in while
 * every request came back 401 — a dashboard that renders but does nothing, with no explanation.
 */
export function endSession(reason: SessionEndedReason) {
  clearTokens();
  sessionEndedHandlers.forEach((handler) => handler(reason));
}

/** Back-compat helper used by a few callers that only care about the access token. */
export function setStoredToken(token: string | null) {
  setTokens(token);
}

// ---- Interceptors -----------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.set?.('Authorization', `Bearer ${token}`);
  return config;
});

// Endpoints that must never trigger a refresh-retry loop.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/tutors/register', '/tutors/verify-otp'];

let inflightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${env.apiBaseUrl}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' } },
    );
    const tokens = res.data.data;
    setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens.accessToken;
  } catch (e) {
    // The server distinguishes "you were away too long" from "this token is not valid", and the
    // difference is the whole message the person gets on the login screen.
    const code = (e as AxiosError<ApiEnvelope<unknown>>)?.response?.data?.error?.code;
    endSession(
      code === 'SESSION_IDLE_TIMEOUT'
        ? 'IDLE_TIMEOUT'
        : code === 'SESSION_EXPIRED'
          ? 'SESSION_EXPIRED'
          : 'INVALID',
    );
    return null;
  }
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthPath = NO_REFRESH_PATHS.some((p) => url.includes(p));

    // Transparent single refresh-and-retry on 401 for non-auth endpoints.
    if (status === 401 && original && !original._retried && !isAuthPath && getRefreshToken()) {
      original._retried = true;
      inflightRefresh = inflightRefresh ?? refreshAccessToken();
      const newToken = await inflightRefresh;
      inflightRefresh = null;
      if (newToken) {
        original.headers.set?.('Authorization', `Bearer ${newToken}`);
        return apiClient(original);
      }
      // refreshAccessToken has already ended the session and said why; clearing again here would
      // only fire a second, less specific notification.
    }

    // Normalise the backend error envelope into a typed ApiError.
    const envelope = error.response?.data;
    if (envelope && typeof envelope === 'object' && 'error' in envelope && envelope.error) {
      return Promise.reject(
        new ApiError(
          envelope.message || 'Request failed',
          envelope.error.code,
          envelope.error.status,
          envelope.error.fieldErrors,
        ),
      );
    }
    return Promise.reject(error);
  },
);

// ---- Typed helpers ----------------------------------------------------------
// Unwrap the envelope so callers get the payload directly.
export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.get<ApiEnvelope<T>>(url, config);
    return res.data.data;
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.post<ApiEnvelope<T>>(url, body, config);
    return res.data.data;
  },
  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.put<ApiEnvelope<T>>(url, body, config);
    return res.data.data;
  },
  async del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.delete<ApiEnvelope<T>>(url, config);
    return res.data.data;
  },
  /** Multipart upload. Axios sets the multipart boundary itself when given FormData. */
  async upload<T>(url: string, form: FormData, onProgress?: (percent: number) => void): Promise<T> {
    const res = await apiClient.post<ApiEnvelope<T>>(url, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data.data;
  },
};
