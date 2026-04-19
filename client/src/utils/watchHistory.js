const STORAGE_KEY = 'velora_watch_history';
const MAX_ITEMS = 20;

export function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToHistory(movie) {
  try {
    if (!movie?.tmdbId && !movie?.id) return;
    const history = getHistory();
    const tmdbId = movie.tmdbId || movie.id;
    const filtered = history.filter(item => (item.tmdbId || item.id) !== tmdbId);
    filtered.unshift({
      tmdbId,
      title: movie.title || movie.name || 'Untitled',
      posterPath: movie.posterPath || movie.poster_path,
      backdropPath: movie.backdropPath || movie.backdrop_path,
      year: movie.year || (movie.release_date || movie.first_air_date || '').substring(0, 4),
      rating: movie.rating || movie.vote_average,
      overview: movie.overview,
      type: movie.type || movie.media_type || 'movie',
      watchedAt: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // storage full or unavailable
  }
}

export function removeFromHistory(tmdbId) {
  try {
    const history = getHistory();
    const filtered = history.filter(item => (item.tmdbId || item.id) !== tmdbId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // silent
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}