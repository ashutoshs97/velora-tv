import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const filterUnreleased = (results) => {
  if (!Array.isArray(results)) return results;
  const now = new Date();
  return results.filter(item => {
    const dateStr = item.release_date || item.first_air_date;
    if (!dateStr) return true;
    return new Date(dateStr) <= now;
  });
};

const tmdbFetch = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  
  // Conditionally strip unreleased items from any lists
  if (data.results) {
    data.results = filterUnreleased(data.results);
  }
  return data;
};

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

// GET /api/movies/search?q=query
router.get('/search', async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
  try {
    const data = await tmdbFetch('/search/multi', { query: q, page });
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

// GET /api/movies/top-rated
router.get('/top-rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/tv/:id — full tv detail
router.get('/tv/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [detail, credits] = await Promise.all([
      tmdbFetch(`/tv/${id}`, { append_to_response: 'videos' }),
      tmdbFetch(`/tv/${id}/credits`),
    ]);
    res.json({ ...detail, credits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id — full movie detail
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  // Skip if id looks like a sub-resource path (shouldn't happen but guard)
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid movie id' });
  try {
    const [detail, credits] = await Promise.all([
      tmdbFetch(`/movie/${id}`, { append_to_response: 'videos' }),
      tmdbFetch(`/movie/${id}/credits`),
    ]);
    res.json({ ...detail, credits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TMDB genre IDs map for mood collections
const MOOD_GENRES = {
  action:    [28, 12, 53],
  comedy:    [35, 10751],
  romance:   [10749, 18],
  horror:    [27, 9648],
  scifi:     [878, 14, 10765],
  animated:  [16, 10751],
  thriller:  [53, 80],
  documentary:[99],
};

// GET /api/movies/new-releases
router.get('/new-releases', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
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

// GET /api/movies/genre/:id
router.get('/genre/:id', async (req, res) => {
  const { id } = req.params;
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

// GET /api/movies/mood/:mood
router.get('/mood/:mood', async (req, res) => {
  const { mood } = req.params;
  const genres = MOOD_GENRES[mood];
  if (!genres) return res.status(400).json({ error: 'Unknown mood' });
  try {
    const data = await tmdbFetch('/discover/movie', {
      with_genres: genres.join(','),
      sort_by: 'popularity.desc',
      'vote_count.gte': 100,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/similar
router.get('/:id/similar', async (req, res) => {
  const { id } = req.params;
  const { type = 'movie' } = req.query;
  try {
    const path = type === 'tv' ? `/tv/${id}/similar` : `/movie/${id}/similar`;
    const data = await tmdbFetch(path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/movies/:id/recommendations
router.get('/:id/recommendations', async (req, res) => {
  const { id } = req.params;
  const { type = 'movie' } = req.query;
  try {
    const path = type === 'tv' ? `/tv/${id}/recommendations` : `/movie/${id}/recommendations`;
    const data = await tmdbFetch(path);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
