import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Play } from 'lucide-react';
import { removeFromHistory } from '../utils/watchHistory';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='780' height='439' viewBox='0 0 780 439'%3E%3Crect width='780' height='439' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

function HistoryCard({ item, onDelete }) {
  const [imgError, setImgError] = useState(false);

  const tmdbId = item.tmdbId || item.id;
  const type = item.type === 'tv' ? 'tv' : 'movie';
  const watchLink = tmdbId ? `/watch/${tmdbId}?type=${type}` : '/';
  const title = item.title || item.name || 'Untitled';
  const imgSrc = !imgError && (item.backdropPath || item.backdrop_path)
    ? `${BACKDROP_BASE}${item.backdropPath || item.backdrop_path}`
    : PLACEHOLDER_SVG;

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(tmdbId);
  };

  return (
    <div className="group/card snap-start flex-shrink-0 w-56 sm:w-64 md:w-72">
      <Link
        to={watchLink}
        className="block relative aspect-video rounded-lg overflow-hidden bg-prime-surface"
      >
        {/* thumbnail */}
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />

        {/* delete button */}
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-black/90 z-20"
          title="Remove"
        >
          <X size={14} className="text-white" />
        </button>

        {/* play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity duration-200">
          <div className="bg-white text-black p-3 rounded-full">
            <Play size={20} fill="#000" className="ml-0.5" />
          </div>
        </div>

        {/* gradient for text */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />

        {/* title */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white text-sm font-bold line-clamp-1 drop-shadow">
            {title}
          </h3>
          <span className="text-[10px] font-semibold text-prime-subtext uppercase tracking-wide">
            {type === 'tv' ? 'Continue Series' : 'Resume'}
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function RecentlyWatched({ history, onRefresh }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === 1 ? amount : -amount,
      behavior: 'smooth',
    });
  };

  const handleDelete = (tmdbId) => {
    removeFromHistory(tmdbId);
    onRefresh?.();
  };

  if (!history || history.length === 0) return null;

  return (
    <section className="relative group">
      {/* title */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Continue Watching
        </h2>
      </div>

      {/* carousel */}
      <div className="relative">

        {/* left shade */}
        <div
          onClick={() => scroll(-1)}
          className="hidden sm:flex absolute left-0 top-0 bottom-4 w-12 sm:w-14 z-40 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-[#080E14] to-transparent"
          role="button"
          aria-label="Scroll left"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft size={20} className="text-white" />
          </div>
        </div>

        {/* scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pr-12 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {history.map((item, idx) => (
            <HistoryCard
              key={item.tmdbId || item.id || `history-${idx}`}
              item={item}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* right shade */}
        <div
          onClick={() => scroll(1)}
          className="hidden sm:flex absolute right-0 top-0 bottom-4 w-12 sm:w-14 z-40 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-l from-[#080E14] to-transparent"
          role="button"
          aria-label="Scroll right"
        >
          <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronRight size={20} className="text-white" />
          </div>
        </div>

      </div>
    </section>
  );
}