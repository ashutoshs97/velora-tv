import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, X, SlidersHorizontal, Film } from 'lucide-react';
import { searchMovies } from '../api';
import MovieGrid from '../components/MovieGrid';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [inputVal, setInputVal] = useState(initialQ);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q, p = 1) => {
    if (!q.trim()) {
      setMovies([]);
      setTotalResults(0);
      return;
    }
    setLoading(true);
    try {
      const res = await searchMovies(q, p);
      const data = res.data;
      setMovies(p === 1 ? data.results : (prev) => [...prev, ...data.results]);
      setTotalResults(data.total_results);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on input change
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setQuery(inputVal);
      if (inputVal.trim()) {
        setSearchParams({ q: inputVal.trim() });
      } else {
        setSearchParams({});
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [inputVal, setSearchParams]);

  useEffect(() => {
    doSearch(query, 1);
  }, [query, doSearch]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    doSearch(query, nextPage);
  };

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="pt-8 mb-8">
          <h1 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
            <Film size={28} className="text-prime-blue" />
            Browse Movies
          </h1>

          {/* Large Search Input */}
          <div className="relative max-w-2xl">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-prime-subtext" />
            <input
              ref={inputRef}
              id="search-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search for any movie…"
              className="w-full bg-[#1A242F] border border-transparent text-white text-lg
                         placeholder:text-prime-subtext rounded-xl pl-12 pr-12 py-4 outline-none
                         focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all shadow-inner"
            />
            {inputVal && (
              <button
                onClick={() => setInputVal('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-prime-subtext hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Result count */}
          {query && !loading && (
            <p className="text-prime-subtext text-sm mt-3">
              {totalResults > 0
                ? `Found ${totalResults.toLocaleString()} results for "${query}"`
                : `No results for "${query}"`}
            </p>
          )}
        </div>

        {/* Results Grid */}
        <MovieGrid
          movies={movies}
          loading={loading && page === 1}
          emptyMessage={query ? `No movies found for "${query}"` : 'Start typing to search for movies…'}
        />

        {/* Load More */}
        {!loading && movies.length > 0 && page < totalPages && (
          <div className="flex justify-center mt-10">
            <button
              id="load-more-btn"
              onClick={loadMore}
              className="btn-primary px-8 py-3 text-base"
            >
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
    </div>
  );
}
