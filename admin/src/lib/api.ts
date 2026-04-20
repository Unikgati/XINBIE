const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Temporary: hardcoded admin token for development (no login page yet)
let adminToken: string | null = null;

async function getToken(): Promise<string> {
  if (adminToken) return adminToken;

  // Auto-login as admin in dev mode
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@dapurgizi.com', password: 'Admin123!' }),
  });
  const data = await res.json();
  adminToken = data.accessToken;
  return adminToken!;
}

export async function api<T = any>(path: string, options?: RequestInit & { noAuth?: boolean }): Promise<T> {
  const { noAuth, ...fetchOptions } = options || {};

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  if (!noAuth) {
    const token = await getToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const res = await fetch(`${API_BASE}/admin${path}`, {
    ...fetchOptions,
    headers,
  });

  if (res.status === 401) {
    // Token expired — retry login
    adminToken = null;
    const token = await getToken();
    headers['Authorization'] = `Bearer ${token}`;
    const retryRes = await fetch(`${API_BASE}/admin${path}`, { ...fetchOptions, headers });
    if (!retryRes.ok) throw new Error(await retryRes.text());
    return retryRes.json();
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
