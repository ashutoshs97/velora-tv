import { tmdbFetch } from '../services/tmdb.service.js';
import { AUTHORS_CHOICE_TITLES } from '../config/authors_choice.js';
import { CRIME_DOCS_TITLES } from '../config/crime_docs.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getSafeType, isValidId, setCacheHeaders } from '../utils/helpers.js';

export const getSurprise = asyncHandler(async (req, res) => {
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
});

export const getTrending = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/trending/movie/week');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getPopular = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/movie/popular');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getTopRated = asyncHandler(async (req, res) => {
  const data = await tmdbFetch('/movie/top_rated');
  setCacheHeaders(res, 600);
  res.json(data);
});

export const getNewReleases = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const data = await tmdbFetch('/discover/tv', {
    'first_air_date.gte': monthAgo,
    'first_air_date.lte': today,
    sort_by: 'popularity.desc',
    'vote_count.gte': 20,
  });
  setCacheHeaders(res, 600);
  res.json(data);
});

export const searchMovies = asyncHandler(async (req, res) => {
  const { q, page = 1 } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }
  const safeQuery = q.trim().substring(0, 150);
  const safePage = Math.min(Math.max(Number(page) || 1, 1), 500);
  const data = await tmdbFetch('/search/multi', { query: safeQuery, page: safePage }, false);
  res.json(data);
});

export const getByGenre = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { type = 'movie' } = req.query;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid genre id' });
  }
  const endpoint = type === 'tv' ? '/discover/tv' : '/discover/movie';
  const data = await tmdbFetch(endpoint, {
    with_genres: id,
    sort_by: 'popularity.desc',
    'vote_count.gte': 50,
  });
  setCacheHeaders(res, 1800);
  res.json(data);
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

export const getByMood = asyncHandler(async (req, res) => {
  const { mood } = req.params;
  const genres = MOOD_GENRES[mood?.toLowerCase()];
  if (!genres) {
    return res.status(400).json({
      error: 'Unknown mood',
      available: Object.keys(MOOD_GENRES),
    });
  }
  const data = await tmdbFetch('/discover/movie', {
    with_genres: genres.join('|'),
    sort_by: 'popularity.desc',
    'vote_count.gte': 100,
    'vote_average.gte': 6.0,
  });
  setCacheHeaders(res, 1800);
  res.json(data);
});

export const getSimilar = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const type = getSafeType(req.query.type);
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const path = type === 'tv' ? `/tv/${id}/similar` : `/movie/${id}/similar`;
  try {
    const data = await tmdbFetch(path);
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (error) {
    if (error.status === 404) {
      setCacheHeaders(res, 1800);
      return res.json({ results: [] });
    }
    throw error;
  }
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const type = getSafeType(req.query.type);
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  const path = type === 'tv' ? `/tv/${id}/recommendations` : `/movie/${id}/recommendations`;
  try {
    const data = await tmdbFetch(path);
    setCacheHeaders(res, 1800);
    res.json(data);
  } catch (error) {
    if (error.status === 404) {
      setCacheHeaders(res, 1800);
      return res.json({ results: [] });
    }
    throw error;
  }
});

export const getMovieDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Invalid movie id' });
  }
  const [detail, credits] = await Promise.allSettled([
    tmdbFetch(`/movie/${id}`, { append_to_response: 'videos' }),
    tmdbFetch(`/movie/${id}/credits`),
  ]);
  if (detail.status === 'rejected') {
    const err = new Error(detail.reason?.message || 'Failed to fetch movie details');
    err.status = detail.reason?.status || 500;
    throw err;
  }
  const creditsData = credits.status === 'fulfilled' ? credits.value : { cast: [], crew: [] };
  setCacheHeaders(res, 3600);
  res.json({ ...detail.value, credits: creditsData });
});

let authorsChoiceCache = null;
let authorsChoiceCacheTime = 0;

export const getAuthorsChoice = asyncHandler(async (req, res) => {
  if (authorsChoiceCache && Date.now() - authorsChoiceCacheTime < 12 * 60 * 60 * 1000) {
    setCacheHeaders(res, 600);
    return res.json({ results: authorsChoiceCache });
  }

  const promises = AUTHORS_CHOICE_TITLES.map(async (title) => {
    try {
      const searchData = await tmdbFetch('/search/multi', { query: title });
      const result = searchData?.results?.[0];
      if (result) {
        const media_type = result.media_type || 'movie';
        return {
          id: result.id,
          title: result.title || result.name,
          poster_path: result.poster_path,
          backdrop_path: result.backdrop_path,
          vote_average: result.vote_average,
          release_date: result.release_date || result.first_air_date,
          overview: result.overview,
          media_type,
        };
      }
    } catch (err) {
      console.error(`[AUTHORS CHOICE] Failed to fetch TMDB details for "${title}":`, err.message);
    }
    return null;
  });

  const results = (await Promise.all(promises)).filter(Boolean);
  authorsChoiceCache = results;
  authorsChoiceCacheTime = Date.now();
  setCacheHeaders(res, 600);
  res.json({ results });
});

let crimeDocsCache = null;
let crimeDocsCacheTime = 0;

export const getCrimeDocs = asyncHandler(async (req, res) => {
  if (crimeDocsCache && Date.now() - crimeDocsCacheTime < 12 * 60 * 60 * 1000) {
    setCacheHeaders(res, 600);
    return res.json({ results: crimeDocsCache });
  }

  const promises = CRIME_DOCS_TITLES.map(async (title) => {
    try {
      const searchData = await tmdbFetch('/search/multi', { query: title });
      const result = searchData?.results?.[0];
      if (result) {
        const media_type = result.media_type || 'movie';
        return {
          id: result.id,
          title: result.title || result.name,
          poster_path: result.poster_path,
          backdrop_path: result.backdrop_path,
          vote_average: result.vote_average,
          release_date: result.release_date || result.first_air_date,
          overview: result.overview,
          media_type,
        };
      }
    } catch (err) {
      console.error(`[CRIME DOCS] Failed to fetch TMDB details for "${title}":`, err.message);
    }
    return null;
  });

  const results = (await Promise.all(promises)).filter(Boolean);
  crimeDocsCache = results;
  crimeDocsCacheTime = Date.now();
  setCacheHeaders(res, 600);
  res.json({ results });
});
