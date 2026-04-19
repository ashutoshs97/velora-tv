import express from 'express';
import axios from 'axios';

const router = express.Router();
const JIKAN = 'https://api.jikan.moe/v4';
const ANIPUB = 'https://anipub.xyz';
const IS_PROD = process.env.NODE_ENV === 'production';

// separate caches for metadata and streams — different TTLs
const cache = new Map();
const streamCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes — anime data changes slowly
const STREAM_CACHE_TTL = 2 * 60 * 1000; // 2 minutes — stream links expire faster

// clean expired cache entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of cache.entries()) {
    if (now - v.ts > CACHE_TTL) cache.delete(k);
  }
  for (const [k, v] of streamCache.entries()) {
    if (now - v.ts > STREAM_CACHE_TTL) streamCache.delete(k);
  }
}, 15 * 60 * 1000);

async function jikan(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  const res = await axios.get(JIKAN + path, { timeout: 15000 });
  cache.set(path, { data: res.data, ts: Date.now() });
  return res.data;
}

function clientError(err) {
  return IS_PROD ? 'Service temporarily unavailable' : err.message;
}

// tells Cloudflare and browsers how long to cache
function setCacheHeaders(res, seconds = 1800) {
  res.set('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
}

function isValidId(id) {
  if (!/^\d+$/.test(String(id))) return false;
  return Number(id) > 0;
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
  const existing = episodeMap.get(ep) || { ep, src: '', urls: [], providers: [] };
  if (!existing.urls.includes(url)) {
    existing.urls.push(url);
    existing.providers.push(provider);
  }
  if (!existing.src) existing.src = url;
  episodeMap.set(ep, existing);
}

function extractSectionSources(episodeMap, section, sectionName) {
  if (!section || typeof section !== 'object') return;
  const provider = section.name || sectionName;
  const firstLink = normalizeSrc(section.link);
  if (firstLink) mergeEpisodeSource(episodeMap, 1, firstLink, provider);
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
  const findRes = await axios.get(`${ANIPUB}/api/find/${encodeURIComponent(name)}`, { timeout: 12000 });
  const match = findRes.data;
  if (!match?.exist || !match?.id) return null;
  const detailsRes = await axios.get(`${ANIPUB}/v1/api/details/${match.id}`, { timeout: 12000 });
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
  const infoRes = await axios.get(`${ANIPUB}/api/info/${encodeURIComponent(slug)}`, { timeout: 12000 });
  const info = infoRes.data;
  if (!info?._id) return null;
  const detailsRes = await axios.get(`${ANIPUB}/v1/api/details/${info._id}`, { timeout: 12000 });
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
    } catch (err) {
      errors.push(`find:${name}:${err.message}`);
    }
    try {
      const slug = await tryAniPubSlug(name);
      if (slug) return slug;
    } catch (err) {
      errors.push(`slug:${name}:${err.message}`);
    }
  }
  const err = new Error('No playable episodes found from providers');
  err.details = errors;
  throw err;
}

function getCachedStream(key) {
  const hit = streamCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > STREAM_CACHE_TTL) {
    streamCache.delete(key);
    return null;
  }
  return hit.data;
}

// list routes — stable data, long cache

router.get('/schedule', async (_, res) => {
  try {
    const data = await jikan('/schedules');
    setCacheHeaders(res, 3600); // schedules change daily
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/trending', async (_, res) => {
  try {
    const data = await jikan('/seasons/now?limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/top', async (_, res) => {
  try {
    const data = await jikan('/top/anime?limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/popular', async (_, res) => {
  try {
    const data = await jikan('/anime?order_by=popularity&sort=asc&limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/airing', async (_, res) => {
  try {
    const data = await jikan('/anime?status=airing&order_by=score&sort=desc&limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/upcoming', async (_, res) => {
  try {
    const data = await jikan('/seasons/upcoming?limit=24');
    setCacheHeaders(res, 3600);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/movies', async (_, res) => {
  try {
    const data = await jikan('/top/anime?type=movie&limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/ova', async (_, res) => {
  try {
    const data = await jikan('/anime?type=ova&order_by=score&sort=desc&limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/acclaimed', async (_, res) => {
  try {
    const data = await jikan('/anime?min_score=8.5&order_by=score&sort=desc&limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/short', async (_, res) => {
  try {
    const data = await jikan('/anime?type=ona&order_by=score&sort=desc&limit=24');
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

// genres list almost never changes
router.get('/genres', async (_, res) => {
  try {
    const data = await jikan('/genres/anime');
    setCacheHeaders(res, 86400); // 24 hours
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

router.get('/genre/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid genre id' });
  }
  try {
    const data = await jikan(`/anime?genres=${id}&order_by=score&sort=desc&limit=24`);
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

// stream — must come before /:id
router.get('/:id/stream', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid anime id' });
  }
  try {
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
      return res.status(404).json({ error: 'No anime titles available for stream lookup' });
    }

    const resolved = await resolveAniPubStream(candidateNames);
    const payload = {
      malId: Number(id),
      sourceName: resolved.sourceName,
      sourceId: resolved.sourceId,
      episodes: resolved.episodes,
      providers: Array.from(new Set(resolved.episodes.flatMap((ep) => ep.providers || []))),
    };

    streamCache.set(cacheKey, { data: payload, ts: Date.now() });
    return res.json(payload);
  } catch (e) {
    return res.status(502).json({
      error: 'Anime stream source unavailable',
      detail: IS_PROD ? undefined : e.message,
      providerErrors: IS_PROD ? undefined : (e.details || []),
    });
  }
});

router.get('/:id/episodes', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid anime id' });
  }
  const safePage = Math.min(Math.max(Number(req.query.page) || 1, 1), 100);
  try {
    const data = await jikan(`/anime/${id}/episodes?page=${safePage}`);
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

// must be last
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid anime id' });
  }
  try {
    const data = await jikan(`/anime/${id}/full`);
    setCacheHeaders(res, 3600);
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: clientError(e) });
  }
});

export default router;