import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Star, Trash2 } from 'lucide-react';
import { fetchWatchlist, deleteWatchlistItem } from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const PLACEHOLDER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 342 513'%3E%3Crect width='342' height='513' fill='%23111827'/%3E%3Cpath d='M171 230.5c-14.1 0-25.5 11.4-25.5 25.5s11.4 25.5 25.5 25.5 25.5-11.4 25.5-25.5-11.4-25.5-25.5-25.5zm0 34c-4.7 0-8.5-3.8-8.5-8.5s3.8-8.5 8.5-8.5 8.5 3.8 8.5 8.5-3.8 8.5-8.5 8.5z' fill='%23374151'/%3E%3C/svg%3E";

function WatchlistCard({ item, onRemove }) {
  const [imgError, setImgError] = useState(false);
  
  const id = item.tmdbId;
  const mediaType = item.type || 'movie';
  const watchLink = id ? `/watch/${id}?type=${mediaType}` : '/';
  
  const rating = item.rating ? Number(item.rating).toFixed(1) : null;
  const imgSrc = imgError || !item.posterPath
    ? PLACEHOLDER_SVG
    : `${POSTER_BASE}${item.posterPath}`;

  return (
    <div className="relative group rounded-xl overflow-hidden aspect-[2/3] bg-white/5 border border-white/5 transition-transform duration-300 hover:scale-105 hover:z-20 hover:shadow-2xl">
      <Link to={watchLink} className="block w-full h-full">
        <img
          src={imgSrc}
          alt={item.title}
          loading="lazy"
          className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-60"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <div className="flex items-center gap-3 mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
              <Play size={18} fill="currentColor" className="ml-1" />
            </div>
            {rating && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[13px] border border-white/10">
                <Star size={12} className="text-yellow-400" fill="currentColor" /> {rating}
              </div>
            )}
          </div>
          <p className="text-white font-semibold text-sm line-clamp-2 leading-tight translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            {item.title}
          </p>
        </div>
      </Link>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(item); }}
        className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/60 hover:text-red-400 hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-all border border-white/10 z-30"
        title="Remove from Watchlist"
      >
        <Trash2 size={14} />
      </button>
      <div className="absolute top-0 right-2 px-2 py-1 bg-[var(--color-primary)] text-white text-[10px] font-bold rounded-b-md shadow-lg">
        {item.year || 'TBA'}
      </div>
    </div>
  );
}

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
    window.addEventListener('velora:watchlist-updated', loadWatchlist);
    return () => window.removeEventListener('velora:watchlist-updated', loadWatchlist);
  }, []);

  const loadWatchlist = async () => {
    try {
      setLoading(true);
      const res = await fetchWatchlist();
      setWatchlist(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item) => {
    try {
      // Optistically remove
      setWatchlist(prev => prev.filter(w => w.tmdbId !== item.tmdbId && w._id !== item._id));
      await deleteWatchlistItem(item._id || item.tmdbId);
    } catch {
      // Revert on error
      loadWatchlist();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">My Watchlist</h1>
        <p className="text-white/40 text-sm">Titles you've saved to watch later.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--color-primary)] animate-spin" />
        </div>
      ) : watchlist.length === 0 ? (
        <div className="py-20 text-center bg-white/[0.02] rounded-2xl border border-white/5">
          <Star size={48} className="mx-auto text-white/20 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Your watchlist is empty</h2>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            Titles you add will appear here. You can also import your Letterboxd watchlist in the Settings menu.
          </p>
          <Link
            to="/movies"
            className="inline-block mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-full text-sm font-semibold transition-colors"
          >
            Discover Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
          <AnimatePresence>
            {watchlist.map((item) => (
              <motion.div
                key={item._id || item.tmdbId}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <WatchlistCard item={item} onRemove={handleRemove} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
