import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
});

// movies
export const fetchTrending = () => api.get('/movies/trending');
export const fetchTrendingTV = () => api.get('/movies/trending-tv');
export const fetchPopular = () => api.get('/movies/popular');
export const fetchPopularTV = () => api.get('/movies/popular-tv');
export const fetchTopRated = () => api.get('/movies/top-rated');
export const fetchTopRatedTV = () => api.get('/movies/top-rated-tv');
export const fetchNewReleases = () => api.get('/movies/new-releases');
export const fetchOnAirTV = () => api.get('/movies/on-air-tv');
export const fetchSurprise = () => api.get('/movies/surprise');
export const fetchByGenre = (genreId, type = 'movie') => api.get(`/movies/genre/${genreId}`, { params: { type } });
export const fetchByMood = (mood) => api.get(`/movies/mood/${mood}`);
export const fetchSimilar = (id, type = 'movie') => api.get(`/movies/${id}/similar`, { params: { type } });
export const fetchRecommendations = (id, type = 'movie') => api.get(`/movies/${id}/recommendations`, { params: { type } });
export const searchMovies = (q, page = 1) => api.get('/movies/search', { params: { q, page } });
export const fetchMovieDetail = (id) => api.get(`/movies/${id}`);
export const fetchTVDetail = (id) => api.get(`/movies/tv/${id}`);
export const fetchPerson = (id) => api.get(`/movies/person/${id}`);

// history
export const fetchHistory = () => api.get('/history');
export const addToHistory = (movie) => api.post('/history', movie);
export const deleteHistoryItem = (id) => api.delete(`/history/${id}`);
export const clearHistory = () => api.delete('/history');

// watchlist
export const fetchWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (movie) => api.post('/watchlist', movie);
export const deleteWatchlistItem = (id) => api.delete(`/watchlist/${id}`);
export const clearWatchlist = () => api.delete('/watchlist');

// comments
export const fetchComments = (mediaType, mediaId) => api.get(`/comments/${mediaType}/${mediaId}`);
export const postComment = (mediaType, mediaId, content) => api.post('/comments', { mediaType, mediaId, content });

export default api;