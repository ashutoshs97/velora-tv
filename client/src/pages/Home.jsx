import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Play, Plus, Share2, Award, CheckCircle2, Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchTrending, fetchTrendingTV, fetchTopRated, fetchHistory, fetchByGenre, fetchByMood, fetchSimilar, fetchMovieDetail } from '../api';
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

    loadTrending();
    loadTrendingTV();
    loadTopRated();
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

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* Swimlanes                                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 -mt-16 pb-24">

        {/* ── Ambient orb 1 (top) ── */}
        <div className="pointer-events-none absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(0,180,255,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 space-y-16">

          {/* ── Continue Watching ── */}
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <RecentlyWatched history={history} onRefresh={loadHistory} />
          </div>

          {/* ── Top 10 ── */}
          <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <SectionHeader title="Top 10 Today" badge="🔥 Trending" accent="blue" />
            <CarouselRow title="" badge="" movies={trending} loading={loadingTrending} ranked usePoster />
          </div>

          {/* ── Ambient orb 2 (mid) ── */}
          <div className="pointer-events-none absolute left-3/4 w-[500px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)', filter: 'blur(80px)' }} />

          {/* ── Critically Acclaimed ── */}
          <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
            <SectionHeader title="Critically Acclaimed" badge="⭐ Top Rated" accent="gold" />
            <CarouselRow title="" badge="" movies={topRated} loading={loadingTopRated} />
          </div>

          {/* ── Binge-Worthy TV ── */}
          <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <SectionHeader title="Binge-Worthy Series" badge="📺 TV Shows" accent="purple" />
            <CarouselRow title="" badge="" movies={trendingTV} loading={loadingTrendingTV} usePoster />
          </div>

          {/* ── Because You Watched ── */}
          {becauseYouWatched.length > 0 && (
            <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
              <SectionHeader title={`Because You Watched`} sub={`"${becauseTitle}"`} accent="blue" />
              <CarouselRow title="" badge="" movies={becauseYouWatched} usePoster />
            </div>
          )}

          {/* ── Browse by Genre ── */}
          <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
            {/* Header */}
            <SectionHeader title="Browse by Genre" accent="blue" />

            {/* Genre pill row */}
            <div className="flex gap-2 flex-wrap mb-6">
              {GENRES.map((g) => {
                const active = selectedGenre.id === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g)}
                    className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border select-none overflow-hidden ${
                      active
                        ? 'text-white border-transparent'
                        : 'bg-white/[0.04] text-prime-subtext border-white/8 hover:border-prime-blue/40 hover:text-white hover:bg-prime-blue/8'
                    }`}
                    style={active ? {
                      background: 'linear-gradient(135deg, #00B4FF 0%, #0070CC 100%)',
                      boxShadow: '0 0 16px rgba(0,180,255,0.4), 0 2px 8px rgba(0,0,0,0.4)'
                    } : {}}
                  >
                    {active && (
                      <span className="absolute inset-0 bg-white/10 rounded-full" style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)'
                      }} />
                    )}
                    <span className="relative">{g.label}</span>
                  </button>
                );
              })}
            </div>

            <CarouselRow title="" badge="" movies={genreMovies} loading={loadingGenre} />
          </div>

          {/* ── Mood Collections ── */}
          <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
            <SectionHeader title="What's Your Mood?" accent="purple" />

            {/* Mood pill row */}
            <div className="flex gap-2 flex-wrap mb-6">
              {MOODS.map((mood) => {
                const active = selectedMood.key === mood.key;
                return (
                  <button
                    key={mood.key}
                    onClick={() => setSelectedMood(mood)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border select-none ${
                      active
                        ? 'text-white border-transparent shadow-lg'
                        : 'bg-white/[0.04] text-prime-subtext border-white/8 hover:border-white/20 hover:text-white hover:bg-white/8'
                    }`}
                    style={active ? {
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.8) 0%, rgba(0,100,200,0.6) 100%)',
                      boxShadow: '0 0 20px rgba(124,58,237,0.35)'
                    } : {}}
                  >
                    <span className="text-base leading-none">{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                );
              })}
            </div>

            <CarouselRow title="" badge="" movies={moodMovies} loading={loadingMood} />
          </div>

        </div>

        {/* ── Bottom ambient glow ── */}
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(0,180,255,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

    </motion.div>
  );
}
