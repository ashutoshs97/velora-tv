import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Plus, Share2, Award, CheckCircle2,
  Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import {
  fetchTrending, fetchTrendingTV, fetchTopRated, fetchHistory,
  fetchNewReleases, fetchByGenre, fetchByMood, fetchSimilar, fetchMovieDetail
} from '../api';
import CarouselRow from '../components/CarouselRow';
import PrimeCarouselRow from '../components/PrimeCarouselRow';
import RecentlyWatched from '../components/RecentlyWatched';

const GENRES = [
  { id: 28, label: 'Action' }, { id: 35, label: 'Comedy' },
  { id: 18, label: 'Drama' }, { id: 27, label: 'Horror' },
  { id: 878, label: 'Sci-Fi' }, { id: 10749, label: 'Romance' },
  { id: 16, label: 'Animation' }, { id: 99, label: 'Documentary' },
  { id: 53, label: 'Thriller' }, { id: 10751, label: 'Family' },
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

// ── Safe media type helper ────────────────────────────────────────────────
function getSafeType(movie) {
  if (!movie) return 'movie';
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

export default function Home() {
  // ── Data states ───────────────────────────────────────────────────────
  const [trending, setTrending] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [history, setHistory] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [moodMovies, setMoodMovies] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [becauseTitle, setBecauseTitle] = useState('');

  // ── Loading states ────────────────────────────────────────────────────
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTrendingTV, setLoadingTrendingTV] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);

  // ── Hero slider states ────────────────────────────────────────────────
  const [heroMovies, setHeroMovies] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);
  const [heroImgError, setHeroImgError] = useState(false);
  const autoAdvanceRef = useRef(null);

  // ── Trailer states ────────────────────────────────────────────────────
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerActive, setTrailerActive] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const trailerTimerRef = useRef(null);
  const replayTimerRef = useRef(null);
  const trailerIframeRef = useRef(null);

  // ── Share state ───────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── Filter/selection states ───────────────────────────────────────────
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);

  // ── Derived values ────────────────────────────────────────────────────
  const heroMovie = useMemo(
    () => heroMovies[heroIndex] || null,
    [heroMovies, heroIndex]
  );

  // ── Share handler ─────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (!heroMovie) return;
    const url = `${window.location.origin}/watch/${heroMovie.id}?type=${getSafeType(heroMovie)}`;
    const textToShare = `Check out "${heroMovie.title || heroMovie.name}" on Velora! 🍿\n\n${url}`;

    const copyFallback = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToShare;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // silent fallback
      }
    };

    if (navigator.share) {
      navigator.share({
        title: heroMovie.title || heroMovie.name || 'Velora',
        text: 'Check out this awesome movie on Velora!',
        url
      }).catch(() => {});
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToShare).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(copyFallback);
    } else {
      copyFallback();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [heroMovie]);

  // ── History loader ────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchHistory();
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      // DB unavailable — history stays empty, app still works
      setHistory([]);
    }
  }, []);

  // ── Initial data load ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      try {
        const res = await fetchTrending();
        if (cancelled) return;
        const movies = res.data?.results || [];
        setTrending(movies);
        const candidates = movies
          .filter(m => m.backdrop_path && m.vote_average > 6.5)
          .slice(0, 7);
        setHeroMovies(
          candidates.length
            ? candidates
            : movies.filter(m => m.backdrop_path).slice(0, 5)
        );
        setHeroIndex(0);
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    };

    const loadTrendingTV = async () => {
      try {
        const res = await fetchTrendingTV();
        if (!cancelled) setTrendingTV(res.data?.results || []);
      } catch {
        if (!cancelled) setTrendingTV([]);
      } finally {
        if (!cancelled) setLoadingTrendingTV(false);
      }
    };

    const loadTopRated = async () => {
      try {
        const res = await fetchTopRated();
        if (!cancelled) setTopRated(res.data?.results || []);
      } catch {
        if (!cancelled) setTopRated([]);
      } finally {
        if (!cancelled) setLoadingTopRated(false);
      }
    };

    const loadNewReleases = async () => {
      try {
        const res = await fetchNewReleases();
        if (!cancelled) setNewReleases(res.data?.results || []);
      } catch {
        if (!cancelled) setNewReleases([]);
      } finally {
        if (!cancelled) setLoadingNew(false);
      }
    };

    loadTrending();
    loadTrendingTV();
    loadTopRated();
    loadNewReleases();
    loadHistory();

    return () => { cancelled = true; };
  }, [loadHistory]);

  // ── Genre movies ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);
    fetchByGenre(selectedGenre.id)
      .then(res => {
        if (!cancelled) setGenreMovies(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setGenreMovies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGenre(false);
      });
    return () => { cancelled = true; };
  }, [selectedGenre]);

  // ── Mood movies ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingMood(true);
    fetchByMood(selectedMood.key)
      .then(res => {
        if (!cancelled) setMoodMovies(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setMoodMovies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMood(false);
      });
    return () => { cancelled = true; };
  }, [selectedMood]);

  // ── Because You Watched ───────────────────────────────────────────────
  useEffect(() => {
    if (!history?.length) return;
    let cancelled = false;
    const latest = history[0];
    if (!latest?.tmdbId) return;

    setBecauseTitle(latest.title || 'your last watch');
    fetchSimilar(latest.tmdbId, latest.type || 'movie')
      .then(res => {
        if (!cancelled) setBecauseYouWatched(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setBecauseYouWatched([]);
      });

    return () => { cancelled = true; };
  }, [history]);

  // ── Slider navigation ─────────────────────────────────────────────────
  const goToSlide = useCallback((idx, dir = 1) => {
    setHeroDirection(dir);
    setHeroIndex(idx);
    setHeroImgError(false); // reset image error on slide change
  }, []);

  const nextSlide = useCallback(() => {
    if (!heroMovies.length) return;
    goToSlide((heroIndex + 1) % heroMovies.length, 1);
  }, [heroIndex, heroMovies.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (!heroMovies.length) return;
    goToSlide((heroIndex - 1 + heroMovies.length) % heroMovies.length, -1);
  }, [heroIndex, heroMovies.length, goToSlide]);

  // ── Auto-advance ──────────────────────────────────────────────────────
  useEffect(() => {
    if (trailerActive && !trailerEnded) {
      clearInterval(autoAdvanceRef.current);
      return;
    }
    autoAdvanceRef.current = setInterval(nextSlide, 10000);
    return () => clearInterval(autoAdvanceRef.current);
  }, [nextSlide, trailerActive, trailerEnded]);

  // ── Fetch trailer when hero changes ──────────────────────────────────
  useEffect(() => {
    setTrailerKey(null);
    setTrailerActive(false);
    setTrailerEnded(false);
    setTrailerMuted(true);
    clearTimeout(trailerTimerRef.current);

    if (!heroMovie?.id) return;
    let cancelled = false;

    fetchMovieDetail(heroMovie.id)
      .then(res => {
        if (cancelled) return;
        const videos = res.data?.videos?.results || [];
        const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube')
          || videos.find(v => v.site === 'YouTube');
        // Validate key is a real non-empty string
        if (trailer?.key && typeof trailer.key === 'string' && trailer.key.trim()) {
          setTrailerKey(trailer.key.trim());
          trailerTimerRef.current = setTimeout(() => {
            if (!cancelled) setTrailerActive(true);
          }, 6000);
        }
      })
      .catch(() => { }); // trailer is optional — silently skip

    return () => {
      cancelled = true;
      clearTimeout(trailerTimerRef.current);
    };
  }, [heroMovie]);

  // ── Replay trailer ────────────────────────────────────────────────────
  const replayTrailer = useCallback(() => {
    clearTimeout(replayTimerRef.current);
    setTrailerEnded(false);
    setTrailerActive(false);
    replayTimerRef.current = setTimeout(() => setTrailerActive(true), 100);
  }, []);

  // Cleanup replay timer on unmount
  useEffect(() => {
    return () => {
      clearTimeout(replayTimerRef.current);
      clearTimeout(trailerTimerRef.current);
      clearInterval(autoAdvanceRef.current);
    };
  }, []);

  // ── Mute toggle — no iframe restart ──────────────────────────────────
  const toggleMute = useCallback(() => {
    setTrailerMuted(m => {
      const newMuted = !m;

      // Use YouTube postMessage API to mute/unmute without reloading iframe
      try {
        const iframe = trailerIframeRef.current;
        if (iframe?.contentWindow) {
          const command = newMuted ? 'mute' : 'unMute';
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: command }),
            'https://www.youtube.com'
          );
        }
      } catch {
        // postMessage failed — silent fallback
      }

      return newMuted;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      {/* ── Hero Billboard ── */}
      {heroMovies.length > 0 && heroMovie && (
        <section className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[600px] overflow-hidden -mt-20 pt-4">

          {/* Slide background */}
          <AnimatePresence initial={false} custom={heroDirection}>
            {(!trailerActive || trailerEnded) && (
              <motion.div
                key={`bg-${heroIndex}`}
                custom={heroDirection}
                variants={{
                  enter: (d) => ({ x: d > 0 ? '6%' : '-6%', opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: { opacity: 0 },
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
                className="absolute inset-0 w-full h-full"
              >
                {!heroImgError ? (
                  <img
                    src={`${BACKDROP_BASE}${heroMovie.backdrop_path}`}
                    alt={heroMovie.title || heroMovie.name || 'Featured movie'}
                    className="w-full h-full object-cover object-top opacity-80 scale-[1.05] sm:scale-[1.08]"
                    style={{ objectPosition: '50% 15%' }}
                    onError={() => setHeroImgError(true)}
                  />
                ) : (
                  // Fallback gradient if image fails
                  <div className="w-full h-full bg-gradient-to-br from-prime-surface to-black" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* YouTube Autoplay Trailer */}
          <AnimatePresence>
            {trailerActive && trailerKey && !trailerEnded && (
              <motion.div
                key="trailer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full"
              >
                <iframe
                  ref={trailerIframeRef}
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`}
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

          {/* Content Block */}
          <div className="relative z-10 w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[600px] flex flex-col justify-end pt-28 pb-20 sm:pb-28">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
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
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.15] tracking-[-0.025em] drop-shadow-2xl line-clamp-3 font-display pb-2">
                    {heroMovie.title || heroMovie.name || 'Untitled'}
                  </h1>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-prime-blue bg-white/10 px-3 py-1.5 rounded-full backdrop-blur border border-white/10">
                      <CheckCircle2 size={14} /> Included with Velora
                    </span>
                    {(heroMovie.release_date || heroMovie.first_air_date) && (
                      <span className="text-[15px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                        {(heroMovie.release_date || heroMovie.first_air_date).substring(0, 4)}
                      </span>
                    )}
                    {heroMovie.vote_average > 0 && (
                      <div className="flex items-center gap-1 text-[15px] font-bold text-yellow-400 border-l border-white/20 pl-4">
                        <Award size={16} fill="currentColor" />
                        <span>{Number(heroMovie.vote_average).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {/* Synopsis */}
                  <AnimatePresence>
                    {(!trailerActive || trailerEnded) && heroMovie.overview && (
                      <motion.p
                        key="synopsis"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                        className="text-sm sm:text-base text-white/85 line-clamp-3 mb-7 max-w-xl font-medium leading-relaxed drop-shadow-md"
                      >
                        {heroMovie.overview}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* CTA Buttons */}
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <Link
                      to={`/watch/${heroMovie.id}?type=${getSafeType(heroMovie)}`}
                      className="btn-primary text-sm sm:text-base hover:scale-105"
                    >
                      <Play size={20} fill="#000" className="mr-1.5" /> Play
                    </Link>
                    <button
                      title="Add to Watchlist"
                      className="btn-secondary"
                    >
                      <Plus size={22} />
                    </button>
                    <button
                      onClick={handleShare}
                      title="Share"
                      className={`btn-secondary transition-all ${copied ? '!bg-green-500/30 !border-green-500' : ''}`}
                    >
                      {copied 
                        ? <Check size={22} className="text-green-400 -ml-0.5" />
                        : <Share2 size={22} className="-ml-0.5" />
                      }
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Slider nav: arrows + dots */}
          <div className="absolute bottom-[88px] sm:bottom-[100px] left-0 right-0 z-20 pointer-events-none">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between relative">

              {/* Empty placeholder to keep flex distribution intact on the left */}
              <div className="w-10 hidden sm:block" />

              {/* Dot indicators */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
                {heroMovies.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i, i > heroIndex ? 1 : -1)}
                    aria-label={`Go to slide ${i + 1}`}
                    className="group relative h-[4px] rounded-full overflow-hidden transition-all duration-300 shadow-sm pointer-events-auto"
                    style={{ width: i === heroIndex ? 36 : 14 }}
                  >
                    <span className="absolute inset-0 bg-white/25 rounded-full" />
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

              {/* Right side controls */}
              <div className="flex items-center gap-2 pointer-events-auto">
                {/* Mute toggle */}
                {trailerKey && trailerActive && !trailerEnded && (
                  <button
                    onClick={toggleMute}
                    aria-label={trailerMuted ? 'Unmute trailer' : 'Mute trailer'}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/15 transition-all"
                  >
                    {trailerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                )}

                {/* Replay */}
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
                  aria-label="Previous slide"
                  className="w-9 h-9 flex-shrink-0 rounded-full bg-black/40 backdrop-blur border border-white/12 text-white flex items-center justify-center hover:bg-white/15 hover:border-white/30 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Next */}
                <button
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className="w-9 h-9 flex-shrink-0 rounded-full bg-black/40 backdrop-blur border border-white/12 text-white flex items-center justify-center hover:bg-white/15 hover:border-white/30 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Content Swimlanes ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 -mt-16 relative z-20 space-y-14">

        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <RecentlyWatched history={history} onRefresh={loadHistory} />
        </div>

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

        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow
            title="Critically Acclaimed"
            badge="Top Rated"
            movies={topRated}
            loading={loadingTopRated}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <CarouselRow
            title="Binge-Worthy TV Shows"
            badge="Series"
            movies={trendingTV}
            loading={loadingTrendingTV}
            usePoster
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.7s' }}>
          <PrimeCarouselRow
            title="Fresh Drops"
            badge="New This Month"
            movies={newReleases}
            loading={loadingNew}
          />
        </div>

        {becauseYouWatched.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.75s' }}>
            <CarouselRow
              title={`Because You Watched "${becauseTitle}"`}
              movies={becauseYouWatched}
              usePoster
            />
          </div>
        )}

        {/* Browse by Genre */}
        <div className="animate-fade-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Browse by Genre
            </h2>
          </div>
          {/* Horizontally scrollable genre pills */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g)}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
                  selectedGenre.id === g.id
                    ? 'text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border-transparent scale-105'
                    : 'text-prime-subtext bg-[#1A242F]/50 backdrop-blur-md border border-white/10 hover:border-white/30 hover:text-white hover:bg-[#1A242F]/80'
                }`}
              >
                {selectedGenre.id === g.id && (
                  <span className="absolute inset-0 bg-gradient-to-r from-prime-blue to-blue-500 opacity-90" />
                )}
                <span className="relative z-10">{g.label}</span>
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={genreMovies}
            loading={loadingGenre}
          />
        </div>

        {/* Mood Collections */}
        <div className="mb-24 animate-fade-up" style={{ animationDelay: '0.85s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              What's Your Mood?
            </h2>
          </div>
          {/* Horizontally scrollable mood pills */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMood(m)}
                className={`relative flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
                  selectedMood.key === m.key
                    ? 'text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border-transparent scale-105'
                    : 'text-prime-subtext bg-[#1A242F]/50 backdrop-blur-md border border-white/10 hover:border-white/30 hover:text-white hover:bg-[#1A242F]/80'
                }`}
              >
                {selectedMood.key === m.key && (
                  <span className="absolute inset-0 bg-gradient-to-r from-prime-blue to-blue-500 opacity-90" />
                )}
                <span className="relative z-10 text-base">{m.emoji}</span>
                <span className="relative z-10">{m.label}</span>
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={moodMovies}
            loading={loadingMood}
          />
        </div>

        {/* ── Bottom ambient glow ── */}
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(0,180,255,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

    </motion.div>
  );
}