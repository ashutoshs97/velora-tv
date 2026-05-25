import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Share2,
  ChevronLeft, ChevronRight, Check, Film, X
} from 'lucide-react';
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

export default function HeroBanner({ heroMovies }) {
  const { heroAutoplay } = useSettings();

  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);
  const [heroImgError, setHeroImgError] = useState(false);
  const autoAdvanceRef = useRef(null);
  
  const heroRef = useRef(null);
  const isHovering = useRef(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [copied, setCopied] = useState(false);

  const heroMovie = useMemo(
    () => heroMovies[heroIndex] || null,
    [heroMovies, heroIndex]
  );

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

  const handleMouseMove = useCallback((e) => {
    if (!heroRef.current) return;
    const { left, top, width, height } = heroRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    heroRef.current.style.setProperty('--mouse-x', `${x}px`);
    heroRef.current.style.setProperty('--mouse-y', `${y}px`);
    
    // Calculate subtle 3D tilt (max 4 degrees)
    const tiltX = ((y / height) - 0.5) * -8; 
    const tiltY = ((x / width) - 0.5) * 8;
    heroRef.current.style.setProperty('--tilt-x', `${tiltX}deg`);
    heroRef.current.style.setProperty('--tilt-y', `${tiltY}deg`);

    if (!isHovering.current) {
      isHovering.current = true;
      heroRef.current.style.setProperty('--spotlight-opacity', '1');
      heroRef.current.style.setProperty('--transition-speed', '0s');
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!heroRef.current) return;
    isHovering.current = false;
    heroRef.current.style.setProperty('--transition-speed', '1.2s');
    heroRef.current.style.setProperty('--tilt-x', '0deg');
    heroRef.current.style.setProperty('--tilt-y', '0deg');
    heroRef.current.style.setProperty('--spotlight-opacity', '0');
  }, []);

  useEffect(() => {
    if (!heroAutoplay) {
      clearInterval(autoAdvanceRef.current);
      return;
    }
    autoAdvanceRef.current = setInterval(nextSlide, 8000);
    return () => clearInterval(autoAdvanceRef.current);
  }, [nextSlide, heroAutoplay]);

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
    return () => {
      clearInterval(autoAdvanceRef.current);
    };
  }, []);

  if (!heroMovies.length || !heroMovie) return null;

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[600px] overflow-hidden -mt-20 pt-4"
      style={{ 
        clipPath: 'inset(0)',
        '--mouse-x': '50%',
        '--mouse-y': '50%',
        '--tilt-x': '0deg',
        '--tilt-y': '0deg',
        '--spotlight-opacity': '0',
        '--transition-speed': '1.2s',
        perspective: '1200px'
      }}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); }
      }}
    >
      <AnimatePresence initial={false} custom={heroDirection}>
        <motion.div
          key={`bg-${heroIndex}`}
          custom={heroDirection}
          variants={{
            enter: (d) => ({ x: d > 0 ? '3%' : '-3%', opacity: 0 }),
            center: { x: 0, opacity: 1 },
            exit: { opacity: 0 },
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
          className="absolute inset-0 w-full h-full"
          style={{
            transform: 'rotateX(var(--tilt-x)) rotateY(var(--tilt-y)) scale(1.05)',
            transformOrigin: 'center center',
            transition: 'transform var(--transition-speed) cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            willChange: 'transform'
          }}
        >
          {!heroImgError ? (
            <>
              {/* Base Layer: Moody, slightly out-of-focus background */}
              <img
                src={`${BACKDROP_BASE}${heroMovie.backdrop_path}`}
                alt=""
                className="w-full h-full object-cover object-top opacity-50 blur-[3px] scale-[1.02]"
                style={{ objectPosition: '50% 15%' }}
                onError={() => setHeroImgError(true)}
                fetchpriority="high"
                decoding="async"
              />
              
              {/* Spotlight Layer: Crystal clear, vibrant, revealed by dynamic CSS mask */}
              <div 
                className="absolute inset-0 w-full h-full"
                style={{
                  opacity: 'var(--spotlight-opacity)',
                  transition: 'opacity var(--transition-speed) ease-in-out',
                  maskImage: 'radial-gradient(circle 450px at var(--mouse-x) var(--mouse-y), black 15%, transparent 85%)',
                  WebkitMaskImage: 'radial-gradient(circle 450px at var(--mouse-x) var(--mouse-y), black 15%, transparent 85%)',
                }}
              >
                <img
                  src={`${BACKDROP_BASE}${heroMovie.backdrop_path}`}
                  alt={heroMovie.title || heroMovie.name || 'Featured'}
                  className="w-full h-full object-cover object-top scale-[1.02] brightness-110 contrast-[1.05] saturate-[1.1]"
                  style={{ objectPosition: '50% 15%' }}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-prime-surface to-black" />
          )}
        </motion.div>
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
                enter: (d) => ({ opacity: 0, x: d > 0 ? 20 : -20 }),
                center: { opacity: 1, x: 0 },
                exit: { opacity: 0, transition: { duration: 0.15 } }
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
              className="w-full md:w-[85%] lg:w-[75%] xl:w-[70%] min-w-0"
            >
              <div className="h-[90px] sm:h-[110px] flex flex-col justify-end mb-3 sm:mb-4">
                <motion.h1 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
                  className="w-full whitespace-normal break-words text-[clamp(1.75rem,3.5vw,2.75rem)] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 leading-[1.1] pb-2 drop-shadow-sm font-display tracking-tight line-clamp-2"
                >
                  {heroMovie.title || heroMovie.name || 'Untitled'}
                </motion.h1>
              </div>

              <div className="h-[40px] flex flex-col justify-start mb-4">
                {((heroMovie.release_date || heroMovie.first_air_date) || heroMovie.vote_average > 0) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
                    className="inline-flex items-center gap-3 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-xl self-start"
                  >
                    {(heroMovie.release_date || heroMovie.first_air_date) && (
                      <span className="text-[13px] font-bold text-white/90 tracking-widest uppercase">
                        {(heroMovie.release_date || heroMovie.first_air_date).substring(0, 4)}
                      </span>
                    )}
                    
                    {heroMovie.vote_average > 0 && (
                      <>
                        <div className="w-[4px] h-[4px] rounded-full bg-white/30" />
                        <div className="flex items-center gap-1.5 text-[14px] font-bold text-white">
                          <span className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-[#0d253f] text-[9px] font-black px-1.5 py-0.5 rounded-sm tracking-widest uppercase shadow-sm">
                            TMDB
                          </span>
                          <span>{Number(heroMovie.vote_average).toFixed(1)}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="h-[75px] sm:h-[85px] flex flex-col justify-start mb-6">
                {heroMovie.overview && (
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
                    className="text-[14px] sm:text-[15px] text-white/80 max-w-2xl font-medium leading-relaxed drop-shadow-md border-l-[3px] border-white/20 pl-4 sm:pl-5 line-clamp-3"
                  >
                    {heroMovie.overview}
                  </motion.p>
                )}
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="flex items-center gap-3 sm:gap-4 flex-wrap"
              >
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
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-24 sm:bottom-[100px] left-0 right-0 z-30 pointer-events-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative flex items-center justify-between">
          <div className="hidden sm:block w-10" />

          <div className="hidden sm:flex ml-auto items-center gap-2 relative z-30 pointer-events-auto">
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
