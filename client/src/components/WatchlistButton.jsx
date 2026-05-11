import { useState, useEffect, useCallback } from 'react';
import { Plus, Check, Bookmark } from 'lucide-react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../utils/watchlist';

export default function WatchlistButton({
  movie,
  type = 'movie',
  className = '',
  size = 20,
  useBookmark = false,
}) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const id = movie?.id || movie?.tmdbId;

  useEffect(() => {
    if (!id) return;
    const list = getWatchlist();
    const item = list.find(w => String(w.tmdbId) === String(id));
    if (item) {
      setInWatchlist(true);
      setWatchlistId(item.tmdbId || id);
    } else {
      setInWatchlist(false);
      setWatchlistId(null);
    }
  }, [id]);

  const toggleWatchlist = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!movie || !id) return;

    try {
      if (inWatchlist) {
        setInWatchlist(false);
        setWatchlistId(null);
        await removeFromWatchlist(watchlistId || id);
      } else {
        setInWatchlist(true);
        await addToWatchlist({
          tmdbId: Number(id),
          title: movie.title || movie.name,
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          year: (movie.release_date || movie.first_air_date || '').substring(0, 4),
          rating: movie.vote_average,
          overview: movie.overview,
          type: type === 'tv' ? 'tv' : 'movie',
        });
        setWatchlistId(id);
      }
      window.dispatchEvent(new CustomEvent('velora:watchlist-updated'));
    } catch {
      setInWatchlist(prev => !prev);
    }
  }, [movie, id, inWatchlist, watchlistId, type]);

  const activeClass = inWatchlist
    ? 'text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-primary)]/10'
    : '';

  return (
    <button
      onClick={toggleWatchlist}
      title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      className={`${className} ${activeClass} transition-colors`}
    >
      {inWatchlist ? (
        <Check size={size} />
      ) : useBookmark ? (
        <Bookmark size={size} />
      ) : (
        <Plus size={size} />
      )}
    </button>
  );
}