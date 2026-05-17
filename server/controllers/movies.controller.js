import { tmdbFetch } from '../services/tmdb.service.js';
import { AUTHORS_CHOICE_TITLES } from '../config/authors_choice.js';

const IS_PROD = process.env.NODE_ENV === 'production';

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

function setCacheHeaders(res, seconds = 300) {
  res.set('Cache-Control', `public, max-age=${seconds}, s-maxage=${seconds}`);
}

export const getSurprise = async (req, res) => {
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
};

export const getTrending = async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/movie/week');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getTrendingTv = async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/tv/week');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getPopular = async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/popular');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getPopularTv = async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/popular');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getTopRated = async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getTopRatedTv = async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/top_rated');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getOnAirTv = async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/on_the_air');
    setCacheHeaders(res, 600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getNewReleases = async (req, res) => {
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
};

export const searchMovies = async (req, res) => {
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
};

export const getByGenre = async (req, res) => {
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
};

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

export const getByMood = async (req, res) => {
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
};

export const getTvDetails = async (req, res) => {
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
};

export const getTvSeason = async (req, res) => {
  const { id, seasonNumber } = req.params;
  if (!isValidId(id) || !/^\d+$/.test(String(seasonNumber))) {
    return res.status(400).json({ error: 'Invalid TV show or season id' });
  }
  try {
    const data = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
    setCacheHeaders(res, 3600);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};

export const getPerson = async (req, res) => {
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
};

export const getSimilar = async (req, res) => {
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
};

export const getRecommendations = async (req, res) => {
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
};

export const getMovieDetails = async (req, res) => {
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
};

export const getAuthorsChoice = async (req, res) => {
  try {
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
    setCacheHeaders(res, 600);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: clientError(err) });
  }
};
