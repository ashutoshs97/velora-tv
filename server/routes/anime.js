import express from 'express';
import axios from 'axios';

const router = express.Router();
const JIKAN = 'https://api.jikan.moe/v4';
const ANIPUB = 'https://anipub.xyz';

// ── In-memory cache to stay within Jikan's 60 req/min rate limit ──────────
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const _streamCache = new Map();
const STREAM_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

async function jikan(path) {
  const hit = _cache.get(path);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;

  const res = await axios.get(JIKAN + path, { timeout: 15000 });
  _cache.set(path, { data: res.data, ts: Date.now() });
  return res.data;
}

function toSlug(title = '') {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function normalizeSrc(link = '') {
  const raw = String(link || '').trim();
  if (!raw) return '';

  const withoutPrefix = raw.startsWith('src=') ? raw.slice(4) : raw;
  if (withoutPrefix.startsWith('//')) return `https:${withoutPrefix}`;
  if (withoutPrefix.startsWith('http://') || withoutPrefix.startsWith('https://')) return withoutPrefix;
  return '';
}

function parseEpisodeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : fallback;
}

function mergeEpisodeSource(episodeMap, ep, url, provider) {
  if (!ep || !url) return;

  const existing = episodeMap.get(ep) || {
    ep,
    src: '',
    urls: [],
    providers: [],
  };

  if (!existing.urls.includes(url)) {
    existing.urls.push(url);
    existing.providers.push(provider);
  }

  if (!existing.src) {
    existing.src = url;
  }

  episodeMap.set(ep, existing);
}

function extractSectionSources(episodeMap, section, sectionName) {
  if (!section || typeof section !== 'object') return;

  const provider = section.name || sectionName;

  const firstLink = normalizeSrc(section.link);
  if (firstLink) {
    mergeEpisodeSource(episodeMap, 1, firstLink, provider);
  }

  const entries = Array.isArray(section.ep) ? section.ep : [];
  entries.forEach((entry, index) => {
    const src = normalizeSrc(entry?.link || entry?.src || '');
    const ep = parseEpisodeNumber(
      entry?.ep || entry?.episode || entry?.episode_id || entry?.number,
      index + 2
    );
    mergeEpisodeSource(episodeMap, ep, src, provider);
  });
}

function buildEpisodeSources(details) {
  const sections = ['local', 'sub', 'dub', 'raw'];
  const episodeMap = new Map();

  sections.forEach((key) => extractSectionSources(episodeMap, details?.[key], key));

  return Array.from(episodeMap.values()).sort((a, b) => a.ep - b.ep);
}

async function tryAniPubFind(name) {
  const findRes = await axios.get(`${ANIPUB}/api/find/${encodeURIComponent(name)}`, {
    timeout: 12000,
  });

  const match = findRes.data;
  if (!match?.exist || !match?.id) return null;

  const detailsRes = await axios.get(`${ANIPUB}/v1/api/details/${match.id}`, {
    timeout: 12000,
  });

  const details = detailsRes.data;
  const episodes = buildEpisodeSources(details);
  if (!episodes.length) return null;

  return {
    sourceName: details?.local?.name || details?.sub?.name || name,
    sourceId: match.id,
    episodes,
  };
}

async function tryAniPubSlug(name) {
  const slug = toSlug(name);
  if (!slug) return null;

  const infoRes = await axios.get(`${ANIPUB}/api/info/${encodeURIComponent(slug)}`, {
    timeout: 12000,
  });

  const info = infoRes.data;
  if (!info?._id) return null;

  const detailsRes = await axios.get(`${ANIPUB}/v1/api/details/${info._id}`, {
    timeout: 12000,
  });

  const details = detailsRes.data;
  const episodes = buildEpisodeSources(details);
  if (!episodes.length) return null;

  return {
    sourceName: details?.local?.name || details?.sub?.name || info?.Name || slug,
    sourceId: info._id,
    episodes,
  };
}

async function resolveAniPubStream(candidateNames) {
  const errors = [];

  for (const name of candidateNames) {
    try {
      const direct = await tryAniPubFind(name);
      if (direct) return direct;
    } catch (error) {
      errors.push(`find:${name}:${error.message}`);
    }

    try {
      const slug = await tryAniPubSlug(name);
      if (slug) return slug;
    } catch (error) {
      errors.push(`slug:${name}:${error.message}`);
    }
  }

  const err = new Error('No playable episodes found from providers');
  err.details = errors;
  throw err;
}

function getCachedStream(key) {
  const hit = _streamCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > STREAM_CACHE_TTL) {
    _streamCache.delete(key);
    return null;
  }
  return hit.data;
}

// ── Endpoint handlers ──────────────────────────────────────────────────────
router.get('/schedule',     async (_, res) => {
  try { res.json(await jikan('/schedules')); }
  catch (e) { res.status(502).json({ error: 'Jikan error', detail: e.message }); }
});

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

router.get('/:id/stream', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `stream:${id}`;
    const cached = getCachedStream(cacheKey);
    if (cached) return res.json(cached);

    const details = await jikan(`/anime/${id}/full`);
    const anime = details?.data || {};

    const candidateNames = [
      anime?.title_english,
      anime?.title,
      anime?.title_japanese,
    ].filter(Boolean);

    if (!candidateNames.length) {
      return res.status(404).json({ error: 'No anime titles available for stream lookup.' });
    }

    const resolved = await resolveAniPubStream(candidateNames);
    const payload = {
      malId: Number(id),
      sourceName: resolved.sourceName,
      sourceId: resolved.sourceId,
      episodes: resolved.episodes,
      providers: Array.from(new Set(resolved.episodes.flatMap((ep) => ep.providers || []))),
    };

    _streamCache.set(cacheKey, { data: payload, ts: Date.now() });
    return res.json(payload);
  } catch (e) {
    return res.status(502).json({
      error: 'Anime stream source unavailable',
      detail: e.message,
      providerErrors: e.details || [],
    });
  }
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
