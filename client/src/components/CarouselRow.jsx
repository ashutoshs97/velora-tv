import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import FocusableLink from './FocusableLink';
import { getTmdbImage } from '../utils/tmdbImages';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='342' height='513' viewBox='0 0 342 513'%3E%3Crect width='342' height='513' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

function getMediaType(movie) {
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.type === 'movie') return 'movie';
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

function RankBadge({ rank }) {
  return (
    <div
      className="absolute -left-5 sm:-left-7 bottom-[-5px] z-20 select-none pointer-events-none"
      aria-hidden="true"
    >
      <span
        className="font-black tracking-tighter leading-none"
        style={{
          fontSize: 'clamp(72px, 11vw, 120px)',
          lineHeight: 0.85,
          color: '#000000', // Black fill
          WebkitTextStroke: '1px rgba(255, 255, 255, 0.7)', // Reduced light border
          filter: 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.08))', // Barely there light shadow
        }}
      >
        {rank}
      </span>
    </div>
  );
}

function CarouselCard({ movie, rank, usePoster = false }) {
  const [imgError, setImgError] = useState(false);
  const { ratingSystem } = useSettings();

  const id = movie.tmdbId || movie.id;
  const mediaType = getMediaType(movie);
  const watchLink = id ? `/watch/${id}?type=${mediaType}` : '/';
  const title = movie.title || movie.name || 'Unknown Title';
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const rawRating = movie.vote_average ? Number(movie.vote_average) : null;

  const formatRating = (r) => {
    if (!r) return null;
    if (ratingSystem === 'percent') return `${Math.round(r * 10)}%`;
    if (ratingSystem === 'stars') return '★'.repeat(Math.round(r / 2));
    return r.toFixed(1);
  };
  const rating = formatRating(rawRating);

  const tmdbImg = usePoster 
    ? getTmdbImage(movie.poster_path, 'poster', 'w185')
    : getTmdbImage(movie.backdrop_path, 'backdrop', 'w500');

  const hasImage = usePoster ? !!movie.poster_path : !!movie.backdrop_path;

  const imgSrc = imgError || !hasImage
    ? PLACEHOLDER_SVG
    : tmdbImg.src;

  const imgSrcSet = imgError || !hasImage
    ? undefined
    : tmdbImg.srcSet;
    
  const sizes = usePoster 
    ? "(max-width: 640px) 144px, (max-width: 768px) 176px, 192px" 
    : "(max-width: 640px) 240px, (max-width: 768px) 288px, 320px";

  return (
    <div className={`carousel-card relative flex-shrink-0 transition-all duration-300 hover:z-50 ${
      usePoster ? 'w-36 sm:w-44 md:w-48' : 'w-60 sm:w-72 md:w-80'
    } ${rank ? 'ml-6 sm:ml-8' : ''}`}>
      <Link to={watchLink} className="block relative cursor-pointer group rounded-2xl focus:outline-none transition-all duration-500 hover:-translate-y-2">
        <div className="relative">
          {rank && <RankBadge rank={rank} />}
          <div className={`relative overflow-hidden rounded-2xl bg-[#0F1923] transition-all duration-500 ${
            usePoster ? 'aspect-[2/3]' : 'aspect-video'
          }`}>
            <img
              src={imgSrc}
              srcSet={imgSrcSet}
              sizes={sizes}
              alt={title}
              loading="lazy"
              decoding="async"
              width={usePoster ? 185 : 500}
              height={usePoster ? 278 : 281}
              className="w-full h-full object-cover transition-transform duration-700 ease-out"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f16] via-[#0a0f16]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <div className="bg-prime-blue text-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                <Play size={12} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>

        {!rank && (
          <div className="mt-2.5 px-0.5">
            <h3 className="text-white text-[13px] sm:text-sm font-bold truncate group-hover:text-prime-blue transition-colors duration-200">
              {title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-prime-subtext font-medium truncate">
              {rating && (
                <>
                  <span className="flex items-center gap-0.5 text-prime-blue font-bold">
                    <Star size={10} fill="currentColor" /> {rating}
                  </span>
                  <span className="text-white/20">·</span>
                </>
              )}
              {year && (
                <>
                  <span>{year}</span>
                  <span className="text-white/20">·</span>
                </>
              )}
              <span className="capitalize">{mediaType === 'tv' ? 'TV Show' : 'Movie'}</span>
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}

function CarouselSkeleton({ usePoster, count = 8 }) {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex-shrink-0 ${
            usePoster ? 'w-36 sm:w-44 md:w-48' : 'w-60 sm:w-72 md:w-80'
          }`}
        >
          <div className={`rounded-lg skeleton ${usePoster ? 'aspect-[2/3]' : 'aspect-video'}`} />
          <div className="mt-3 space-y-2 px-0.5">
            <div className="h-3.5 skeleton rounded w-3/4" />
            <div className="h-2.5 skeleton rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

const CarouselRow = memo(function CarouselRow({
  title,
  badge,
  movies = [],
  loading = false,
  ranked = false,
  usePoster = false,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, movies]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    
    const firstCard = el.children[0];
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth;
      const gap = parseInt(window.getComputedStyle(el).gap) || 0;
      const visibleItems = Math.floor(el.clientWidth / (cardWidth + gap));
      const itemsToScroll = Math.max(1, Math.min(visibleItems, 4));
      const amount = (cardWidth + gap) * itemsToScroll;

      const currentScroll = el.scrollLeft;
      const maxScroll = el.scrollWidth - el.clientWidth;
      let target = currentScroll + (dir === 'right' ? 1 : -1) * amount;

      // Snapping tolerance bounds
      const snapTolerance = (cardWidth + gap) * 1.5;

      if (dir === 'right') {
        if (maxScroll - target < snapTolerance) {
          target = maxScroll;
        }
      } else if (dir === 'left') {
        if (target < snapTolerance) {
          target = 0;
        }
      }

      el.scrollTo({ left: target, behavior: 'smooth' });
    } else {
      // Fallback
      const amount = el.clientWidth * 0.75;
      el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  }, []);

  if (!loading && movies.length === 0) return null;

  return (
    <section className="relative">
      <div className="flex items-center mb-5 px-1">
        <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 flex items-center">
          {title}
        </h2>
      </div>

      <div className="relative group/row">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              type="button"
              onClick={() => scroll('left')}
              title="Scroll left"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 0.75, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="hidden md:flex absolute -left-10 lg:-left-12 top-0 bottom-4 w-10 z-30 cursor-pointer items-center justify-center bg-transparent text-white border-0 shadow-none backdrop-blur-none transition-all duration-300 hover:scale-125 hover:opacity-100 select-none outline-none active:outline-none focus:outline-none focus-visible:outline-none"
            >
              <ChevronLeft size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </motion.button>
          )}
        </AnimatePresence>

        {loading ? (
          <CarouselSkeleton usePoster={usePoster} />
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pt-6 -mt-6 pb-6 -mb-2 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {movies.map((movie, idx) => (
              <CarouselCard
                key={movie._id || movie.id || `movie-${idx}`}
                movie={movie}
                rank={ranked ? idx + 1 : null}
                usePoster={usePoster}
              />
            ))}
          </div>
        )}

        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              type="button"
              onClick={() => scroll('right')}
              title="Scroll right"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 0.75, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className="hidden md:flex absolute -right-10 lg:-right-12 top-0 bottom-4 w-10 z-30 cursor-pointer items-center justify-center bg-transparent text-white border-0 shadow-none backdrop-blur-none transition-all duration-300 hover:scale-125 hover:opacity-100 select-none outline-none active:outline-none focus:outline-none focus-visible:outline-none"
            >
              <ChevronRight size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

export default CarouselRow;