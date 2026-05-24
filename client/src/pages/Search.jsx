import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Tv, Film, Layers, Sparkles, TrendingUp, Users, User, Star } from 'lucide-react';
import { searchMovies, fetchTrending, fetchTrendingTV } from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w500';
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='300' viewBox='0 0 200 300'%3E%3Crect width='200' height='300' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

const MAX_QUERY_LENGTH = 150;

const TYPE_FILTERS = [
  { key: 'all',    label: 'All',      Icon: Layers },
  { key: 'movie',  label: 'Movies',   Icon: Film },
  { key: 'tv',     label: 'TV Shows', Icon: Tv },
  { key: 'person', label: 'People',   Icon: Users },
];

const TRENDING_SEARCHES = [
  'Avengers', 'Batman', 'Stranger Things', 'Inception',
  'Breaking Bad', 'Interstellar', 'The Boys', 'Oppenheimer',
];

function getSafeType(item) {
  if (item.media_type) return item.media_type;
  if (item.known_for_department) return 'person';
  if (item.name && !item.title) return 'tv';
  return 'movie';
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: {
      delay: Math.min(i * 0.05, 0.3),
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

function ResultCard({ movie, index }) {
  const [imgError, setImgError] = useState(false);

  const mediaType = getSafeType(movie);
  const id = movie.tmdbId || movie.id;
  const isPerson = mediaType === 'person';
  const watchLink = id
    ? isPerson ? `/person/${id}` : `/watch/${id}?type=${mediaType}`
    : '/';

  const title = movie.title || movie.name || 'Untitled';
  const year = isPerson
    ? movie.known_for_department || 'Actor'
    : (movie.release_date || movie.first_air_date || '').substring(0, 4);

  // Prioritize poster over backdrop
  const rawImg = isPerson
    ? (movie.profile_path ? `${POSTER_BASE}${movie.profile_path}` : null)
    : (movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : null);

  const img = imgError || !rawImg ? PLACEHOLDER_SVG : rawImg;
  const isTv = mediaType === 'tv';
  const rating = movie.vote_average ? Number(movie.vote_average).toFixed(1) : null;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <a
        href={watchLink}
        onClick={(e) => { if (!id) e.preventDefault(); }}
        className="group relative flex flex-col rounded-2xl overflow-hidden bg-white/[0.02] border border-white/5 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-prime-blue/20 hover:border-prime-blue/30 cursor-pointer"
      >
        <div className="relative aspect-[2/3] overflow-hidden w-full bg-prime-bg">
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={() => setImgError(true)}
          />
          {/* Rich gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
          
          {/* Top Badges */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider backdrop-blur-md shadow-[0_2px_10px_rgba(0,0,0,0.5)] border ${
              isPerson ? 'bg-amber-600/90 text-white border-amber-400/30' 
              : isTv ? 'bg-purple-600/90 text-white border-purple-400/30' 
              : 'bg-prime-blue/90 text-white border-blue-400/30'
            }`}>
              {isPerson ? 'Person' : isTv ? 'Series' : 'Movie'}
            </span>
            
            {rating && !isPerson && (
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/20 px-2 py-1 rounded-md shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[11px] font-bold text-white">
                  {rating}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="text-white font-bold text-sm sm:text-base line-clamp-2 leading-tight mb-1 drop-shadow-md">
              {title}
            </h3>
            {year && (
              <span className={`text-xs font-medium ${isPerson ? 'text-amber-400/80' : 'text-white/60'}`}>
                {year}
              </span>
            )}
          </div>
        </div>
      </a>
    </motion.div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]">
          <div className="aspect-[2/3] skeleton" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      <div className="relative mb-8">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-3xl bg-gradient-to-br from-prime-blue/20 to-purple-600/20 border border-prime-blue/30 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)] backdrop-blur-xl"
        >
          <Sparkles size={48} className="text-prime-blue" />
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          className="absolute inset-0 flex items-start justify-center"
        >
          <div className="w-3 h-3 rounded-full bg-prime-blue shadow-[0_0_15px_rgba(59,130,246,0.8)] -mt-1.5" />
        </motion.div>
      </div>
      {query ? (
        <>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">No results for "{query}"</h2>
          <p className="text-prime-subtext max-w-sm leading-relaxed text-sm sm:text-base">
            Try adjusting your search or using a different spelling.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Discover anything</h2>
          <p className="text-prime-subtext max-w-sm leading-relaxed text-sm sm:text-base">
            Search across millions of movies, TV shows, and people.
          </p>
        </>
      )}
    </motion.div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [inputVal, setInputVal] = useState(searchParams.get('q') || '');
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState('all');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const debounceRef = useRef(null);
  const searchAbortRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const urlQ = searchParams.get('q') || '';
    setInputVal(urlQ);
    setQuery(urlQ);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchTrending(), fetchTrendingTV()])
      .then(([mRes, tvRes]) => {
        if (cancelled) return;
        setTrendingMovies((mRes.data?.results || []).slice(0, 10));
        setTrendingTV((tvRes.data?.results || []).slice(0, 10));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingTrending(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);

    if (!inputVal.trim()) {
      setMovies([]);
      setTotalResults(0);
      setQuery('');
      setSearchParams({});
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const trimmed = inputVal.trim();
      setQuery(trimmed);
      setSearchParams({ q: trimmed });
      setPage(1);
      setLoading(true);

      if (searchAbortRef.current) {
        searchAbortRef.current.cancelled = true;
      }
      const currentRequest = { cancelled: false };
      searchAbortRef.current = currentRequest;

      try {
        const res = await searchMovies(trimmed, 1);
        if (currentRequest.cancelled) return;
        const data = res.data;
        setMovies(data?.results || []);
        setTotalResults(data?.total_results || 0);
        setTotalPages(data?.total_pages || 1);
      } catch {
        if (!currentRequest.cancelled) {
          setMovies([]);
          setTotalResults(0);
        }
      } finally {
        if (!currentRequest.cancelled) setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [inputVal, setSearchParams]);

  const loadMore = useCallback(async () => {
    if (loading || !query.trim()) return;
    const nextPage = page + 1;
    setPage(nextPage);
    setLoading(true);

    try {
      const res = await searchMovies(query, nextPage);
      const data = res.data;
      setMovies(prev => [...prev, ...(data?.results || [])]);
    } catch {
      // keep existing results
    } finally {
      setLoading(false);
    }
  }, [loading, query, page]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      if (searchAbortRef.current) {
        searchAbortRef.current.cancelled = true;
      }
    };
  }, []);

  const filteredMovies = typeFilter === 'all'
    ? movies
    : movies.filter(m => getSafeType(m) === typeFilter);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length <= MAX_QUERY_LENGTH) {
      setInputVal(val);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen pt-24 pb-16 bg-[#0a0f16]"
    >
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-prime-blue/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header & Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60 tracking-tight mb-4">
              Search
            </h1>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative"
          >
            <div className="relative group flex items-center">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-prime-blue/50 to-purple-600/50 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
              <div className="relative flex w-full items-center bg-[#101720]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300">
                <Search size={22} className="absolute left-5 text-white/50" />
                <input
                  ref={inputRef}
                  id="search-input"
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  placeholder="Find movies, shows, or actors..."
                  maxLength={MAX_QUERY_LENGTH}
                  className="w-full bg-transparent text-white text-lg sm:text-xl placeholder:text-white/30 pl-14 pr-14 py-5 sm:py-6 outline-none rounded-2xl"
                />
                <AnimatePresence>
                  {inputVal && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => {
                        setInputVal('');
                        inputRef.current?.focus();
                      }}
                      className="absolute right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 mt-8 flex-wrap"
          >
            {TYPE_FILTERS.map(({ key, label, Icon }) => {
              const isActive = typeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'text-white'
                      : 'text-white/50 hover:text-white/90 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-gradient-to-r from-prime-blue to-purple-600 rounded-full opacity-90"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={16} className={isActive ? "text-white" : ""} />
                    {label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Results Info */}
        {query && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-8 border-b border-white/10 pb-4"
          >
            <p className="text-white/60 text-sm sm:text-base">
              {totalResults > 0 ? (
                <>
                  Found <span className="text-white font-bold">{totalResults.toLocaleString()}</span> results for <span className="text-prime-blue font-semibold">"{query}"</span>
                </>
              ) : (
                `No results found for "${query}"`
              )}
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && page === 1 && <SkeletonGrid />}

        {/* Results Grid */}
        {!loading && filteredMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredMovies.map((movie, i) => (
              <ResultCard
                key={`${movie.id || movie.tmdbId}-${i}`}
                movie={movie}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMovies.length === 0 && (
          <EmptyState query={query} />
        )}

        {/* Default State / Trending */}
        {!query && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-12"
          >
            {/* Trending Tags */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-prime-blue/20 rounded-lg">
                  <TrendingUp size={20} className="text-prime-blue" />
                </div>
                <h2 className="text-white font-bold text-xl">Hot Searches</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => setInputVal(term)}
                    className="px-5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm font-medium text-white/70 hover:text-white hover:border-prime-blue/50 hover:bg-prime-blue/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-300"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Movies Grid */}
            {!loadingTrending && trendingMovies.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Film size={20} className="text-white" />
                  </div>
                  <h2 className="text-white font-bold text-xl">Trending Movies</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {trendingMovies.map((m, i) => (
                    <ResultCard key={m.id || m.tmdbId} movie={m} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Trending TV Grid */}
            {!loadingTrending && trendingTV.length > 0 && (
              <div className="pb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Tv size={20} className="text-purple-400" />
                  </div>
                  <h2 className="text-white font-bold text-xl">Trending TV Shows</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                  {trendingTV.map((m, i) => (
                    <ResultCard key={m.id || m.tmdbId} movie={m} index={i} />
                  ))}
                </div>
              </div>
            )}

            {loadingTrending && <SkeletonGrid />}
          </motion.div>
        )}

        {/* Pagination / Load More */}
        {!loading && movies.length > 0 && page < totalPages && (
          <div className="flex justify-center mt-16 mb-8">
            <button 
              onClick={loadMore} 
              className="group relative px-8 py-3.5 bg-transparent overflow-hidden rounded-full font-semibold text-white transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-white/10 border border-white/20 rounded-full group-hover:border-white/40 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-prime-blue/20 to-purple-600/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
              <span className="relative z-10 flex items-center gap-2">
                Load More Results
              </span>
            </button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="flex justify-center mt-12 mb-8">
            <div className="w-10 h-10 border-3 border-prime-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}