import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;
const IS_PROD = process.env.NODE_ENV === 'production';

if (!API_KEY) {
  console.warn('TMDB_API_KEY is not set — movie routes will not work');
}

// in-memory cache
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

// clean expired cache every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) cache.delete(key);
  }
}, 10 * 60 * 1000);

function getSafeType(raw) {
  return raw === 'tv' ? 'tv' : 'movie';
}

function isValidId(id) {
  if (!/^\d+$/.test(String(id))) return false;
  return Number(id) > 0;
}

function clientError(err) {
  return IS_PROD ? 'Something went wrong — please try again' : err.message;
}

// tells Cloudflare and browsers how long to cache
function setCacheHeaders(res, seconds = 300) {
  res.set('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
}

function filterUnreleased(results) {
  if (!Array.isArray(results)) return results;
  const now = new Date();
  return results.filter(item => {
    const dateStr = item.release_date || item.first_air_date;
    if (!dateStr) return true;
    return new Date(dateStr) <= now;
  });
}

async function tmdbFetch(path, params = {}, useCache = true) {
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
    if (res.status === 429) throw new Error('TMDB rate limit reached — please try again shortly');
    if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (data.results) data.results = filterUnreleased(data.results);
    if (useCache) setCache(cacheKey, data);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('TMDB request timed out — please try again');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// specific routes first

router.get('/surprise', async (req, res) => {
  try {
    const isTv = Math.random() > 0.5;
    const path = isTv ? '/discover/tv' : '/discover/movie';
    const randomPage = Math.floor(Math.random() * 500) + 1;
    const data = await tmdbFetch(path, {
      sort_by: 'popularity.desc',
      page: randomPage,
      'vote_count.gte': 100,
    });
    if (!data?.results?.length) {
      return res.status(404).json({ error: 'No results found' });
    }
    const randomResult = data.results[Math.floor(Math.random() * data.results.length)];
    randomResult.media_type = isTv ? 'tv' : 'movie';
    res.json(randomResult);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/trending', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/movie/week');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/trending-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/tv/week');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/popular', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/popular');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/popular-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/popular');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/top-rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/top-rated-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/top_rated');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/on-air-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/on_the_air');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/new-releases', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const data = await tmdbFetch('/discover/tv', {
      'first_air_date.gte': monthAgo,
      'first_air_date.lte': today,
      sort_by: 'popularity.desc',
      'vote_count.gte': 20,
    });
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  const safeQuery = q.trim().substring(0, 150);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), 500);
  try {
    const data = await tmdbFetch('/search/multi', { query: safeQuery, page: safePage }, false);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/genre/:id', async (req, res) => {
  const { id } = req.params;
  const { type = 'movie' } = req.query;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid genre id' });
  }
  try {
    const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie';
    const data = await tmdbFetch(endpoint, {
      with_genres: id,
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
    });
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

const MOOD_GENRES = {
  action:      [28],
  comedy:      [35],
  romance:     [10749],
  horror:      [27],
  scifi:       [878],
  animated:    [16],
  thriller:    [53],
  documentary: [99],
};

router.get('/mood/:mood', async (req, res) => {
  const { mood } = req.params;
  const genres = MOOD_GENRES[mood?.toLowerCase()];
  if (!genres) {
    return res.status(400).json({
      error: 'Unknown mood',
      available: Object.keys(MOOD_GENRES),
    });
  }
  try {
    const data = await tmdbFetch('/discover/movie', {
      with_genres: genres.join('|'),
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
      'vote_average.gte': 6.0,
    });
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/tv/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid TV show id' });
  }
  try {
    const [detail, credits] = await Promise.allSettled([
      tmdbFetch(`/tv/${id}`, { append_to_response: 'videos' }),
      tmdbFetch(`/tv/${id}/credits`),
    ]);
    if (detail.status === 'rejected') {
      throw new Error(detail.reason?.message || 'Failed to fetch TV details');
    }
    const creditsData = credits.status === 'fulfilled'
      ? credits.value
      : { cast: [], crew: [] };
    setCacheHeaders(res, 3600);
    res.json({ ...detail.value, credits: creditsData });
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/person/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid person id' });
  }
  try {
    const data = await tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits' });
    setCacheHeaders(res, 3600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

// convert MAL ID to TMDB ID for anime
router.get('/mal-to-tmdb/:malId', async (req, res) => {
  const { malId } = req.params;
  if (!isValidId(malId)) {
    return res.status(400).json({ error: 'Invalid MAL ID' });
  }
  try {
    const data = await tmdbFetch(`/find/${malId}`, {
      external_source: 'myanimelist',
    });
    const tvResult = data?.tv_results?.[0];
    const movieResult = data?.movie_results?.[0];
    const result = tvResult || movieResult;
    if (!result) {
      return res.status(404).json({ error: 'No TMDB match found for this MAL ID' });
    }
    setCacheHeaders(res, 86400); // 24 hours — this mapping never changes
    res.json({
      tmdbId: result.id,
      type: tvResult ? 'tv' : 'movie',
      title: result.name || result.title,
    });
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

// wildcard routes must be last

router.get('/:id/similar', async (req, res) => {
  const { id } = req.params;
  const type = getSafeType(req.query.type);
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const path = type === 'tv' ? `/tv/${id}/similar` : `/movie/${id}/similar`;
    const data = await tmdbFetch(path);
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

router.get('/:id/recommendations', async (req, res) => {
  const { id } = req.params;
  const type = getSafeType(req.query.type);
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const path = type === 'tv' ? `/tv/${id}/recommendations` : `/movie/${id}/recommendations`;
    const data = await tmdbFetch(path);
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

// must be last
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid movie id' });
  }
  try {
    const [detail, credits] = await Promise.allSettled([
      tmdbFetch(`/movie/${id}`, { append_to_response: 'videos' }),
      tmdbFetch(`/movie/${id}/credits`),
    ]);
    if (detail.status === 'rejected') {
      throw new Error(detail.reason?.message || 'Failed to fetch movie details');
    }
    const creditsData = credits.status === 'fulfilled'
      ? credits.value
      : { cast: [], crew: [] };
    setCacheHeaders(res, 3600);
    res.json({ ...detail.value, credits: creditsData });
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
});

export default router;