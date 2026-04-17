import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
});

export const fetchTrending = () => api.get('/movies/trending');
export const fetchTrendingTV = () => api.get('/movies/trending-tv');
export const fetchPopular = () => api.get('/movies/popular');
export const fetchPopularTV = () => api.get('/movies/popular-tv');
export const fetchTopRated = () => api.get('/movies/top-rated');
export const fetchTopRatedTV = () => api.get('/movies/top-rated-tv');
export const fetchNewReleases = () => api.get('/movies/new-releases');
export const fetchOnAirTV = () => api.get('/movies/on-air-tv');

export const fetchByGenre = (genreId) => api.get(`/movies/genre/${genreId}`);
export const fetchByMood = (mood) => api.get(`/movies/mood/${mood}`);
export const fetchSimilar = (id, type = 'movie') => api.get(`/movies/${id}/similar`, { params: { type } });
export const fetchRecommendations = (id, type = 'movie') => api.get(`/movies/${id}/recommendations`, { params: { type } });
export const searchMovies = (q, page = 1) => api.get('/movies/search', { params: { q, page } });
export const fetchMovieDetail = (id) => api.get(`/movies/${id}`);
export const fetchTVDetail = (id) => api.get(`/movies/tv/${id}`);
export const fetchPerson = (id) => api.get(`/movies/person/${id}`);

export const fetchHistory = () => api.get('/history');
export const addToHistory = (movie) => api.post('/history', movie);
export const deleteHistoryItem = (id) => api.delete(`/history/${id}`);
export const clearHistory = () => api.delete('/history');

export default api;
