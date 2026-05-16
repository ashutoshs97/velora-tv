import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Share2, Award,
  Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight, Check,
} from 'lucide-react';
import { fetchMovieDetail } from '../api';
import WatchlistButton from './WatchlistButton';
import { useSettings } from '../contexts/SettingsContext';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

function getSafeType(movie) {
  if (!movie) return 'movie';
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

function sendYouTubeCommand(iframeRef, command, args = []) {
  try {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args }),
      '*'
    );
  } catch { /* cross-origin or iframe not ready */ }
}

function applyTrailerMuteState(iframeRef, muted) {
  if (muted) {
    sendYouTubeCommand(iframeRef, 'mute');
  } else {
    sendYouTubeCommand(iframeRef, 'setVolume', [100]);
    sendYouTubeCommand(iframeRef, 'unMute');
  }
}

export default function HeroBanner({ heroMovies }) {
  const { heroAutoplay, trailerAutoplay } = useSettings();

  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);
  const [heroImgError, setHeroImgError] = useState(false);
  const autoAdvanceRef = useRef(null);

  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerActive, setTrailerActive] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const [trailerReady, setTrailerReady] = useState(false);
  const trailerTimerRef = useRef(null);
  const replayTimerRef = useRef(null);
  const trailerIframeRef = useRef(null);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [copied, setCopied] = useState(false);

  const heroMovie = useMemo(
    () => heroMovies[heroIndex] || null,
    [heroMovies, heroIndex]
  );

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'onReady' || data.info?.playerState !== undefined) {
          setTrailerReady(true);
        }
        if (data.info?.playerState === 0) {
          setTrailerEnded(true);
        }
      } catch { /* not a YouTube message */ }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!trailerActive || !trailerReady) return;
    applyTrailerMuteState(trailerIframeRef, trailerMuted);
  }, [trailerMuted, trailerActive, trailerReady]);

  const handleShare = useCallback(() => {
    if (!heroMovie) return;
    const url = `${window.location.origin}/watch/${heroMovie.id}?type=${getSafeType(heroMovie)}`;
    const textToShare = `Check out "${heroMovie.title || heroMovie.name}" on Velora!\n\n${url}`;
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
      } catch { /* silent */ }
    };
    if (navigator.share) {
      navigator.share({ title: heroMovie.title || heroMovie.name || 'Velora', text: 'Check out this on Velora!', url }).catch(() => {});
    } else if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToShare).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }).catch(copyFallback);
    } else {
      copyFallback();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [heroMovie]);

  const goToSlide = useCallback((idx, dir = 1) => {
    setHeroDirection(dir);
    setHeroIndex(idx);
    setHeroImgError(false);
  }, []);

  const nextSlide = useCallback(() => {
    if (!heroMovies.length) return;
    goToSlide((heroIndex + 1) % heroMovies.length, 1);
  }, [heroIndex, heroMovies.length, goToSlide]);

  const prevSlide = useCallback(() => {
    if (!heroMovies.length) return;
    goToSlide((heroIndex - 1 + heroMovies.length) % heroMovies.length, -1);
  }, [heroIndex, heroMovies.length, goToSlide]);

  useEffect(() => {
    if (!heroAutoplay || (trailerActive && !trailerEnded)) {
      clearInterval(autoAdvanceRef.current);
      return;
    }
    autoAdvanceRef.current = setInterval(nextSlide, 10000);
    return () => clearInterval(autoAdvanceRef.current);
  }, [nextSlide, trailerActive, trailerEnded, heroAutoplay]);

  // Preload the background image for the next slide to ensure smooth transitions
  useEffect(() => {
    if (!heroMovies.length) return;
    const nextIdx = (heroIndex + 1) % heroMovies.length;
    const nextMovie = heroMovies[nextIdx];
    if (nextMovie?.backdrop_path) {
      const img = new Image();
      img.src = `${BACKDROP_BASE}${nextMovie.backdrop_path}`;
    }
  }, [heroIndex, heroMovies]);

  useEffect(() => {
    setTrailerKey(null);
    setTrailerActive(false);
    setTrailerEnded(false);
    setTrailerMuted(true);
    setTrailerReady(false);
    clearTimeout(trailerTimerRef.current);
    if (!heroMovie?.id) return;
    let cancelled = false;
    
    // Debounce the fetch to prevent API spam when user rapidly clicks through slides
    const fetchTimer = setTimeout(() => {
      fetchMovieDetail(heroMovie.id)
        .then(res => {
          if (cancelled) return;
          const videos = res.data?.videos?.results || [];
          const trailer = videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videos.find(v => v.site === 'YouTube');
          if (trailer?.key && typeof trailer.key === 'string' && trailer.key.trim()) {
            setTrailerKey(trailer.key.trim());
            if (trailerAutoplay) {
              // Wait 5 seconds after fetching before showing the trailer
              trailerTimerRef.current = setTimeout(() => {
                if (!cancelled) setTrailerActive(true);
              }, 5000);
            }
          }
        })
        .catch(() => {});
    }, 800);

    return () => { 
      cancelled = true; 
      clearTimeout(fetchTimer);
      clearTimeout(trailerTimerRef.current); 
    };
  }, [heroMovie, trailerAutoplay]);

  const replayTrailer = useCallback(() => {
    clearTimeout(replayTimerRef.current);
    setTrailerEnded(false);
    setTrailerActive(false);
    setTrailerReady(false);
    replayTimerRef.current = setTimeout(() => setTrailerActive(true), 100);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(replayTimerRef.current);
      clearTimeout(trailerTimerRef.current);
      clearInterval(autoAdvanceRef.current);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setTrailerMuted((muted) => {
      const nextMuted = !muted;
      applyTrailerMuteState(trailerIframeRef, nextMuted);
      return nextMuted;
    });
  }, []);

  if (!heroMovies.length || !heroMovie) return null;

  return (
    <section
      className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[600px] overflow-hidden -mt-20 pt-4"
      style={{ clipPath: 'inset(0)' }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
      }}
    >
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
                alt={heroMovie.title || heroMovie.name || 'Featured'}
                className="w-full h-full object-cover object-top opacity-80 scale-[1.05] sm:scale-[1.08]"
                style={{ objectPosition: '50% 15%' }}
                onError={() => setHeroImgError(true)}
                fetchpriority="high"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-prime-surface to-black" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
              style={{ border: 'none', pointerEvents: 'none' }}
              title="Hero Trailer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 bg-hero-gradient-x opacity-90 z-[1] pointer-events-none" />
      <div className="absolute inset-0 bg-hero-gradient-y z-[1] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#080E14]/90 to-transparent pointer-events-none z-[1]" />

      <div className="relative z-10 w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[600px] flex flex-col justify-end pt-28 pb-32 sm:pb-28">
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
              className="w-full md:w-3/4 lg:w-[58%] min-w-0"
            >
              <h1 className="max-w-[min(100%,40rem)] whitespace-normal break-words text-balance text-[clamp(1.65rem,3.2vw,2.55rem)] font-black text-white mb-4 leading-[1.12] drop-shadow-2xl line-clamp-3 font-display pb-2">
                {heroMovie.title || heroMovie.name || 'Untitled'}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
                {(heroMovie.release_date || heroMovie.first_air_date) && (
                  <span className="text-[15px] font-bold text-prime-subtext">
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

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <Link
                  to={`/watch/${heroMovie.id}?type=${getSafeType(heroMovie)}`}
                  className="btn-primary text-sm sm:text-base hover:scale-105"
                >
                  <Play size={20} fill="#000" className="mr-1.5" /> Play
                </Link>
                <WatchlistButton movie={heroMovie} type={getSafeType(heroMovie)} className="btn-secondary" size={22} />
                <button
                  onClick={handleShare}
                  title="Share"
                  className={`btn-secondary transition-all ${copied ? '!bg-green-500/30 !border-green-500' : ''}`}
                >
                  {copied ? <Check size={22} className="text-green-400 -ml-0.5" /> : <Share2 size={22} className="-ml-0.5" />}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-24 sm:bottom-[100px] left-0 right-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative flex items-center justify-between">
          <div className="hidden sm:block w-10" />

          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
            {heroMovies.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i, i > heroIndex ? 1 : -1)}
                aria-label={`Slide ${i + 1}`}
                className="group relative h-[4px] rounded-full overflow-hidden transition-all duration-300"
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

          <div className="hidden sm:flex ml-auto items-center gap-2 relative z-30">
            {trailerKey && trailerActive && !trailerEnded && (
              <button
                onClick={toggleMute}
                aria-label={trailerMuted ? 'Unmute' : 'Mute'}
                className="h-10 w-10 flex-shrink-0 rounded-xl bg-gradient-to-tl from-black/28 via-black/12 to-transparent text-white shadow-[0_5px_14px_rgba(0,0,0,0.12)] backdrop-blur-[1px] flex items-center justify-center hover:from-white/12 hover:via-white/6 hover:to-transparent transition-all"
              >
                {trailerMuted ? <VolumeX size={18} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" /> : <Volume2 size={18} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />}
              </button>
            )}
            {trailerKey && trailerEnded && (
              <button
                onClick={replayTrailer}
                className="h-10 px-4 flex-shrink-0 rounded-xl bg-gradient-to-tl from-black/28 via-black/12 to-transparent text-white shadow-[0_5px_14px_rgba(0,0,0,0.12)] backdrop-blur-[1px] flex items-center gap-1.5 text-xs font-semibold justify-center hover:from-white/12 hover:via-white/6 hover:to-transparent transition-all"
              >
                <RotateCcw size={16} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" /> Replay
              </button>
            )}
            <button onClick={prevSlide} aria-label="Previous" className="h-10 w-8 flex-shrink-0 rounded-xl bg-gradient-to-r from-black/28 via-black/12 to-transparent text-white shadow-[5px_0_14px_rgba(0,0,0,0.12)] backdrop-blur-[1px] flex items-center justify-center hover:from-white/12 hover:via-white/6 hover:to-transparent transition-all">
              <ChevronLeft size={20} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </button>
            <button onClick={nextSlide} aria-label="Next" className="h-10 w-8 flex-shrink-0 rounded-xl bg-gradient-to-l from-black/28 via-black/12 to-transparent text-white shadow-[-5px_0_14px_rgba(0,0,0,0.12)] backdrop-blur-[1px] flex items-center justify-center hover:from-white/12 hover:via-white/6 hover:to-transparent transition-all">
              <ChevronRight size={20} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
