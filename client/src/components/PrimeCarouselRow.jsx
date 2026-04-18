import { useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Info, CheckCircle2 } from 'lucide-react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='342' height='513' viewBox='0 0 342 513'%3E%3Crect width='342' height='513' fill='%231A242F'/%3E%3C/svg%3E`;

function getMediaType(movie) {
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.type === 'movie') return 'movie';
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

function PrimeCard({ movie, isHovered, onHover, onLeave, disableExpand = false }) {
  const [imgError, setImgError] = useState(false);
  const id = movie.tmdbId || movie.id;
  const mediaType = getMediaType(movie);
  const watchLink = id ? `/watch/${id}?type=${mediaType}` : '/';
  const title = movie.title || movie.name || 'Unknown Title';
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);

  const posterSrc = movie.poster_path
    ? `${POSTER_BASE}${movie.poster_path}`
    : PLACEHOLDER_SVG;
  const backdropSrc = movie.backdrop_path
    ? `${BACKDROP_BASE}${movie.backdrop_path}`
    : posterSrc;

  const shouldExpand = isHovered && !disableExpand;
  const displaySrc = imgError
    ? PLACEHOLDER_SVG
    : shouldExpand ? backdropSrc : posterSrc;

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      className={`relative flex-shrink-0 transition-all overflow-hidden duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group cursor-pointer ${
        shouldExpand
          ? 'w-[260px] sm:w-[440px] md:w-[540px] z-30 shadow-2xl shadow-black ring-2 ring-white/20 rounded-xl'
          : 'w-[140px] sm:w-[170px] md:w-[190px] z-10 shadow-lg opacity-80 hover:opacity-100 rounded-lg'
      }`}
      style={{
        aspectRatio: shouldExpand ? '16/9' : '2/3',
        transform: shouldExpand ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <img
        src={displaySrc}
        alt={title}
        className="w-full h-full object-cover transition-all duration-700 absolute inset-0"
        onError={() => setImgError(true)}
        loading="lazy"
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
        !shouldExpand ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
      }`}>
        {!shouldExpand && (
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-xs font-bold line-clamp-1 drop-shadow">
              {title}
            </p>
          </div>
        )}
      </div>

      <div
        className={`absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 transition-opacity duration-500 ${
          shouldExpand ? 'opacity-100 delay-150' : 'opacity-0 pointer-events-none'
        }`}
      >
        {shouldExpand && (
          <div className="animate-fade-up">
            <h3 className="text-white text-lg sm:text-2xl font-black mb-2 line-clamp-2 drop-shadow-md tracking-tight">
              {title}
            </h3>

            <div className="flex items-center gap-2 mb-4">
              <Link
                to={watchLink}
                className="bg-white text-black px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base flex items-center hover:bg-white/90 transition-colors shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Play size={16} fill="currentColor" className="mr-1.5" /> Play
              </Link>
              <button
                className="bg-white/20 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors border border-white/20"
                onClick={(e) => e.preventDefault()}
                title="Add to Watchlist"
              >
                <Plus size={18} />
              </button>
              <Link
                to={watchLink}
                className="bg-white/20 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors border border-white/20"
                onClick={(e) => e.stopPropagation()}
                title="More Info"
              >
                <Info size={18} />
              </Link>
            </div>

            <div className="flex flex-col gap-1 text-[11px] sm:text-xs text-white/80 font-medium">
              <div className="flex items-center gap-1.5 text-green-400 font-bold">
                <CheckCircle2 size={12} /> Included with Velora
              </div>
              <div className="flex items-center gap-1.5">
                {year && (
                  <span className="bg-white/10 px-1.5 rounded">{year}</span>
                )}
                <span>
                  {movie.vote_average > 0
                    ? `${Number(movie.vote_average).toFixed(1)} Rating`
                    : 'New'}
                </span>
                <span>·</span>
                <span className="capitalize">
                  {mediaType === 'tv' ? 'Series' : 'Movie'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrimeCarouselRow({
  title,
  badge,
  movies,
  loading,
  titleLink,
}) {
  const rowRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = useCallback((direction) => {
    if (!rowRef.current) return;
    const amount = rowRef.current.clientWidth * 0.75;
    rowRef.current.scrollBy({
      left: direction === 1 ? amount : -amount,
      behavior: 'smooth',
    });
  }, []);

  const checkScroll = useCallback(() => {
  const el = rowRef.current;
  if (!el) return;
  setCanScrollLeft(el.scrollLeft > 10);
  setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
}, []);

useEffect(() => {
  const el = rowRef.current;
  if (!el) return;
  checkScroll();
  el.addEventListener('scroll', checkScroll, { passive: true });
  return () => el.removeEventListener('scroll', checkScroll);
}, [checkScroll, movies]);

  const clearHover = useCallback(() => setHoveredId(null), []);

  if (loading) {
    return (
      <section className="mb-14">
        <div className="flex items-end gap-3 mb-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg skeleton" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[140px] sm:w-[170px] aspect-[2/3] bg-white/5 rounded-lg skeleton"
            />
          ))}
        </div>
      </section>
    );
  }

  const safeMovies = Array.isArray(movies) ? movies : [];
  if (safeMovies.length === 0) return null;

  return (
    <section className="relative group" onMouseLeave={clearHover}>
      {/* Title — UNTOUCHED from original */}
      {title && (
        <div className="flex items-end justify-between mb-4 sm:mb-5 pr-4 sm:pr-0">
          <div className="flex items-center gap-3">
            <h2 className="section-title text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center">
              {title}
              {badge && (
                <span className="ml-3 text-prime-blue text-xs font-bold px-2 py-0.5 bg-prime-blue/10 border border-prime-blue/20 rounded">
                  {badge}
                </span>
              )}
              {titleLink ? (
                <a
                  href={titleLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View full list"
                >
                  <ChevronRight
                    size={22}
                    className="ml-1 text-prime-subtext hover:text-white cursor-pointer transition-colors"
                  />
                </a>
              ) : (
                <button
                  onClick={() => setExpanded(e => !e)}
                  aria-label={expanded ? 'Collapse section' : 'Expand section'}
                  className="focus:outline-none"
                >
                  <ChevronRight
                    size={22}
                    className="ml-1 text-prime-subtext hover:text-white cursor-pointer transition-all duration-300"
                    style={{
                      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  />
                </button>
              )}
            </h2>
          </div>
        </div>
      )}

      {/* Grid View — UNTOUCHED from original */}
      {expanded ? (
        <div
          className="grid gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          }}
        >
          {safeMovies.map((movie, idx) => (
            <div key={movie._id || movie.id || `movie-${idx}`}>
              <PrimeCard
                movie={movie}
                isHovered={false}
                onHover={() => {}}
                onLeave={() => {}}
                disableExpand
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative -ml-4 sm:-ml-6 lg:-ml-12 pl-4 sm:pl-6 lg:pl-12">

  {canScrollLeft && (
    <div
      onClick={() => scroll(-1)}
      className="hidden sm:flex absolute left-4 sm:left-6 lg:left-12 top-0 bottom-8 w-12 sm:w-14 z-40 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r from-[#080E14] to-transparent"
      role="button"
      aria-label="Scroll left"
    >
      <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
        <ChevronLeft size={20} className="text-white" />
      </div>
    </div>
  )}

  <div
    ref={rowRef}
    className="flex gap-3 sm:gap-4 overflow-x-auto pb-8 pt-4 pr-12 snap-x snap-mandatory"
    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
  >
    {safeMovies.map((movie, idx) => (
      <div
        key={movie._id || movie.id || `movie-${idx}`}
        className={`snap-start pt-2 ${idx === 0 ? 'pl-3 sm:pl-4' : ''}`}
      >
        <PrimeCard
          movie={movie}
          isHovered={hoveredId === (movie._id || movie.id)}
          onHover={() => setHoveredId(movie._id || movie.id)}
          onLeave={() => setHoveredId(null)}
        />
      </div>
    ))}
  </div>

  {canScrollRight && (
    <div
      onClick={() => scroll(1)}
      className="hidden sm:flex absolute right-0 top-0 bottom-8 w-12 sm:w-14 z-40 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-l from-[#080E14] to-transparent"
      role="button"
      aria-label="Scroll right"
    >
      <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
        <ChevronRight size={20} className="text-white" />
      </div>
    </div>
  )}

</div>
      )}
    </section>
  );
}