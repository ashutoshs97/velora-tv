import { tmdbFetch } from '../services/tmdb.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidId, setCacheHeaders } from '../utils/helpers.js';

export const getTrendingTv = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/trending/tv/week');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getPopularTv = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/tv/popular');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getTopRatedTv = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/tv/top_rated');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getOnAirTv = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/tv/on_the_air');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getTvDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid TV show id' });
  }
  const [detail, credits] = await Promise.allSettled([
    tmdbFetch(`/tv/${id}`, { append_to_response: 'videos' }),
    tmdbFetch(`/tv/${id}/credits`),
  ]);
  if (detail.status === 'rejected') {
    throw new Error(detail.reason?.message || 'Failed to fetch TV details');
  }
  const creditsData = credits.status === 'fulfilled' ? credits.value : { cast: [], crew: [] };
  setCacheHeaders(res, 3600);
  res.json({ ...detail.value, credits: creditsData });
});

export const getTvSeason = asyncHandler(async (req, res) => {
  const { id, seasonNumber } = req.params;
  if (!isValidId(id) || !/^\d+$/.test(String(seasonNumber))) {
    return res.status(400).json({ error: 'Invalid TV show or season id' });
  }
  const data = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
  setCacheHeaders(res, 3600);
  res.json(data);
});
