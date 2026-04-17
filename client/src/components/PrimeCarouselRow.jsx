import { useRef, useState } from 'react';
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

function PrimeCard({ movie, isHovered, onHover, onLeave }) {
  const [imgError, setImgError] = useState(false);
  const id = movie.tmdbId || movie.id;
  const mediaType = getMediaType(movie);
  const watchLink = `/watch/${id}?type=${mediaType}`;
  const title = movie.title || movie.name || 'Unknown Title';
  const year = (movie.release_date || movie.first_air_date || '').substring(0, 4);

  // When inactive, show poster. When active, show backdrop.
  const posterSrc = movie.poster_path ? `${POSTER_BASE}${movie.poster_path}` : PLACEHOLDER_SVG;
  const backdropSrc = movie.backdrop_path ? `${BACKDROP_BASE}${movie.backdrop_path}` : posterSrc;
  const displaySrc = imgError ? PLACEHOLDER_SVG : (isHovered ? backdropSrc : posterSrc);

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`relative flex-shrink-0 transition-all overflow-hidden duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] group cursor-pointer ${
        isHovered
          ? 'w-[280px] sm:w-[480px] md:w-[540px] z-30 shadow-2xl shadow-black ring-2 ring-white/20 rounded-xl'
          : 'w-[140px] sm:w-[170px] md:w-[190px] z-10 shadow-lg opacity-80 hover:opacity-100 rounded-lg'
      }`}
      style={{
        aspectRatio: isHovered ? '16/9' : '2/3',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <Link to={watchLink} className="block w-full h-full relative">
        <img
          src={displaySrc}
          alt={title}
          className="w-full h-full object-cover transition-all duration-700"
          onError={() => setImgError(true)}
        />
        
        {/* Unhovered overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 ${!isHovered ? 'group-hover:opacity-100' : ''}`} />

        {/* Hovered Expanded Details */}
        <div 
          className={`absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 transition-opacity duration-500 ${
            isHovered ? 'opacity-100 delay-150' : 'opacity-0 pointer-events-none'
          }`}
        >
          {isHovered && (
            <div className="animate-fade-up">
              <h3 className="text-white text-lg sm:text-2xl font-black mb-2 line-clamp-2 drop-shadow-md tracking-tight">
                {title}
              </h3>
              
              <div className="flex items-center gap-2 mb-4">
                <button className="bg-white text-black px-4 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base flex items-center hover:bg-white/90 transition-colors shadow-lg">
                  <Play size={16} fill="currentColor" className="mr-1.5" /> Play
                </button>
                <button className="bg-white/20 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors pointer-events-auto border border-white/20">
                  <Plus size={18} />
                </button>
                <button className="bg-white/20 text-white p-1.5 sm:p-2 rounded-full backdrop-blur-md hover:bg-white/30 transition-colors pointer-events-auto border border-white/20">
                  <Info size={18} />
                </button>
              </div>

              <div className="flex flex-col gap-1 text-[11px] sm:text-xs text-white/80 font-medium">
                <div className="flex items-center gap-1.5 text-green-400 font-bold">
                  <CheckCircle2 size={12} /> Included with Velora
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-white/10 px-1.5 rounded">{year || '2025'}</span>
                  <span>{movie.vote_average ? Number(movie.vote_average).toFixed(1) + ' Rating' : 'New'}</span>
                  <span>·</span>
                  <span className="capitalize">{mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </Link>
    </div>
  );
}

export default function PrimeCarouselRow({ title, badge, movies, loading, titleLink }) {
  const rowRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === 1 ? clientWidth * 0.75 : -clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="mb-14">
        <div className="flex items-end gap-3 mb-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg skeleton" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] sm:w-[170px] aspect-[2/3] bg-white/5 rounded-lg skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative group">
      {title && (
        <div className="flex items-end justify-between mb-4 sm:mb-5 pr-4 sm:pr-0">
          <div className="flex items-center gap-3">
            <h2 className="section-title text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center">
              {title}
              {titleLink ? (
                <a href={titleLink} target="_blank" rel="noopener noreferrer" aria-label="View full list">
                  <ChevronRight size={22} className="ml-1 text-prime-subtext hover:text-white cursor-pointer transition-colors" />
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
                    style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  />
                </button>
              )}
            </h2>
          </div>
        </div>
      )}

      {/* Expanded Grid View */}
      {expanded ? (
        <div
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
        >
          {movies.map((movie) => (
            <div key={movie.id} className="snap-start">
              <PrimeCard
                movie={movie}
                isHovered={hoveredId === movie.id}
                onHover={() => setHoveredId(movie.id)}
                onLeave={() => setHoveredId(null)}
              />
            </div>
          ))}
        </div>
      ) : (
        /* Carousel View */
        <div className="relative -ml-4 sm:-ml-6 lg:-ml-12 pl-4 sm:pl-6 lg:pl-12">
          <div
            ref={rowRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-8 pt-4 hide-scrollbar snap-x snap-mandatory pr-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {movies.map((movie) => (
              <div key={movie.id} className="snap-start pt-2">
                <PrimeCard
                  movie={movie}
                  isHovered={hoveredId === movie.id}
                  onHover={() => setHoveredId(movie.id)}
                  onLeave={() => setHoveredId(null)}
                />
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="hidden sm:block">
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-[45%] -translate-y-1/2 w-10 h-16 bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-black/80 hover:w-12 transition-all z-40 rounded-r-xl"
              aria-label="Scroll left"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-[45%] -translate-y-1/2 w-10 h-16 bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-black/80 hover:w-12 transition-all z-40 rounded-l-xl"
              aria-label="Scroll right"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
