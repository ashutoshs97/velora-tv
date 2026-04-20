import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchByGenre } from '../api';
import { triggerHaptic } from '../utils/haptics';
import { Loader2, Play, ArrowRight } from 'lucide-react';

const MOVIE_GENRES = [
  { id: 28,    label: 'Action' },
  { id: 35,    label: 'Comedy' },
  { id: 18,    label: 'Drama' },
  { id: 27,    label: 'Horror' },
  { id: 878,   label: 'Sci-Fi' },
  { id: 10749, label: 'Romance' },
  { id: 53,    label: 'Thriller' },
  { id: 99,    label: 'Documentary' },
  { id: 10751, label: 'Family' },
  { id: 14,    label: 'Fantasy' },
  { id: 80,    label: 'Crime' },
  { id: 12,    label: 'Adventure' },
];

const TV_GENRES = [
  { id: 10759, label: 'Action & Adventure' },
  { id: 35,    label: 'Comedy' },
  { id: 18,    label: 'Drama' },
  { id: 9648,  label: 'Mystery' },
  { id: 10765, label: 'Sci-Fi & Fantasy' },
  { id: 80,    label: 'Crime' },
  { id: 10768, label: 'War & Politics' },
  { id: 10762, label: 'Kids' },
  { id: 10764, label: 'Reality' },
  { id: 10767, label: 'Talk' },
];

const TYPES = [
  { key: 'movie', label: 'Movies',   genres: MOVIE_GENRES },
  { key: 'tv',    label: 'TV Shows', genres: TV_GENRES },
];

const TMDB_IMG    = 'https://image.tmdb.org/t/p/w780';
const TMDB_POSTER = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='780' height='440' viewBox='0 0 780 440'%3E%3Crect width='780' height='440' fill='%23111827'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='22' fill='%234b5563'%3ENo Image%3C/text%3E%3C/svg%3E`;
const POSTER_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23111827'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%234b5563'%3EVelora%3C/text%3E%3C/svg%3E`;

function GenreCard({ genre, cover, isSelected, onClick, onHoverStart, onHoverEnd }) {
  return (
    <motion.button
      layout
      onClick={() => {
        triggerHaptic('light');
        onClick();
      }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
      style={{ aspectRatio: '16 / 9' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
    >
      {cover ? (
        <img
          src={cover}
          alt={genre.label}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-prime-surface" />
      )}

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />

      {isSelected && (
        <motion.div
          layoutId="genre-ring"
          className="absolute inset-0 rounded-2xl ring-2 ring-prime-blue shadow-[inset_0_0_30px_rgba(37,99,235,0.3)]"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between">
        <h3 className="text-white font-black text-lg sm:text-xl lg:text-2xl tracking-tight drop-shadow-lg leading-none">
          {genre.label}
        </h3>
        <div className={`p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all duration-300 ${
          isSelected ? 'bg-prime-blue/80 border-prime-blue' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <ArrowRight size={16} className="text-white" />
        </div>
      </div>
    </motion.button>
  );
}

function ContentGrid({ items, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9 gap-3"
    >
      {items.map((item, idx) => {
        const id = item.id;
        const title = item.title || item.name || 'Unknown';
        const poster = item.poster_path
          ? `${TMDB_POSTER}${item.poster_path}`
          : null;
        const rating = item.vote_average > 0
          ? Number(item.vote_average).toFixed(1)
          : null;
        const watchLink = `/watch/${id}?type=${type}`;

        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(idx * 0.02, 0.5) }}
          >
            <Link
              to={watchLink}
              className="group block relative rounded-xl overflow-hidden aspect-[2/3] bg-white/5 border border-white/5 hover:border-prime-blue/40 hover:shadow-[0_0_20px_rgba(37,99,235,0.2)] transition-all duration-300"
            >
              <img
                src={poster || POSTER_PLACEHOLDER}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.src = POSTER_PLACEHOLDER; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                <div className="flex justify-end">
                  <div className="bg-prime-blue/80 backdrop-blur-sm rounded-full p-1.5">
                    <Play size={14} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
                <div>
                  <p className="text-white text-[11px] font-bold line-clamp-2 leading-tight">{title}</p>
                  {rating && <p className="text-yellow-400 text-[10px] font-bold mt-0.5">★ {rating}</p>}
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function Genres() {
  const [activeType, setActiveType] = useState('movie');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [genreCovers, setGenreCovers] = useState({});
  const [coversLoading, setCoversLoading] = useState(false);
  const [hoveredGenreId, setHoveredGenreId] = useState(null);
  const [items, setItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const contentRef = useRef(null);
  const coverCache = useRef({});

  const currentTypeData = TYPES.find(t => t.key === activeType);

  const loadCovers = useCallback(async (typeKey) => {
    if (coverCache.current[typeKey]) {
      setGenreCovers(coverCache.current[typeKey]);
      return;
    }
    setCoversLoading(true);
    const typeData = TYPES.find(t => t.key === typeKey);
    const results = {};

    await Promise.allSettled(
      typeData.genres.map(async (genre) => {
        try {
          const res = await fetchByGenre(genre.id, typeKey);
          const arr = res.data?.results || [];
          const pick = arr[1] || arr[0];
          if (pick) {
            const path = pick.backdrop_path || pick.poster_path;
            results[genre.id] = path ? `${TMDB_IMG}${path}` : null;
          }
        } catch { /* silently fail */ }
      })
    );

    coverCache.current[typeKey] = results;
    setGenreCovers(results);
    setCoversLoading(false);
  }, []);

  useEffect(() => {
    loadCovers(activeType);
    setSelectedGenre(null);
    setItems([]);
  }, [activeType, loadCovers]);

  const handleGenreClick = async (genre) => {
    setSelectedGenre(genre);
    setContentLoading(true);
    setItems([]);

    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);

    try {
      const res = await fetchByGenre(genre.id, activeType);
      setItems(res.data?.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setContentLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16 relative overflow-x-hidden"
    >
      {/* background blur on hover */}
      <AnimatePresence>
        {hoveredGenreId && genreCovers[hoveredGenreId] && (
          <motion.div
            key={hoveredGenreId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="fixed inset-0 z-0 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[#060A0F]/40 z-10" />
            <img
              src={genreCovers[hoveredGenreId]}
              alt=""
              className="w-full h-full object-cover blur-[80px] scale-110"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-4 relative z-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display mb-3 bg-gradient-to-r from-white via-white to-white/50 bg-clip-text text-transparent">
          Browse by Genre
        </h1>
        <p className="text-white/40 text-lg font-medium">
          Discover your next obsession.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 mt-8 relative z-10">

        {/* type toggle */}
        <div className="flex gap-2 mb-10 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-fit">
          {TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`px-7 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeType === t.key
                  ? 'bg-prime-blue text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* genre grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mb-14"
          >
            {currentTypeData.genres.map((genre) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                cover={genreCovers[genre.id]}
                isSelected={selectedGenre?.id === genre.id}
                onClick={() => handleGenreClick(genre)}
                onHoverStart={() => setHoveredGenreId(genre.id)}
                onHoverEnd={() => setHoveredGenreId(null)}
              />
            ))}
            {coversLoading && currentTypeData.genres.map((g) => (
              <div
                key={`sk-${g.id}`}
                className="rounded-2xl bg-white/5 animate-pulse"
                style={{ aspectRatio: '16 / 9' }}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* content */}
        <div ref={contentRef}>
          <AnimatePresence mode="wait">
            {selectedGenre && (
              <motion.div
                key={`${activeType}-${selectedGenre.id}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-white/10">
                  <div className="w-1 h-8 rounded-full bg-prime-blue" />
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-none">
                      {selectedGenre.label}
                    </h2>
                    <p className="text-white/40 text-sm font-medium mt-1">
                      {currentTypeData.label} · Top picks
                    </p>
                  </div>
                </div>

                {contentLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-white/30">
                    <Loader2 className="w-8 h-8 animate-spin text-prime-blue mb-3" />
                    <p className="text-sm font-medium">Loading {selectedGenre.label}...</p>
                  </div>
                ) : items.length > 0 ? (
                  <ContentGrid items={items} type={activeType} />
                ) : (
                  <div className="text-center py-20 text-white/40">No results found.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}