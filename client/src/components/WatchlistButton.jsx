import { useState, useEffect } from 'react';
import { Plus, Check, Bookmark } from 'lucide-react';
import { fetchWatchlist, addToWatchlist, deleteWatchlistItem } from '../api';

export default function WatchlistButton({ movie, type = 'movie', className = '', size = 20, useBookmark = false }) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState(null);
  const id = movie?.id || movie?.tmdbId;

  // On mount, check if this specific item is in the watchlist
  useEffect(() => {
    if (!id) return;
    let isActive = true;
    
    fetchWatchlist().then(res => {
      if (!isActive) return;
      const list = res.data || [];
      const item = list.find(w => String(w.tmdbId) === String(id));
      if (item) {
        setInWatchlist(true);
        setWatchlistId(item._id || item.tmdbId);
      } else {
        setInWatchlist(false);
      }
    }).catch(() => {});

    return () => { isActive = false; };
  }, [id]);

  const toggleWatchlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!movie || !id) return;

    try {
      if (inWatchlist) {
        // Optimistic UI
        setInWatchlist(false);
        await deleteWatchlistItem(watchlistId || id);
      } else {
        setInWatchlist(true);
        const res = await addToWatchlist({
          tmdbId: Number(id),
          title: movie.title || movie.name,
          posterPath: movie.poster_path,
          backdropPath: movie.backdrop_path,
          year: (movie.release_date || movie.first_air_date || '').substring(0, 4),
          rating: movie.vote_average,
          overview: movie.overview,
          type: type === 'tv' ? 'tv' : 'movie'
        });
        setWatchlistId(res.data?._id || id);
      }
      window.dispatchEvent(new CustomEvent('velora:watchlist-updated'));
    } catch (err) {
      // Revert on error
      setInWatchlist(!inWatchlist);
    }
  };

  const activeClass = inWatchlist ? 'text-[var(--color-primary)] border-[var(--color-primary)] bg-[var(--color-primary)]/10' : '';

  return (
    <button
      onClick={toggleWatchlist}
      title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
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
