import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Plus, Share2, Award, CheckCircle2, Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchTrending, fetchTrendingTV, fetchTopRated, fetchHistory, fetchNewReleases, fetchByGenre, fetchByMood, fetchSimilar, fetchMovieDetail } from '../api';
import CarouselRow from '../components/CarouselRow';
import RecentlyWatched from '../components/RecentlyWatched';

const GENRES = [
  { id: 28, label: 'Action' }, { id: 35, label: 'Comedy' }, { id: 18, label: 'Drama' },
  { id: 27, label: 'Horror' }, { id: 878, label: 'Sci-Fi' }, { id: 10749, label: 'Romance' },
  { id: 16, label: 'Animation' }, { id: 99, label: 'Documentary' }, { id: 53, label: 'Thriller' },
  { id: 10751, label: 'Family' },
];

const MOODS = [
  { key: 'action', emoji: '💥', label: 'Adrenaline Rush' },
  { key: 'comedy', emoji: '😂', label: 'Feel-Good Vibes' },
  { key: 'horror', emoji: '👻', label: 'Late Night Scare' },
  { key: 'romance', emoji: '💕', label: 'Date Night' },
  { key: 'scifi', emoji: '🚀', label: 'Mind-Bending' },
  { key: 'animated', emoji: '✨', label: 'Family Fun' },
];

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [history, setHistory] = useState([]);

  // ── Hero slider state ──────────────────────────────────────
  const [heroMovies, setHeroMovies] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1); // 1=right, -1=left
  const autoAdvanceRef = useRef(null);
  const heroMovie = heroMovies[heroIndex] || null;

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTrendingTV, setLoadingTrendingTV] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [newReleases, setNewReleases] = useState([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [genreMovies, setGenreMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [moodMovies, setMoodMovies] = useState([]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);
  const [loadingMood, setLoadingMood] = useState(false);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [becauseTitle, setBecauseTitle] = useState('');

  // ── Autoplay trailer state ──────────────────────────────────────
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerActive, setTrailerActive] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const trailerTimerRef = useRef(null);
  const trailerIframeRef = useRef(null);

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
        // Build ordered hero candidates (backdrop + good rating)
        const candidates = movies
          .filter(m => m.backdrop_path && m.vote_average > 6.5)
          .slice(0, 7);
        setHeroMovies(candidates.length ? candidates : movies.filter(m => m.backdrop_path).slice(0, 5));
        setHeroIndex(0);
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

    const loadNewReleases = async () => {
      try {
        const res = await fetchNewReleases();
        setNewReleases(res.data.results || []);
      } finally { setLoadingNew(false); }
    };

    loadTrending();
    loadTrendingTV();
    loadTopRated();
    loadNewReleases();
    loadHistory();
  }, [loadHistory]);

  // Load genre movies whenever selectedGenre changes
  useEffect(() => {
    setLoadingGenre(true);
    fetchByGenre(selectedGenre.id)
      .then(res => setGenreMovies(res.data.results || []))
      .catch(() => {})
      .finally(() => setLoadingGenre(false));
  }, [selectedGenre]);

  // Load mood movies whenever selectedMood changes
  useEffect(() => {
    setLoadingMood(true);
    fetchByMood(selectedMood.key)
      .then(res => setMoodMovies(res.data.results || []))
      .catch(() => {})
      .finally(() => setLoadingMood(false));
  }, [selectedMood]);

  // "Because you watched X" — fetch similar to most recently watched item
  useEffect(() => {
    if (!history || history.length === 0) return;
    const latest = history[0];
    setBecauseTitle(latest.title);
    fetchSimilar(latest.tmdbId, latest.type || 'movie')
      .then(res => setBecauseYouWatched(res.data.results || []))
      .catch(() => {});
  }, [history]);

  // ── Slider navigation helpers ────────────────────────────────────
  const goToSlide = useCallback((idx, dir = 1) => {
    setHeroDirection(dir);
    setHeroIndex(idx);
  }, []);

  const nextSlide = useCallback(() => {
    if (!heroMovies.length) return;
    const next = (heroIndex + 1) % heroMovies.length;
    goToSlide(next, 1);
  }, [heroIndex, heroMovies.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (!heroMovies.length) return;
    const prev = (heroIndex - 1 + heroMovies.length) % heroMovies.length;
    goToSlide(prev, -1);
  }, [heroIndex, heroMovies.length, goToSlide]);

  // ── Auto-advance every 10s (paused when trailer is active) ─────────────
  useEffect(() => {
    if (trailerActive && !trailerEnded) {
      clearInterval(autoAdvanceRef.current);
      return;
    }
    autoAdvanceRef.current = setInterval(nextSlide, 10000);
    return () => clearInterval(autoAdvanceRef.current);
  }, [nextSlide, trailerActive, trailerEnded]);

  // ── Fetch trailer key when heroMovie changes ────────────────────────────
  useEffect(() => {
    // Reset trailer state on hero change
    setTrailerKey(null);
    setTrailerActive(false);
    setTrailerEnded(false);
    setTrailerMuted(true);
    clearTimeout(trailerTimerRef.current);

    if (!heroMovie) return;

    // Fetch detail to get video list
    fetchMovieDetail(heroMovie.id)
      .then((res) => {
        const videos = res.data?.videos?.results || [];
        const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
          || videos.find(v => v.site === 'YouTube');
        if (trailer?.key) {
          setTrailerKey(trailer.key);
          // Show backdrop image first for 5s, then activate trailer
          trailerTimerRef.current = setTimeout(() => setTrailerActive(true), 5000);
        }
      })
      .catch(() => {});

    return () => clearTimeout(trailerTimerRef.current);
  }, [heroMovie]);

  const replayTrailer = () => {
    setTrailerEnded(false);
    setTrailerActive(false);
    setTimeout(() => setTrailerActive(true), 100);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, scale: 0.98 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pb-16"
    >
      {/* Prime-style Hero Billboard */}
      {heroMovies.length > 0 && heroMovie && (
        <section className="relative w-full min-h-[85vh] lg:min-h-[600px] overflow-hidden -mt-20">

          {/* ── Slide background ── */}
          <AnimatePresence initial={false} custom={heroDirection}>
            {(!trailerActive || trailerEnded) && (
              <motion.div
                key={`bg-${heroIndex}`}
                custom={heroDirection}
                variants={{
                  enter: (d) => ({ x: d > 0 ? '6%' : '-6%', opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d) => ({ x: d > 0 ? '-4%' : '4%', opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.85, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                <img
                  src={`${BACKDROP_BASE}${heroMovie.backdrop_path}`}
                  alt={heroMovie.title || heroMovie.name}
                  className="w-full h-full object-cover object-top opacity-80"
                  style={{ objectPosition: '50% 15%' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── YouTube Autoplay Trailer ── */}
          <AnimatePresence>
            {trailerActive && trailerKey && !trailerEnded && (
              <motion.div
                key="trailer"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 w-full h-full"
              >
                <iframe
                  ref={trailerIframeRef}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${trailerMuted ? 1 : 0}&controls=0&loop=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  className="w-full h-full"
                  style={{ border: 'none', pointerEvents: 'none' }}
                  title="Hero Trailer"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Gradients */}
          <div className="absolute inset-0 bg-hero-gradient-x opacity-90 z-[1] pointer-events-none" />
          <div className="absolute inset-0 bg-hero-gradient-y z-[1] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#080E14]/90 to-transparent pointer-events-none z-[1]" />

          {/* ── Content Block (slides with each hero) ── */}
          <div className="relative z-10 w-full min-h-[85vh] lg:min-h-[600px] flex flex-col justify-end pt-40 pb-20 sm:pb-28">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full">
              <AnimatePresence initial={false} custom={heroDirection} mode="wait">
                <motion.div
                  key={`content-${heroIndex}`}
                  custom={heroDirection}
                  variants={{
                    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
                  className="w-full md:w-3/4 lg:w-[58%]"
                >
                  {/* Title */}
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-[1.05] tracking-[-0.025em] drop-shadow-2xl line-clamp-3 font-display">
                    {heroMovie.title || heroMovie.name}
                  </h1>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6">
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-prime-blue bg-white/10 px-3 py-1.5 rounded-full backdrop-blur border border-white/10">
                      <CheckCircle2 size={14} /> Included with Velora
                    </span>
                    <span className="text-[15px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                      {(heroMovie.release_date || heroMovie.first_air_date)?.substring(0, 4)}
                    </span>
                    <div className="flex items-center gap-1 text-[15px] font-bold text-yellow-400 border-l border-white/20 pl-4">
                      <Award size={16} fill="currentColor" />
                      <span>{heroMovie.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Synopsis — hides during trailer */}
                  <AnimatePresence>
                    {(!trailerActive || trailerEnded) && (
                      <motion.p
                        key="synopsis"
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.4 }}
                        className="text-base text-white/85 line-clamp-3 mb-7 max-w-xl font-medium leading-relaxed drop-shadow-md"
                      >
                        {heroMovie.overview}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      to={`/watch/${heroMovie.id}?type=${heroMovie.media_type || heroMovie.type || (heroMovie.name ? 'tv' : 'movie')}`}
                      id="hero-watch-btn"
                      className="btn-primary text-base hover:scale-105"
                    >
                      <Play size={20} fill="#000" className="mr-1.5" /> Play
                    </Link>
                    <button title="Add to Watchlist" className="btn-secondary"><Plus size={22} /></button>
                    <button title="Share" className="btn-secondary"><Share2 size={22} className="-ml-0.5" /></button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ── Slider nav: arrows + dots ── */}
          <div className="absolute bottom-6 left-0 right-0 z-20">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex items-center justify-between">

              {/* dot indicators */}
              <div className="flex items-center gap-2">
                {heroMovies.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i, i > heroIndex ? 1 : -1)}
                    className="group relative h-[3px] rounded-full overflow-hidden transition-all duration-300"
                    style={{ width: i === heroIndex ? 28 : 10 }}
                  >
                    {/* track */}
                    <span className="absolute inset-0 bg-white/25 rounded-full" />
                    {/* active fill */}
                    {i === heroIndex && (
                      <motion.span
                        key={heroIndex}
                        className="absolute inset-0 bg-white rounded-full origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 10, ease: 'linear' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* right-side: prev/next + trailer controls */}
              <div className="flex items-center gap-2">
                {/* Trailer mute toggle */}
                {trailerKey && trailerActive && !trailerEnded && (
                  <button
                    onClick={() => { setTrailerMuted(m => !m); setTrailerActive(false); setTimeout(() => setTrailerActive(true), 50); }}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/15 transition-all"
                  >
                    {trailerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                )}
                {trailerKey && trailerEnded && (
                  <button
                    onClick={replayTrailer}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-all"
                  >
                    <RotateCcw size={12} /> Replay
                  </button>
                )}

                {/* Prev */}
                <button
                  onClick={prevSlide}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur border border-white/12 text-white flex items-center justify-center hover:bg-white/15 hover:border-white/30 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Next */}
                <button
                  onClick={nextSlide}
                  className="w-9 h-9 rounded-full bg-black/40 backdrop-blur border border-white/12 text-white flex items-center justify-center hover:bg-white/15 hover:border-white/30 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
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

        {/* Trending Swimlane — Ranked + Poster */}
        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <CarouselRow
            title="Top 10 Movies"
            badge="Trending"
            movies={trending}
            loading={loadingTrending}
            ranked
            usePoster
          />
        </div>

        {/* Top Rated Swimlane — Backdrop style */}
        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <CarouselRow
            title="Critically Acclaimed"
            badge="Top Rated"
            movies={topRated}
            loading={loadingTopRated}
          />
        </div>

        {/* Binge-Worthy TV Shows Swimlane — Poster */}
        <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <CarouselRow
            title="Binge-Worthy TV Shows"
            badge="Series"
            movies={trendingTV}
            loading={loadingTrendingTV}
            usePoster
          />
        </div>

        {/* New Releases This Week */}
        <div className="animate-fade-up" style={{ animationDelay: '0.7s' }}>
          <CarouselRow
            title="Fresh Drops"
            badge="New This Month"
            movies={newReleases}
            loading={loadingNew}
          />
        </div>

        {/* Because You Watched */}
        {becauseYouWatched.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.75s' }}>
            <CarouselRow
              title={`Because You Watched "${becauseTitle}"`}
              movies={becauseYouWatched}
              usePoster
            />
          </div>
        )}

        {/* Genre Filter Carousel */}
        <div className="animate-fade-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-3 mb-4 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Genre</h2>
          </div>
          {/* Genre pill selector */}
          <div className="flex gap-2 flex-wrap mb-5">
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  selectedGenre.id === g.id
                    ? 'bg-prime-blue text-white border-prime-blue shadow-lg shadow-prime-blue/30'
                    : 'bg-white/5 text-prime-subtext border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <CarouselRow
            title=""
            movies={genreMovies}
            loading={loadingGenre}
          />
        </div>

        {/* Mood-Based Collections */}
        <div className="mb-24 animate-fade-up" style={{ animationDelay: '0.85s' }}>
          <div className="flex items-center gap-3 mb-4 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">What's Your Mood?</h2>
          </div>
          {/* Mood pill selector */}
          <div className="flex gap-3 flex-wrap mb-5">
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMood(m)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                  selectedMood.key === m.key
                    ? 'bg-prime-blue/20 text-prime-blue border-prime-blue/50 shadow-lg shadow-prime-blue/20'
                    : 'bg-white/5 text-prime-subtext border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
          <CarouselRow
            title=""
            movies={moodMovies}
            loading={loadingMood}
          />
        </div>

      </div>
    </motion.div>
  );
}
