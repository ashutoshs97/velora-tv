import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, Tv, Film, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { searchMovies, fetchTrending, fetchTrendingTV } from '../api';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w300';
const PLACEHOLDER = 'https://via.placeholder.com/92x138/1A242F/8197A4?text=V';

// ── Type filter tabs ─────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { key: 'all',   label: 'All',      Icon: Layers },
  { key: 'movie', label: 'Movies',   Icon: Film },
  { key: 'tv',    label: 'TV Shows', Icon: Tv },
];

// ── Trending pill list ───────────────────────────────────────────────────────
const TRENDING_SEARCHES = ['Avengers', 'Batman', 'Stranger Things', 'Inception', 'Breaking Bad', 'Interstellar', 'The Boys', 'Oppenheimer'];

// ── Card variants for staggered entrance ────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.96 },
  visible: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.055, duration: 0.35, ease: 'easeOut' },
  }),
};

// ── Result card ─────────────────────────────────────────────────────────────
function ResultCard({ movie, index }) {
  const id = movie.tmdbId || movie.id;
  const isTv = movie.media_type === 'tv' || (!movie.title && movie.name);
  const watchLink = `/watch/${id}${isTv ? '?type=tv' : '?type=movie'}`;
  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const img = movie.backdrop_path
    ? `${BACKDROP_BASE}${movie.backdrop_path}`
    : movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : PLACEHOLDER;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      layout
    >
      <Link
        to={watchLink}
        className="group flex flex-col rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-prime-blue/50 hover:bg-white/8 transition-all duration-300 hover:shadow-xl hover:shadow-prime-blue/10"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={img}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          {rating && (
            <span className="absolute top-2 right-2 text-[11px] font-bold text-yellow-400 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
              ★ {rating}
            </span>
          )}
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isTv ? 'bg-purple-600/80 text-white' : 'bg-prime-blue/80 text-white'}`}>
            {isTv ? 'TV' : 'Movie'}
          </span>
        </div>
        {/* Info */}
        <div className="p-3">
          <h3 className="text-white font-semibold text-sm line-clamp-1 mb-0.5">{title}</h3>
          <span className="text-prime-subtext text-xs">{year}</span>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Autocomplete dropdown item ───────────────────────────────────────────────
function AutocompleteItem({ movie, onClick }) {
  const isTv = movie.media_type === 'tv' || (!movie.title && movie.name);
  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const poster = movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : null;

  return (
    <button
      onMouseDown={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left group"
    >
      <div className="w-8 h-10 rounded overflow-hidden flex-shrink-0 bg-prime-surface">
        {poster
          ? <img src={poster} alt={title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-prime-subtext"><Film size={14}/></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{title}</p>
        <p className="text-prime-subtext text-xs">{year} · {isTv ? 'TV Show' : 'Movie'}</p>
      </div>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isTv ? 'bg-purple-600/30 text-purple-400' : 'bg-prime-blue/20 text-prime-blue'}`}>
        {isTv ? 'TV' : 'Film'}
      </span>
    </button>
  );
}

// ── Skeleton grid ───────────────────────────────────────────────────────────
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

// ── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ query }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-28 text-center"
    >
      {/* Animated illustration */}
      <div className="relative mb-8">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-3xl bg-gradient-to-br from-prime-blue/30 to-purple-600/20 border border-prime-blue/20 flex items-center justify-center shadow-2xl shadow-prime-blue/20"
        >
          <Sparkles size={48} className="text-prime-blue" />
        </motion.div>
        {/* Orbiting dot */}
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
            Search across millions of movies and TV shows. Or pick a trending title below to get started.
          </p>
        </>
      )}
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [typeFilter, setTypeFilter] = useState('all');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Autocomplete
  const [autocomplete, setAutocomplete] = useState([]);
  const [showAuto, setShowAuto] = useState(false);
  const autoDebounce = useRef(null);

  // Trending pre-search
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);

  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load trending for pre-search state
  useEffect(() => {
    Promise.all([fetchTrending(), fetchTrendingTV()])
      .then(([mRes, tvRes]) => {
        setTrendingMovies((mRes.data.results || []).slice(0, 10));
        setTrendingTV((tvRes.data.results || []).slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLoadingTrending(false));
  }, []);

  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) { setMovies([]); setTotalResults(0); return; }
    setLoading(true);
    try {
      const res = await searchMovies(q, p);
      const data = res.data;
      setMovies(p === 1 ? data.results : (prev) => [...prev, ...data.results]);
      setTotalResults(data.total_results);
      setTotalPages(data.total_pages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced main search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQuery(inputVal);
      if (inputVal.trim()) setSearchParams({ q: inputVal.trim() });
      else setSearchParams({});
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [inputVal, setSearchParams]);

  useEffect(() => { doSearch(query, 1); }, [query, doSearch]);

  // Autocomplete: fast 200ms debounce
  useEffect(() => {
    clearTimeout(autoDebounce.current);
    if (!inputVal.trim() || inputVal.length < 2) { setAutocomplete([]); return; }
    autoDebounce.current = setTimeout(async () => {
      try {
        const res = await searchMovies(inputVal, 1);
        setAutocomplete((res.data.results || []).slice(0, 6));
      } catch { setAutocomplete([]); }
    }, 200);
    return () => clearTimeout(autoDebounce.current);
  }, [inputVal]);

  // Filter by type
  const filteredMovies = typeFilter === 'all' ? movies : movies.filter(m => {
    const isTv = m.media_type === 'tv' || (!m.title && m.name);
    return typeFilter === 'tv' ? isTv : !isTv;
  });

  const loadMore = () => { const n = page + 1; setPage(n); doSearch(query, n); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pt-20 pb-16"
    >
      {/* ── Hero Search Section ── */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient bg strip */}
        <div className="absolute inset-0 bg-gradient-to-br from-prime-blue/8 via-transparent to-purple-900/8 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-8">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="text-4xl sm:text-5xl font-black text-white text-center mb-2 tracking-tight">
              Find Anything
            </h1>
            <p className="text-prime-subtext text-center mb-8">Movies, series, documentaries — all in one place</p>
          </motion.div>

          {/* Search bar container */}
          <div className="relative">
            <div className="relative flex items-center bg-white/8 border border-white/15 rounded-2xl shadow-2xl shadow-black/40 backdrop-blur-sm focus-within:border-prime-blue/60 focus-within:shadow-prime-blue/15 focus-within:bg-white/10 transition-all duration-300">
              <Search size={22} className="absolute left-5 text-prime-subtext flex-shrink-0" />
              <input
                ref={inputRef}
                id="search-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onFocus={() => setShowAuto(true)}
                onBlur={() => setTimeout(() => setShowAuto(false), 150)}
                placeholder="Search for movies, TV shows, documentaries…"
                className="w-full bg-transparent text-white text-lg placeholder:text-prime-subtext/60 pl-14 pr-14 py-5 outline-none rounded-2xl"
              />
              {inputVal && (
                <button onClick={() => setInputVal('')} className="absolute right-5 text-prime-subtext hover:text-white transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>

            {/* ── Autocomplete Dropdown ── */}
            <AnimatePresence>
              {showAuto && autocomplete.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  animate={{ opacity: 1, y: 0, scaleY: 1 }}
                  exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
                  transition={{ duration: 0.18 }}
                  style={{ transformOrigin: 'top' }}
                  className="absolute top-full left-0 right-0 mt-2 bg-[#1A242F]/95 backdrop-blur-xl border border-white/12 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50"
                >
                  <div className="py-1">
                    {autocomplete.map((movie) => (
                      <AutocompleteItem
                        key={movie.id}
                        movie={movie}
                        onClick={() => {
                          setInputVal(movie.title || movie.name);
                          setShowAuto(false);
                        }}
                      />
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-white/8 text-xs text-prime-subtext/60 text-center">
                    Press Enter to see all results
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Type Filter Toggle ── */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {TYPE_FILTERS.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setTypeFilter(key)}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
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

      {/* ── Results / Pre-search content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Result count */}
        {query && !loading && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-prime-subtext text-sm mb-6"
          >
            {totalResults > 0
              ? <><span className="text-white font-bold">{totalResults.toLocaleString()}</span> results for "<span className="text-prime-blue">{query}</span>"</>
              : `No results for "${query}"`}
          </motion.p>
        )}

        {/* Skeleton while loading first page */}
        {loading && page === 1 && <SkeletonGrid />}

        {/* Results grid with staggered entrance */}
        {!loading && filteredMovies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredMovies.map((movie, i) => (
              <ResultCard key={`${movie.id}-${i}`} movie={movie} index={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredMovies.length === 0 && <EmptyState query={query} />}

        {/* ── Trending Pre-Search Sections ── */}
        {!query && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-10 mt-2"
          >
            {/* Trending search pills */}
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

            {/* Trending Movies */}
            {!loadingTrending && trendingMovies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Film size={18} className="text-prime-blue" />
                  <h2 className="text-white font-bold text-lg">Trending Movies</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {trendingMovies.map((m, i) => <ResultCard key={m.id} movie={m} index={i} />)}
                </div>
              </div>
            )}

            {/* Trending TV */}
            {!loadingTrending && trendingTV.length > 0 && (
              <div className="pb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tv size={18} className="text-purple-400" />
                  <h2 className="text-white font-bold text-lg">Trending TV Shows</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {trendingTV.map((m, i) => <ResultCard key={m.id} movie={m} index={i} />)}
                </div>
              </div>
            )}

            {loadingTrending && <SkeletonGrid />}
          </motion.div>
        )}

        {/* Load More */}
        {!loading && movies.length > 0 && page < totalPages && (
          <div className="flex justify-center mt-10">
            <button onClick={loadMore} className="btn-primary px-10 py-3 text-base">
              Load More
            </button>
          </div>
        )}

        {/* Loading more spinner */}
        {loading && page > 1 && (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-2 border-prime-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
