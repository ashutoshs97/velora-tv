import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Tv, Film, Layers, Sparkles, TrendingUp, Users, User } from 'lucide-react';
import { searchMovies, fetchTrending, fetchTrendingTV } from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w300';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='169' viewBox='0 0 300 169'%3E%3Crect width='300' height='169' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

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
  if (item.known_for_department) return 'person'; // fallback for person
  if (item.name && !item.title) return 'tv';
  return 'movie';
}

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: {
      delay: Math.min(i * 0.055, 0.4),
      duration: 0.35,
      ease: 'easeOut',
    },
  }),
};

function ResultCard({ movie, index }) {
  const [imgError, setImgError] = useState(false);

  const id = movie.tmdbId || movie.id;
  const isPerson = mediaType === 'person';
  const watchLink = id 
    ? isPerson ? `/person/${id}` : `/watch/${id}?type=${mediaType}` 
    : '/';
  
  const title = movie.title || movie.name || 'Untitled';
  const year = isPerson
    ? movie.known_for_department || 'Actor'
    : (movie.release_date || movie.first_air_date || '').substring(0, 4);

  const rawImg = isPerson 
    ? (movie.profile_path ? `${BACKDROP_BASE}${movie.profile_path}` : null) 
    : (movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null);

  const img = imgError || !rawImg ? PLACEHOLDER_SVG : rawImg;
  const isTv = mediaType === 'tv';

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
        className="group flex flex-col rounded-xl overflow-hidden bg-white/5 border border-transparent hover:border-prime-blue/40 hover:bg-white/8 transition-all duration-300 hover:shadow-xl hover:shadow-prime-blue/10"
      >
        <div className="relative aspect-video overflow-hidden">
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {rating && !isPerson && (
            <span className="absolute top-2 right-2 text-[11px] font-bold text-yellow-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
              ★ {rating}
            </span>
          )}
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
            isPerson ? 'bg-amber-600/80 text-white' : isTv ? 'bg-purple-600/80 text-white' : 'bg-prime-blue/80 text-white'
          }`}>
            {isPerson ? 'Person' : isTv ? 'TV' : 'Movie'}
          </span>
        </div>
        <div className="p-3">
          <h3 className="text-white font-semibold text-sm line-clamp-1 mb-0.5">{title}</h3>
          <span className={`text-xs ${isPerson ? 'text-amber-400/80' : 'text-prime-subtext'}`}>{year}</span>
        </div>
      </a>
    </motion.div>
  );
}

function AutocompleteItem({ movie, onClick }) {
  const [imgError, setImgError] = useState(false);
  const mediaType = getSafeType(movie);
  const isTv = mediaType === 'tv';
  const isPerson = mediaType === 'person';
  const title = movie.title || movie.name || 'Untitled';
  const year = isPerson
    ? movie.known_for_department || 'Actor'
    : (movie.release_date || movie.first_air_date || '').substring(0, 4);
    
  const poster = !imgError 
    ? isPerson && movie.profile_path ? `${POSTER_BASE}${movie.profile_path}` 
    : movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null
    : null;

  return (
    <button
      onMouseDown={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left group"
    >
      <div className={`w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-prime-surface ${isPerson ? 'rounded-full' : ''}`}>
        {poster ? (
          <img
            src={poster}
            alt={title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-prime-subtext">
            {isPerson ? <User size={14} /> : <Film size={14} />}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{title}</p>
        <p className="text-prime-subtext text-xs">
          {year}{!isPerson && year ? ' · ' : ''}{!isPerson ? (isTv ? 'TV Show' : 'Movie') : ''}
        </p>
      </div>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
        isPerson ? 'bg-amber-600/30 text-amber-500' : isTv ? 'bg-purple-600/30 text-purple-400' : 'bg-prime-blue/20 text-prime-blue'
      }`}>
        {isPerson ? 'Person' : isTv ? 'TV' : 'Film'}
      </span>
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden">
          <div className="aspect-video skeleton" />
          <div className="p-3 bg-white/5 space-y-1.5">
            <div className="skeleton h-3 rounded w-4/5" />
            <div className="skeleton h-2.5 rounded w-1/3" />
          </div>
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
          className="w-28 h-28 rounded-3xl bg-gradient-to-br from-prime-blue/30 to-purple-600/20 border border-prime-blue/20 flex items-center justify-center shadow-2xl shadow-prime-blue/20"
        >
          <Sparkles size={48} className="text-prime-blue" />
        </motion.div>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute inset-0 flex items-start justify-center"
        >
          <div className="w-3 h-3 rounded-full bg-prime-blue shadow-lg shadow-prime-blue/60 -mt-1.5" />
        </motion.div>
      </div>
      {query ? (
        <>
          <h2 className="text-2xl font-black text-white mb-2">No results for "{query}"</h2>
          <p className="text-prime-subtext max-w-sm leading-relaxed">
            Try a different spelling, or switch the type filter above.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-black text-white mb-2">Discover anything</h2>
          <p className="text-prime-subtext max-w-sm leading-relaxed">
            Search across millions of movies and TV shows.
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
  const [autocomplete, setAutocomplete] = useState([]);
  const [showAuto, setShowAuto] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const debounceRef = useRef(null);
  const autoDebounceRef = useRef(null);
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

  useEffect(() => {
    clearTimeout(autoDebounceRef.current);

    if (!inputVal.trim() || inputVal.length < 2) {
      setAutocomplete([]);
      return;
    }

    let cancelled = false;
    autoDebounceRef.current = setTimeout(async () => {
      try {
        const res = await searchMovies(inputVal, 1);
        if (!cancelled) {
          setAutocomplete((res.data?.results || []).slice(0, 6));
        }
      } catch {
        if (!cancelled) setAutocomplete([]);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(autoDebounceRef.current);
    };
  }, [inputVal]);

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
      clearTimeout(autoDebounceRef.current);
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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pt-20 pb-16"
    >
      {/* Hero Search Section — overflow-visible so dropdown isn't clipped */}
      <div className="relative overflow-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-prime-blue/8 via-transparent to-purple-900/8 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white text-center mb-2 tracking-tight">
              Find Anything
            </h1>
            <p className="text-prime-subtext text-center mb-8 text-sm sm:text-base">
              Movies, series, documentaries — all in one place
            </p>
          </motion.div>

          {/* Search bar — z-[160] ensures dropdown floats above everything */}
          <div className="relative z-[160]">
            <div className="relative flex items-center bg-white/8 border border-white/15 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-sm focus-within:border-prime-blue/60 focus-within:shadow-prime-blue/15 focus-within:bg-white/10 transition-all duration-300">
              <Search size={20} className="absolute left-4 sm:left-5 text-prime-subtext flex-shrink-0" />
              <input
                ref={inputRef}
                id="search-input"
                type="text"
                value={inputVal}
                onChange={handleInputChange}
                onFocus={() => setShowAuto(true)}
                onBlur={() => setTimeout(() => setShowAuto(false), 200)}
                placeholder="Search movies, TV shows…"
                maxLength={MAX_QUERY_LENGTH}
                className="w-full bg-transparent text-white text-base sm:text-lg placeholder:text-prime-subtext/60 pl-12 sm:pl-14 pr-12 sm:pr-14 py-4 sm:py-5 outline-none rounded-2xl"
              />
              {inputVal && (
                <button
                  onClick={() => {
                    setInputVal('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute right-4 sm:right-5 text-prime-subtext hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Autocomplete dropdown — z-[170] above search bar and everything else */}
            <AnimatePresence>
              {showAuto && autocomplete.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  transition={{ duration: 0.18 }}
                  style={{ transformOrigin: 'top' }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1A242F]/95 backdrop-blur-xl border border-prime-blue/20 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-[170]"                >
                  <div className="py-1">
                    {autocomplete.map((movie) => (
                      <AutocompleteItem
                        key={movie.id || movie.tmdbId}
                        movie={movie}
                        onClick={() => {
                          const title = movie.title || movie.name || '';
                          setInputVal(title);
                          setShowAuto(false);
                          inputRef.current?.focus();
                        }}
                      />
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-white/5 text-xs text-prime-subtext/60 text-center">
                    Press Enter to see all results
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Type filter pills */}
          <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
            {TYPE_FILTERS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                  typeFilter === key
                    ? 'bg-prime-blue text-white border-prime-blue shadow-lg shadow-prime-blue/30'
                    : 'bg-white/5 text-prime-subtext border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-0">

        {query && !loading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-prime-subtext text-sm mb-6"
          >
            {totalResults > 0 ? (
              <>
                <span className="text-white font-bold">
                  {totalResults.toLocaleString()}
                </span>{' '}
                results for "
                <span className="text-prime-blue">{query}</span>"
              </>
            ) : (
              `No results for "${query}"`
            )}
          </motion.p>
        )}

        {loading && page === 1 && <SkeletonGrid />}

        {!loading && filteredMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 relative z-0">
            {filteredMovies.map((movie, i) => (
              <ResultCard
                key={`${movie.id || movie.tmdbId}-${i}`}
                movie={movie}
                index={i}
              />
            ))}
          </div>
        )}

        {!loading && filteredMovies.length === 0 && (
          <EmptyState query={query} />
        )}

        {!query && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-10 mt-2"
          >
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-prime-blue" />
                <h2 className="text-white font-bold text-lg">Trending Searches</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => setInputVal(term)}
                    className="px-4 py-1.5 rounded-full bg-white/8 border border-white/10 text-sm text-prime-subtext hover:text-white hover:border-prime-blue/50 hover:bg-prime-blue/10 transition-all duration-200"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {!loadingTrending && trendingMovies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Film size={18} className="text-prime-blue" />
                  <h2 className="text-white font-bold text-lg">Trending Movies</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 relative z-0">
                  {trendingMovies.map((m, i) => (
                    <ResultCard key={m.id || m.tmdbId} movie={m} index={i} />
                  ))}
                </div>
              </div>
            )}

            {!loadingTrending && trendingTV.length > 0 && (
              <div className="pb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tv size={18} className="text-purple-400" />
                  <h2 className="text-white font-bold text-lg">Trending TV Shows</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 relative z-0">
                  {trendingTV.map((m, i) => (
                    <ResultCard key={m.id || m.tmdbId} movie={m} index={i} />
                  ))}
                </div>
              </div>
            )}

            {loadingTrending && <SkeletonGrid />}
          </motion.div>
        )}

        {!loading && movies.length > 0 && page < totalPages && (
          <div className="flex justify-center mt-10">
            <button
              onClick={loadMore}
              className="btn-primary px-10 py-3 text-base"
            >
              Load More
            </button>
          </div>
        )}

        {loading && page > 1 && (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-2 border-prime-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}