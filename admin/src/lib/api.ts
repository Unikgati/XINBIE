const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('xinbie_admin_token');
  }
  return null;
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('xinbie_admin_token', token);
    // Sync to cookie for middleware auth check
    document.cookie = `admin_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('xinbie_admin_token');
    // Remove cookie
    document.cookie = 'admin_token=; path=/; max-age=0';
  }
}

export async function api<T = any>(path: string, options?: RequestInit & { noAuth?: boolean }): Promise<T> {
  const { noAuth, ...fetchOptions } = options || {};

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!noAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const isAuthRoute = path.startsWith('/auth/');
  const endpoint = isAuthRoute ? path : `/admin${path}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401 && !isAuthRoute) {
    clearAuthToken();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Sesi Anda telah berakhir, silakan login kembali.');
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errBody.message || `HTTP ${res.status}`);
  }

  // Handle 204 No Content
  if (res.status === 204) return {} as T;
  return res.json();
}

// Convenience methods
export const apiGet = <T = any>(path: string) => api<T>(path);
export const apiPost = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });
export const apiPut = <T = any>(path: string, body?: any) =>
  api<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) });
export const apiDelete = <T = any>(path: string) =>
  api<T>(path, { method: 'DELETE' });
