import fetch from 'node-fetch';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
  console.warn('TMDB_API_KEY is not set — movie routes will not work');
}

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_MAX = 100;

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// Clean expired cache every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) cache.delete(key);
  }
}, 10 * 60 * 1000);

function filterUnreleased(results) {
  if (!Array.isArray(results)) return results;
  const now = new Date();
  return results.filter(item => {
    const dateStr = item.release_date || item.first_air_date;
    if (!dateStr) return true;
    return new Date(dateStr) <= now;
  });
}

export async function tmdbFetch(path, params = {}, useCache = true) {
  if (!API_KEY) throw new Error('TMDB API key is not configured');

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const cacheKey = url.toString();
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    if (res.status === 429) {
      const err = new Error('TMDB rate limit reached — please try again shortly');
      err.status = 429;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(`TMDB error: ${res.status} ${res.statusText}`);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (data.results) data.results = filterUnreleased(data.results);
    if (useCache) setCache(cacheKey, data);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('TMDB request timed out — please try again');
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
