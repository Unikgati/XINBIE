import { useState, useEffect, useCallback, useRef } from 'react';
import { apiGet } from './api';

/**
 * Hook for fetching data with proper StrictMode cleanup.
 * Prevents double-fetch and double-toast in React dev mode.
 */
export function useApiData<T>(
  path: string | null,
  deps: any[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!path) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/admin${path}`,
        {
          headers: { 'Authorization': `Bearer ${await getTokenSafe()}` },
          signal,
        }
      );
      if (signal?.aborted) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const json = await res.json();
      if (!signal?.aborted) setData(json);
    } catch (err: any) {
      if (err.name === 'AbortError') return; // StrictMode cleanup, ignore
      if (!signal?.aborted) setError(err.message || 'Gagal memuat data');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [path, ...deps]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(), [fetchData]);

  return { data, loading, error, refetch };
}

// Token cache (reuse from api.ts)
let _token: string | null = null;
async function getTokenSafe(): Promise<string> {
  if (_token) return _token;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dapurgizi.com', password: 'Admin123!' }),
    }
  );
  const data = await res.json();
  _token = data.accessToken;
  return _token!;
}
