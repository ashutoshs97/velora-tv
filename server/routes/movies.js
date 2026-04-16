import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

const tmdbFetch = async (path, params = {}) => {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status} ${res.statusText}`);
  return res.json();
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

export default router;
