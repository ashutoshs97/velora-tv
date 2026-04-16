import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Play, Plus, Share2, Award, CheckCircle2 } from 'lucide-react';
import { fetchTrending, fetchTrendingTV, fetchTopRated, fetchHistory } from '../api';
import MovieGrid from '../components/MovieGrid';
import RecentlyWatched from '../components/RecentlyWatched';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [history, setHistory] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTrendingTV, setLoadingTrendingTV] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchHistory();
      setHistory(res.data);
    } catch {
      /* DB might be unavailable */
    }
  }, []);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const res = await fetchTrending();
        const movies = res.data.results || [];
        setTrending(movies);
        // Pick a hero movie with a backdrop that scores high
        const candidates = movies.filter((m) => m.backdrop_path && m.vote_average > 7);
        if (candidates.length) {
          // pick a random top one
          const randomIdx = Math.floor(Math.random() * Math.min(candidates.length, 5));
          setHeroMovie(candidates[randomIdx]);
        } else {
          // Fallback to ANY movie with a backdrop
          const anyWithBackdrop = movies.find(m => m.backdrop_path);
          if (anyWithBackdrop) {
            setHeroMovie(anyWithBackdrop);
          } else if (movies.length) {
            setHeroMovie(movies[0]);
          }
        }
      } finally {
        setLoadingTrending(false);
      }
    };

    const loadTrendingTV = async () => {
      try {
        const res = await fetchTrendingTV();
        setTrendingTV(res.data.results || []);
      } finally {
        setLoadingTrendingTV(false);
      }
    };

    const loadTopRated = async () => {
      try {
        const res = await fetchTopRated();
        setTopRated(res.data.results || []);
      } finally {
        setLoadingTopRated(false);
      }
    };

    loadTrending();
    loadTrendingTV();
    loadTopRated();
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="min-h-screen pb-16">
      {/* Prime-style Hero Billboard */}
      {heroMovie && (
        <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden -mt-20">
          {/* Backdrop Image */}
          <div className="absolute inset-0 w-full h-full">
            <img
              src={`${BACKDROP_BASE}${heroMovie.backdrop_path}`}
              alt={heroMovie.title}
              className="w-full h-full object-cover object-top opacity-80"
              style={{ objectPosition: '50% 15%' }}
            />
          </div>

          {/* Prime Gradients (Crucial for text readability) */}
          <div className="absolute inset-0 bg-hero-gradient-x opacity-90" />
          <div className="absolute inset-0 bg-hero-gradient-y" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0F171E]/90 to-transparent pointer-events-none" />

          {/* Content Block (Bottom Left) */}
          <div className="absolute bottom-16 sm:bottom-24 left-0 w-full z-10">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="w-full md:w-3/4 lg:w-[60%] animate-fade-up" style={{ animationDelay: '0.2s' }}>
                
                {/* Title */}
                <h1 className="text-5xl md:text-6xl lg:text-[5.5rem] font-black text-white mb-5 leading-[1.05] tracking-[-0.03em] drop-shadow-2xl">
                  {heroMovie.title || heroMovie.name}
                </h1>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-7">
                  <span className="flex items-center gap-1.5 text-[14px] font-bold text-prime-blue bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
                    <CheckCircle2 size={16} />
                    Included with Velora
                  </span>
                  <span className="text-[17px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                    {heroMovie.release_date?.substring(0, 4)}
                  </span>
                  <span className="text-[14px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded shadow-sm opacity-90">
                    4K UHD
                  </span>
                  <div className="flex items-center gap-1 text-[17px] font-bold text-yellow-400 border-l border-white/20 pl-4">
                    <Award size={18} fill="currentColor" />
                    <span>{heroMovie.vote_average?.toFixed(1)}</span>
                  </div>
                </div>

                {/* Synopsis */}
                <p className="text-lg text-white/90 line-clamp-3 mb-8 max-w-2xl font-medium leading-relaxed drop-shadow-md">
                  {heroMovie.overview}
                </p>

                {/* Action Row */}
                <div className="flex items-center gap-4">
                  <Link
                    to={`/watch/${heroMovie.id}?type=${heroMovie.media_type || heroMovie.type || (heroMovie.name ? 'tv' : 'movie')}`}
                    id="hero-watch-btn"
                    className="btn-primary text-xl scale-100 hover:scale-105"
                  >
                    <Play size={24} fill="#000" className="mr-2" />
                    Play
                  </Link>
                  <button title="Add to Watchlist" className="btn-secondary">
                    <Plus size={24} />
                  </button>
                  <button title="Share" className="btn-secondary">
                    <Share2 size={24} className="-ml-0.5" />
                  </button>
                </div>

              </div>
            </div>
          </div>
        </section>
      )}

      {/* Swimlanes (Content) */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 -mt-16 relative z-20 space-y-14">
        
        {/* Recently Watched overrides the container to look native to Prime */}
        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <RecentlyWatched history={history} onRefresh={loadHistory} />
        </div>

        {/* Trending Swimlane */}
        <section className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Prime Movies</h2>
            <span className="text-prime-blue text-xs font-bold px-2 py-0.5 bg-prime-blue/10 border border-prime-blue/20 rounded">Top Tier</span>
            <span className="text-prime-subtext text-sm ml-auto font-semibold hover:text-white cursor-pointer transition-colors hidden sm:block">View all ›</span>
          </div>
          <MovieGrid movies={trending} loading={loadingTrending} />
        </section>

        {/* Top Rated Swimlane */}
        <section className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Critically Acclaimed</h2>
          </div>
          <MovieGrid movies={topRated} loading={loadingTopRated} />
        </section>

        {/* Binge-Worthy TV Shows Swimlane */}
        <section className="mb-24 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-2xl font-bold text-white tracking-tight">Binge-Worthy TV Shows</h2>
          </div>
          <MovieGrid movies={trendingTV} loading={loadingTrendingTV} />
        </section>

      </div>
    </div>
  );
}
