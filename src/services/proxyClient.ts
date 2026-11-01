/**
 * Centralized API proxy fetcher with client-side caching and error handling
 */

const memoryCache = new Map<string, { data: any; expiry: number }>();
const CLIENT_CACHE_TTL = 30 * 1000; // 30 seconds

export async function fetchProxiedJson<T>(targetUrl: string, options?: { signal?: AbortSignal; cacheTtl?: number }): Promise<T> {
  const cacheKey = targetUrl;
  const now = Date.now();
  const cached = memoryCache.get(cacheKey);

  if (cached && cached.expiry > now) {
    return cached.data as T;
  }

  // Construct request to our Express proxy
  const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
  const proxyUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxyUrl, {
      signal: options?.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson: any;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { message: errorText };
      }
      throw new Error(errorJson.message || `Proxy request failed with status ${response.status}`);
    }

    const data = await response.json();
    memoryCache.set(cacheKey, {
      data,
      expiry: now + (options?.cacheTtl ?? CLIENT_CACHE_TTL),
    });

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn(`[ProxyClient] Error requesting ${targetUrl}:`, err.message);
    throw err;
  }
}
