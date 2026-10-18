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
  // Send cookies on cross-origin calls. In cookie mode the backend delivers the refresh token in an
  // HttpOnly cookie (never readable by this code) and the CSRF cookie the refresh/logout endpoints
  // check; both only travel with credentials enabled. Harmless when the backend runs in body mode.
  withCredentials: true,
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
const CSRF_KEY = 'toptutor.csrf';

// ---- CSRF double-submit token -----------------------------------------------
// In cookie mode the backend sets an HttpOnly refresh cookie and a matching CSRF cookie, and
// echoes the CSRF value in the `X-CSRF-Token` response header. A cookie set on the API host is not
// readable by this code when the app is on a different host, so we read the token from that header
// and send it back on the cookie-authenticated endpoints. It is persisted (not a secret against
// XSS — that is the CSP's job) so a page reload can still refresh the session before re-login.
let csrfToken: string | null = (() => {
  try {
    return localStorage.getItem(CSRF_KEY);
  } catch {
    return null;
  }
})();

function rememberCsrfToken(value: string | null | undefined) {
  if (!value) return;
  csrfToken = value;
  try {
    localStorage.setItem(CSRF_KEY, value);
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Picks the CSRF token out of a response's headers, if present, and remembers it. */
function captureCsrf(headers: unknown) {
  const h = headers as { [k: string]: string } | { get?: (k: string) => string | null } | undefined;
  if (!h) return;
  const value =
    typeof (h as { get?: (k: string) => string | null }).get === 'function'
      ? (h as { get: (k: string) => string | null }).get('x-csrf-token')
      : (h as { [k: string]: string })['x-csrf-token'];
  rememberCsrfToken(value);
}

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
  csrfToken = null;
  try {
    localStorage.removeItem(CSRF_KEY);
  } catch {
    /* ignore */
  }
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
  // Echo the CSRF token so the cookie-authenticated refresh/logout endpoints accept the request.
  // Sent on every call for simplicity; ignored everywhere but those two endpoints.
  if (csrfToken) config.headers.set?.('X-CSRF-Token', csrfToken);
  return config;
});

// Endpoints that must never trigger a refresh-retry loop.
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/tutors/register', '/tutors/verify-otp'];

let inflightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // In cookie mode there is no stored refresh token — the HttpOnly cookie carries it, so we always
  // attempt the refresh and let the server decide. In body mode the stored token is sent along.
  const refreshToken = getRefreshToken();
  try {
    const res = await axios.post<ApiEnvelope<{ accessToken: string; refreshToken?: string }>>(
      `${env.apiBaseUrl}/auth/refresh`,
      refreshToken ? { refreshToken } : {},
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        },
      },
    );
    captureCsrf(res.headers);
    const tokens = res.data.data;
    setTokens(tokens.accessToken, tokens.refreshToken ?? null);
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
  (res) => {
    // Auth responses carry a fresh CSRF token in a header — capture it for the next refresh/logout.
    captureCsrf(res.headers);
    return res;
  },
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthPath = NO_REFRESH_PATHS.some((p) => url.includes(p));

    // Transparent single refresh-and-retry on 401 for non-auth endpoints. Attempted whenever we
    // believe a session exists — an access token (both modes) or a stored refresh token (body mode);
    // in cookie mode the refresh token lives in an HttpOnly cookie this code cannot see.
    const hasSession = Boolean(getAccessToken() || getRefreshToken());
    if (status === 401 && original && !original._retried && !isAuthPath && hasSession) {
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
/** One page of a list endpoint, with the paging metadata the server sends in headers. */
export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  hasMore: boolean;
}

/** One keyset page (message threads): pass `nextCursor` back as `before` to walk into history. */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

function header(headers: unknown, name: string): string | null {
  const h = headers as { get?: (k: string) => string | null } | Record<string, string> | undefined;
  if (!h) return null;
  const value =
    typeof (h as { get?: unknown }).get === 'function'
      ? (h as { get: (k: string) => string | null }).get(name)
      : (h as Record<string, string>)[name];
  return value ?? null;
}

/** Hard ceiling on chunked "fetch everything" reads — matches the server's max page size. */
const MAX_PAGE_SIZE = 100;
const MAX_CHUNKED_PAGES = 50;

export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await apiClient.get<ApiEnvelope<T>>(url, config);
    return res.data.data;
  },
  /**
   * A list endpoint as one page. Every list the server returns is bounded (default 50 rows, max
   * 100) and describes itself in `X-Page`, `X-Page-Size`, `X-Total-Count` and `X-Has-More` headers;
   * the body stays a plain array, which is why `http.get` on the same URL still works and simply
   * receives the first page.
   */
  async getPage<T>(url: string, config?: AxiosRequestConfig): Promise<Page<T>> {
    const res = await apiClient.get<ApiEnvelope<T[]>>(url, config);
    const items = res.data.data ?? [];
    return {
      items,
      page: Number(header(res.headers, 'x-page') ?? 0),
      size: Number(header(res.headers, 'x-page-size') ?? items.length),
      total: Number(header(res.headers, 'x-total-count') ?? items.length),
      hasMore: header(res.headers, 'x-has-more') === 'true',
    };
  },
  /**
   * Every row of a list, fetched in server-sized chunks. For internal screens (admin consoles)
   * that render the whole set: each request stays bounded, and a runaway set stops at a ceiling
   * instead of hanging the tab.
   */
  async getAllPages<T>(url: string, config?: AxiosRequestConfig): Promise<T[]> {
    const all: T[] = [];
    for (let page = 0; page < MAX_CHUNKED_PAGES; page++) {
      const chunk = await http.getPage<T>(url, {
        ...config,
        params: { ...(config?.params ?? {}), page, size: MAX_PAGE_SIZE },
      });
      all.push(...chunk.items);
      if (!chunk.hasMore) break;
    }
    return all;
  },
  /** A keyset page: the newest rows, or the rows before `before` when given. */
  async getCursorPage<T>(url: string, config?: AxiosRequestConfig): Promise<CursorPage<T>> {
    const res = await apiClient.get<ApiEnvelope<T[]>>(url, config);
    return {
      items: res.data.data ?? [],
      nextCursor: header(res.headers, 'x-next-cursor'),
      hasMore: header(res.headers, 'x-has-more') === 'true',
    };
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
