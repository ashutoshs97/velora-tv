import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
});

export const fetchTrending = () => api.get('/movies/trending');
export const fetchTrendingTV = () => api.get('/movies/trending-tv');
export const fetchPopular = () => api.get('/movies/popular');
export const fetchTopRated = () => api.get('/movies/top-rated');
export const searchMovies = (q, page = 1) => api.get('/movies/search', { params: { q, page } });
export const fetchMovieDetail = (id) => api.get(`/movies/${id}`);
export const fetchTVDetail = (id) => api.get(`/movies/tv/${id}`);

export const fetchHistory = () => api.get('/history');
export const addToHistory = (movie) => api.post('/history', movie);
export const deleteHistoryItem = (id) => api.delete(`/history/${id}`);
export const clearHistory = () => api.delete('/history');

export default api;
