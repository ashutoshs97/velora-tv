import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

// ── Warn immediately if API key is missing ────────────────────────────────
if (!API_KEY) {
  console.warn('⚠️  TMDB_API_KEY is not set — movie routes will not work');
}

// ── Simple in-memory cache ────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  // Keep cache size reasonable — max 100 entries
  if (cache.size >= 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Safe type validator ───────────────────────────────────────────────────
function getSafeType(raw) {
  return raw === 'tv' ? 'tv' : 'movie';
}

// ── Filter out unreleased items ───────────────────────────────────────────
const filterUnreleased = (results) => {
  if (!Array.isArray(results)) return results;
  const now = new Date();
  return results.filter(item => {
    const dateStr = item.release_date || item.first_air_date;
    if (!dateStr) return true;
    return new Date(dateStr) <= now;
  });
};

// ── Central TMDB fetch with timeout + caching ─────────────────────────────
const tmdbFetch = async (path, params = {}, useCache = true) => {
  // No API key — fail fast with clear message
  if (!API_KEY) {
    throw new Error('TMDB API key is not configured');
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const cacheKey = url.toString();

  // Return cached data if available
  if (useCache) {
    const cached = getCached(cacheKey);
    if (cached) return cached;
  }

  // Timeout after 10 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });

    // Handle rate limiting specifically
    if (res.status === 429) {
      throw new Error('TMDB rate limit reached — please try again shortly');
    }

    if (!res.ok) {
      throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    // Filter unreleased items from lists
    if (data.results) {
      data.results = filterUnreleased(data.results);
    }

    // Cache the result
    if (useCache) setCache(cacheKey, data);

    return data;

  } catch (err) {
    // Timeout error — friendlier message
    if (err.name === 'AbortError') {
      throw new Error('TMDB request timed out — please try again');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

// ─────────────────────────────────────────────────────────────────────────
// ⚠️  SPECIFIC routes MUST come before /:id wildcard routes
// ─────────────────────────────────────────────────────────────────────────

// GET /api/movies/trending
router.get('/trending', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/movie/week');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/trending-tv
router.get('/trending-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/tv/week');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/popular
router.get('/popular', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/popular');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/popular-tv
router.get('/popular-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/popular');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/top-rated
router.get('/top-rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/top-rated-tv
router.get('/top-rated-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/top_rated');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/on-air-tv
router.get('/on-air-tv', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/on_the_air');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /api/movies/new-releases ← was getting blocked by /:id before
router.get('/new-releases', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString().split('T')[0];
    const data = await tmdbFetch('/discover/movie', {
      'primary_release_date.gte': monthAgo,
      'primary_release_date.lte': today,
      sort_by: 'popularity.desc',
      'vote_count.gte': 50,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/search?q=query
router.get('/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  // Limit page to reasonable range
  const safePage = Math.min(Math.max(Number(page) || 1, 1), 500);
  try {
    const data = await tmdbFetch(
      '/search/multi',
      { query: q.trim(), page: safePage },
      false // ← don't cache search results
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/genre/:id
router.get('/genre/:id', async (req, res) => {
  const { id } = req.params;
  // Validate genre id is a number
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid genre id' });
  }
  try {
    const data = await tmdbFetch('/discover/movie', {
      with_genres: id,
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Each mood has ONE primary genre (OR logic via separate calls) ──────
const MOOD_GENRES = {
  action: [28],    // Action
  comedy: [35],    // Comedy
  romance: [10749], // Romance
  horror: [27],    // Horror
  scifi: [878],   // Science Fiction
  animated: [16],    // Animation
  thriller: [53],    // Thriller
  documentary: [99],    // Documentary
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
      with_genres: genres.join('|'), // ← | means OR not AND
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
      'vote_average.gte': 6.0,       // ← only decent rated movies
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/tv/:id — full TV detail
router.get('/tv/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid TV show id' });
  }
  try {
    const [detail, credits] = await Promise.allSettled([
      tmdbFetch(`/tv/${id}`, { append_to_response: 'videos' }),
      tmdbFetch(`/tv/${id}/credits`),
    ]);

    // Detail is required — fail if it errored
    if (detail.status === 'rejected') {
      throw new Error(detail.reason?.message || 'Failed to fetch TV details');
    }

    // Credits are optional — use empty object if failed
    const creditsData = credits.status === 'fulfilled'
      ? credits.value
      : { cast: [], crew: [] };

    res.json({ ...detail.value, credits: creditsData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/person/:id — full person detail with combined credits
router.get('/person/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid person id' });
  }
  try {
    const data = await tmdbFetch(`/person/${id}`, { append_to_response: 'combined_credits' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// ⚠️  Wildcard routes — MUST be last
// ─────────────────────────────────────────────────────────────────────────

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  const { id } = req.params;
  const type = getSafeType(req.query.type);
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const path = type === 'tv'
      ? `/tv/${id}/similar`
      : `/movie/${id}/similar`;
    const data = await tmdbFetch(path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/recommendations
router.get('/:id/recommendations', async (req, res) => {
  const { id } = req.params;
  const type = getSafeType(req.query.type);
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const path = type === 'tv'
      ? `/tv/${id}/recommendations`
      : `/movie/${id}/recommendations`;
    const data = await tmdbFetch(path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id — full movie detail (MUST BE LAST)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid movie id' });
  }
  try {
    const [detail, credits] = await Promise.allSettled([
      tmdbFetch(`/movie/${id}`, { append_to_response: 'videos' }),
      tmdbFetch(`/movie/${id}/credits`),
    ]);

    // Detail is required
    if (detail.status === 'rejected') {
      throw new Error(detail.reason?.message || 'Failed to fetch movie details');
    }

    // Credits are optional
    const creditsData = credits.status === 'fulfilled'
      ? credits.value
      : { cast: [], crew: [] };

    res.json({ ...detail.value, credits: creditsData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;