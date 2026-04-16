import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PLACEHOLDER = 'https://via.placeholder.com/342x513/1A242F/8197A4?text=Velora';

// ── Ranked badge SVG numbers using a compressed gradient font ─────────────
function RankBadge({ rank }) {
  return (
    <div
      className="absolute -left-5 bottom-0 z-20 select-none pointer-events-none"
      aria-hidden="true"
    >
      <span
        className="font-black leading-none"
        style={{
          fontSize: 'clamp(60px, 9vw, 88px)',
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
  const id = movie.tmdbId || movie.id;
  const isTv = movie.media_type === 'tv' || movie.type === 'tv' || (!movie.title && movie.name);
  const watchLink = `/watch/${id}${isTv ? '?type=tv' : '?type=movie'}`;
  const title = movie.title || movie.name;
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;

  const imgSrc = usePoster
    ? (movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : PLACEHOLDER)
    : (movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : PLACEHOLDER);

  return (
    <div
      className={`carousel-card group relative flex-shrink-0 ${
        usePoster ? 'w-36 sm:w-44 md:w-48' : 'w-60 sm:w-72 md:w-80'
      } ${rank ? 'ml-8 sm:ml-10' : ''}`}
    >
      {/* Ranked badge behind card */}
      {rank && <RankBadge rank={rank} />}

      <Link to={watchLink} className="block relative rounded-lg overflow-hidden cursor-pointer">
        {/* Image */}
        <div className={`relative overflow-hidden rounded-lg ${usePoster ? 'aspect-[2/3]' : 'aspect-video'}`}>
          <img
            src={imgSrc}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />

          {/* Dark vignette always on */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          {/* Rating chip top-right */}
          {rating && (
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[11px] font-bold text-yellow-400">
              <Star size={10} fill="currentColor" />
              {rating}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-prime-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

          {/* Play button — slides up from bottom on hover */}
          <div className="absolute inset-0 flex flex-col justify-end p-3 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-2 mb-1">
              <div className="bg-white text-black rounded-full p-1.5 shadow-lg shadow-black/40 flex-shrink-0">
                <Play size={14} fill="#000" />
              </div>
              <span className="text-white text-xs font-bold tracking-wide drop-shadow truncate">{title}</span>
            </div>
            {year && (
              <span className="text-white/60 text-[10px] font-medium ml-8">{year}</span>
            )}
          </div>

          {/* Prime-blue glow border on hover */}
          <div className="absolute inset-0 rounded-lg ring-0 ring-prime-blue/60 group-hover:ring-2 transition-all duration-300 pointer-events-none" />
        </div>
      </Link>
    </div>
  );
}

// ── Skeleton cards ────────────────────────────────────────────────────────
function CarouselSkeleton({ usePoster, count = 8 }) {
  return (
    <div className="flex gap-3 sm:gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex-shrink-0 rounded-lg skeleton ${
            usePoster ? 'w-36 sm:w-44 md:w-48 aspect-[2/3]' : 'w-60 sm:w-72 md:w-80 aspect-video'
          }`}
        />
      ))}
    </div>
  );
}

// ── Main carousel row ─────────────────────────────────────────────────────
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

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll, movies]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section className="relative">
      {/* Row header */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h2>
        {badge && (
          <span className="text-prime-blue text-xs font-bold px-2 py-0.5 bg-prime-blue/10 border border-prime-blue/20 rounded">
            {badge}
          </span>
        )}
        <span className="text-prime-subtext text-sm ml-auto font-semibold hover:text-white cursor-pointer transition-colors hidden sm:block">
          View all ›
        </span>
      </div>

      {/* Scroll container */}
      <div className="relative group/row">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-30 w-10 h-10 rounded-full bg-black/80 backdrop-blur border border-white/15 text-white flex items-center justify-center shadow-xl hover:bg-prime-blue/80 hover:border-prime-blue transition-all duration-200 opacity-0 group-hover/row:opacity-100"
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
                key={movie._id || movie.id}
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
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-30 w-10 h-10 rounded-full bg-black/80 backdrop-blur border border-white/15 text-white flex items-center justify-center shadow-xl hover:bg-prime-blue/80 hover:border-prime-blue transition-all duration-200 opacity-0 group-hover/row:opacity-100"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Left fade gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-prime-bg to-transparent pointer-events-none z-20" />
        )}
        {/* Right fade gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-prime-bg to-transparent pointer-events-none z-20" />
        )}
      </div>
    </section>
  );
}
