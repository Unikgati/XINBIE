const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiException extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
  }
}

function getTokens(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  try {
    const stored = localStorage.getItem('dapurgizi-auth');
    if (!stored) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(stored);
    return {
      accessToken: parsed?.state?.accessToken || null,
      refreshToken: parsed?.state?.refreshToken || null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('dapurgizi-auth');
    const parsed = stored ? JSON.parse(stored) : { state: {} };
    parsed.state.accessToken = accessToken;
    parsed.state.refreshToken = refreshToken;
    localStorage.setItem('dapurgizi-auth', JSON.stringify(parsed));
  } catch { /* ignore */ }
}

function clearTokens() {
  if (typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem('dapurgizi-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.state.accessToken = null;
      parsed.state.refreshToken = null;
      parsed.state.user = null;
      localStorage.setItem('dapurgizi-auth', JSON.stringify(parsed));
    }
  } catch { /* ignore */ }
}

function buildHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiException(
      data.message || data.error || `Request failed (${response.status})`,
      response.status
    );
  }
  return data as T;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const { refreshToken } = getTokens();
    if (!refreshToken) {
      clearTokens();
      return false;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        return false;
      }

      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request<T>(method: string, path: string, body?: any, retry = true): Promise<T> {
  const { accessToken } = getTokens();
  const headers = buildHeaders(accessToken);

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // If 401 and we have a refresh token → try refresh then retry once
  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(method, path, body, false);
    }
    // Refresh failed → redirect to login
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  return handleResponse<T>(res);
}

export const api = {
  post: <T = any>(path: string, body?: any) => request<T>('POST', path, body),
  get: <T = any>(path: string) => request<T>('GET', path),
  put: <T = any>(path: string, body?: any) => request<T>('PUT', path, body),
  delete: <T = any>(path: string) => request<T>('DELETE', path),
};
