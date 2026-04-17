import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

// ── Local SVG placeholder — no third party dependency ────────────────────
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='342' height='513' viewBox='0 0 342 513'%3E%3Crect width='342' height='513' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

// ── Safe media type detection ─────────────────────────────────────────────
function getMediaType(movie) {
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.type === 'movie') return 'movie';
  // Fallback — TV shows have name, movies have title
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

// ── Ranked badge ──────────────────────────────────────────────────────────
function RankBadge({ rank }) {
  return (
    <div
      className="absolute -left-5 bottom-0 z-20 select-none pointer-events-none"
      aria-hidden="true"
    >
      <span
        className="font-black leading-none"
        style={{
          fontSize: 'clamp(48px, 9vw, 88px)', // ← lowered min from 60px to 48px
          lineHeight: 1,
          WebkitTextStroke: '2px rgba(255,255,255,0.15)',
          color: 'transparent',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
        }}
      >
        {rank}
      </span>
    </div>
  );
}

// ── Individual card ───────────────────────────────────────────────────────
function CarouselCard({ movie, rank, usePoster = false }) {
  const [imgError, setImgError] = useState(false);

  // ── Safe ID and type extraction ───────────────────────────────────────
  const id = movie.tmdbId || movie.id;
  const mediaType = getMediaType(movie);
  const watchLink = `/watch/${id}?type=${mediaType}`;
  const title = movie.title || movie.name || 'Unknown Title';
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const rating = movie.vote_average
    ? Number(movie.vote_average).toFixed(1)
    : null;

  // ── Safe image source ─────────────────────────────────────────────────
  const imgSrc = imgError
    ? PLACEHOLDER_SVG
    : usePoster
      ? (movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : PLACEHOLDER_SVG)
      : (movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : PLACEHOLDER_SVG);

  // ── Safe key — fallback to index if both ids missing ─────────────────
  const cardKey = id ?? `card-${title}`;

  return (
    <div
      className={`carousel-card group relative flex-shrink-0 ${
        usePoster ? 'w-36 sm:w-44 md:w-48' : 'w-60 sm:w-72 md:w-80'
      } ${rank ? 'ml-6 sm:ml-8' : ''}`}
    >
      <Link to={watchLink} className="block relative cursor-pointer group">
        
        <div className="relative">
          {rank && <RankBadge rank={rank} />}
          <div className={`relative overflow-hidden rounded-lg shadow-lg shadow-black/20 ${usePoster ? 'aspect-[2/3]' : 'aspect-video'}`}>
            {/* Image */}
            <img
              src={imgSrc}
              alt={title}
              loading="lazy"
              width={usePoster ? 342 : 780}
              height={usePoster ? 513 : 439}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />

            {/* Dark vignette removed as we use labels below now, keep light overlay on hover */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />

            {/* Simple play icon on top right instead of full bottom layout */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-prime-blue text-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                <Play size={12} fill="currentColor" />
              </div>
            </div>

            {/* Blue glow border on hover */}
            <div className="absolute inset-0 rounded-lg ring-0 ring-prime-blue/60 group-hover:ring-2 transition-all duration-300 pointer-events-none" />
          </div>
        </div>

        {/* Labels below the poster */}
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
            <span className="capitalize">{mediaType === 'tv' ? 'TV Show' : mediaType}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────
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

// ── Main carousel ─────────────────────────────────────────────────────────
export default function CarouselRow({
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
  const throttleRef = useRef(null); // ← for scroll throttle

  // ── Throttled scroll checker — prevents jank on slow devices ─────────
  const checkScroll = useCallback(() => {
    if (throttleRef.current) return; // already scheduled

    throttleRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (el) {
        setCanScrollLeft(el.scrollLeft > 8);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
      }
      throttleRef.current = null;
    }, 80); // ← check at most every 80ms
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', checkScroll);
      // Clear any pending throttle on unmount
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [checkScroll, movies]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  // ── Empty state ───────────────────────────────────────────────────────
  if (!loading && movies.length === 0) return null;

  return (
    <section className="relative">
      {/* Row header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
          {title}
        </h2>
        {badge && (
          <span className="text-prime-blue text-xs font-bold px-2 py-0.5 bg-prime-blue/10 border border-prime-blue/20 rounded">
            {badge}
          </span>
        )}
        {/* View all — hidden for now, not functional yet */}
        {/* Removed the fake clickable "View all ›" that did nothing */}
      </div>

      {/* Scroll container */}
      <div className="relative group/row">

        {/* Left arrow — visible on hover (desktop) and always on touch ── */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#080E14]/90 backdrop-blur border border-white/12 text-white flex items-center justify-center shadow-xl hover:bg-prime-blue hover:border-prime-blue transition-all duration-200
              opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100"
            // ↑ Always visible on mobile, hover-only on desktop
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {loading ? (
          <CarouselSkeleton usePoster={usePoster} />
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {movies.map((movie, idx) => (
              <CarouselCard
                key={movie._id || movie.id || `movie-${idx}`} // ← safe fallback key
                movie={movie}
                rank={ranked ? idx + 1 : null}
                usePoster={usePoster}
              />
            ))}
          </div>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#080E14]/90 backdrop-blur border border-white/12 text-white flex items-center justify-center shadow-xl hover:bg-prime-blue hover:border-prime-blue transition-all duration-200
              opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100"
            // ↑ Always visible on mobile, hover-only on desktop
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-[#080E14] to-transparent pointer-events-none z-20" />
        )}

        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-[#080E14] to-transparent pointer-events-none z-20" />
        )}
      </div>
    </section>
  );
}