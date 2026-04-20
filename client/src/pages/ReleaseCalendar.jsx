import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTrendingTV, fetchOnAirTV, fetchTopRated } from '../api';
import { Calendar, Tv, Film, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='342' height='513' viewBox='0 0 342 513'%3E%3Crect width='342' height='513' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

const TABS = [
  { key: 'airing', label: 'On Air Now', icon: Tv },
  { key: 'trending', label: 'Trending', icon: Star },
  { key: 'movies', label: 'Top Movies', icon: Film },
];

function ContentCard({ item, type = 'tv' }) {
  const [imgError, setImgError] = useState(false);
  const id = item.id;
  const title = item.name || item.title || 'Unknown';
  const poster = !imgError && item.poster_path
    ? `${POSTER_BASE}${item.poster_path}`
    : PLACEHOLDER;
  const rating = item.vote_average > 0
    ? Number(item.vote_average).toFixed(1)
    : null;
  const year = (item.first_air_date || item.release_date || '').substring(0, 4);
  const watchLink = `/watch/${id}?type=${type}`;

  return (
    <Link to={watchLink} className="group block">
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-prime-surface mb-2">
        <img
          src={poster}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => setImgError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {rating && (
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-bold text-yellow-400">
            ★ {rating}
          </div>
        )}
      </div>
      <p className="text-white text-xs font-bold line-clamp-1 group-hover:text-prime-blue transition-colors">
        {title}
      </p>
      {year && (
        <p className="text-prime-subtext text-[10px] mt-0.5">{year}</p>
      )}
    </Link>
  );
}

export default function ReleaseCalendar() {
  const [activeTab, setActiveTab] = useState('airing');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setItems([]);

    const fetchers = {
      airing:   fetchOnAirTV,
      trending: fetchTrendingTV,
      movies:   fetchTopRated,
    };

    fetchers[activeTab]()
      .then((res) => {
        if (!cancelled) setItems(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeTab]);

  const itemType = activeTab === 'movies' ? 'movie' : 'tv';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={32} className="text-prime-blue" />
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
            What's On
          </h1>
        </div>
        <p className="text-prime-subtext font-medium mt-3 text-lg max-w-2xl">
          Currently airing shows, trending content and top rated movies.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 mt-8">
        {/* tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                activeTab === key
                  ? 'bg-prime-blue text-white'
                  : 'bg-white/5 text-prime-subtext hover:text-white'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] rounded-xl skeleton" />
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {items.map((item) => (
                  <ContentCard key={item.id} item={item} type={itemType} />
                ))}
              </div>
            ) : (
              <div className="text-center text-prime-subtext py-20">
                No content found.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}