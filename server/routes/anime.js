import express from 'express';
import axios from 'axios';

const router = express.Router();
const JIKAN = 'https://api.jikan.moe/v4';

// ── In-memory cache to stay within Jikan's 60 req/min rate limit ──────────
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function jikan(path) {
  const hit = _cache.get(path);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const res = await axios.get(JIKAN + path, { timeout: 15000 });
  _cache.set(path, { data: res.data, ts: Date.now() });
  return res.data;
}

// ── Endpoint handlers ──────────────────────────────────────────────────────
router.get('/trending',     async (_, res) => {
  try { res.json(await jikan('/seasons/now?limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/top',          async (_, res) => {
  try { res.json(await jikan('/top/anime?limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/popular',      async (_, res) => {
  try { res.json(await jikan('/anime?order_by=popularity&sort=asc&limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/airing',       async (_, res) => {
  try { res.json(await jikan('/anime?status=airing&order_by=score&sort=desc&limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/upcoming',     async (_, res) => {
  try { res.json(await jikan('/seasons/upcoming?limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/movies',       async (_, res) => {
  try { res.json(await jikan('/top/anime?type=movie&limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/ova',          async (_, res) => {
  try { res.json(await jikan('/anime?type=ova&order_by=score&sort=desc&limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/acclaimed',    async (_, res) => {
  try { res.json(await jikan('/anime?min_score=8.5&order_by=score&sort=desc&limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/short',        async (_, res) => {
  try { res.json(await jikan('/anime?type=ona&order_by=score&sort=desc&limit=24')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/genre/:id',    async (req, res) => {
  try { res.json(await jikan(`/anime?genres=${req.params.id}&order_by=score&sort=desc&limit=24`)); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

// Must come before /:id
router.get('/genres',       async (_, res) => {
  try { res.json(await jikan('/genres/anime')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/:id/episodes', async (req, res) => {
  try {
    const { page = 1 } = req.query;
    res.json(await jikan(`/anime/${req.params.id}/episodes?page=${page}`));
  } catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

router.get('/:id',          async (req, res) => {
  try { res.json(await jikan(`/anime/${req.params.id}/full`)); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

export default router;
