const STORAGE_KEY = 'velora_watchlist';

export function getWatchlist() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToWatchlist(movie) {
  try {
    if (!movie?.tmdbId && !movie?.id) return Promise.reject();
    const watchlist = getWatchlist();
    const tmdbId = movie.tmdbId || movie.id;
    // Remove if already exists
    const filtered = watchlist.filter(item => (item.tmdbId || item.id) !== tmdbId);
    
    filtered.unshift({
      tmdbId,
      title: movie.title || movie.name || 'Untitled',
      posterPath: movie.posterPath || movie.poster_path,
      backdropPath: movie.backdropPath || movie.backdrop_path,
      year: movie.year || (movie.release_date || movie.first_air_date || '').substring(0, 4),
      rating: movie.rating || movie.vote_average,
      overview: movie.overview,
      type: movie.type || movie.media_type || 'movie',
      addedAt: new Date().toISOString(),
    });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return Promise.resolve();
  } catch {
    return Promise.reject();
  }
}

export function removeFromWatchlist(tmdbId) {
  try {
    const watchlist = getWatchlist();
    const filtered = watchlist.filter(item => (item.tmdbId || item.id) !== tmdbId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return Promise.resolve();
  } catch {
    return Promise.reject();
  }
}

export function clearWatchlist() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  } catch {
    return Promise.reject();
  }
}
