import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import { deleteHistoryItem } from '../api';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PLACEHOLDER = 'https://via.placeholder.com/780x439/1A242F/8197A4?text=Velora';

export default function RecentlyWatched({ history, onRefresh }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteHistoryItem(id);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to delete history item', err);
    }
  };

  if (!history || history.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Continue Watching</h2>
        </div>
        <div className="flex items-center gap-2 hidden sm:flex">
          <button
            onClick={() => scroll(-1)}
            className="w-10 h-10 rounded-full bg-prime-surface border-2 border-transparent flex items-center justify-center hover:border-white transition-all text-white"
          >
            <ChevronLeft size={20} className="pr-0.5" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-10 h-10 rounded-full bg-prime-surface border-2 border-transparent flex items-center justify-center hover:border-white transition-all text-white"
          >
            <ChevronRight size={20} className="pl-0.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-2 -mt-2 px-2 -mx-2 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {history.map((item) => (
          <div
            key={item._id}
            className="movie-card-container group flex-shrink-0 w-64 md:w-80"
          >
            <div className="movie-card-inner">
              <img
                src={item.backdropPath ? `${BACKDROP_BASE}${item.backdropPath}` : PLACEHOLDER}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { e.target.src = PLACEHOLDER; }}
              />

              {/* Delete button (persistent top right) */}
              <button
                onClick={(e) => handleDelete(e, item._id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center 
                           opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90 z-20 border border-white/20"
                title="Remove from history"
              >
                <X size={14} className="text-white" />
              </button>

              {/* Play hint overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Link to={`/watch/${item.tmdbId}`} className="bg-white text-black p-4 rounded-full hover:scale-110 transition-transform">
                  <Play size={24} fill="#000" className="ml-0.5" />
                </Link>
              </div>

              {/* Progress Bar Mock */}
              <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/20">
                <div className="h-full bg-prime-blue" style={{ width: '40%' }} />
              </div>

              {/* Meta */}
              <div className="movie-card-meta !pb-5">
                <Link to={`/watch/${item.tmdbId}`} className="block">
                  <h3 className="font-bold text-white text-base line-clamp-1 mb-1 shadow-black drop-shadow-md">
                    {item.title}
                  </h3>
                  <span className="text-[11px] font-semibold text-prime-blue uppercase tracking-wide">
                    Resume Playing
                  </span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
