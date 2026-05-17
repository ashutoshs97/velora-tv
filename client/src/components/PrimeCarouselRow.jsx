import { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Plus, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WatchlistButton from './WatchlistButton';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342';
const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='281' viewBox='0 0 500 281'%3E%3Crect width='500' height='281' fill='%23181818'/%3E%3C/svg%3E`;

function getMediaType(movie) {
  if (movie.media_type) return movie.media_type;
  if (movie.type) return movie.type;
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

function getImageSrc(movie, usePoster = false) {
  const backdrop = movie.backdrop_path || movie.backdropPath;
  const poster = movie.poster_path || movie.posterPath;
  if (usePoster && poster) return `${POSTER_BASE}${poster}`;
  if (backdrop) return `${BACKDROP_BASE}${backdrop}`;
  if (poster) return `${POSTER_BASE}${poster}`;
  return PLACEHOLDER;
}

/* ─────────────────────────────────────────────
   HoverPopout — Portal-based expanded card
   ───────────────────────────────────────────── */
export function HoverPopout({ popout, onClose, navigate, primaryActionLabel = "Play", onDelete }) {
  const { movie, rect } = popout;
  const aspect = popout.aspect || 'landscape';
  const isPoster = aspect === 'poster';
  const id = movie.tmdbId || movie.id;
  const mediaType = getMediaType(movie);
  const watchLink = movie.season && movie.episode
    ? `/watch/${id}?type=${mediaType}&s=${movie.season}&e=${movie.episode}`
    : id ? `/watch/${id}?type=${mediaType}` : '/';
  const title = movie.title || movie.name || 'Unknown Title';
  const year = movie.year || (movie.release_date || movie.first_air_date || '').substring(0, 4);
  const description = movie.overview || '';
  const imageSrc = getImageSrc(movie, false); // always use horizontal backdrop for widescreen detail preview in popout
  const ratingVal = movie.vote_average || movie.rating;
  const rating = ratingVal ? Number(ratingVal).toFixed(1) : null;
  const seasons = movie.number_of_seasons;

  // Responsive popout width based on viewport
  const vw = window.innerWidth;
  const popoutWidth = vw < 640 
    ? Math.min(vw - 24, 300) 
    : isPoster 
      ? 320 
      : Math.min(rect.width * 1.35, 360);
  // Widescreen ratio for the popout card's top header preview
  const imageHeight = popoutWidth * (8.2 / 16);

  // Position: the leftmost visible card should always expand to the right
  // We compare the card's edges to the row container's bounding rect
  const rowLeft = popout.rowLeft ?? 0;
  const rowWidth = popout.rowWidth ?? vw;
  const isLeftEdge = rect.left < rowLeft + rect.width * 0.5; // first visible card
  const isRightEdge = rect.right > rowLeft + rowWidth - rect.width * 0.5; // last visible card

  let left;
  if (isLeftEdge) {
    left = rect.left - 12; // Anchor to card's left edge — grows to the right and shift leftward by 12px
  } else if (isRightEdge) {
    left = rect.right - popoutWidth - 12; // Anchor to card's right edge — grows to the left and shift inward by 12px
  } else {
    left = rect.left + rect.width / 2 - popoutWidth / 2; // Center
  }
  // Ensure a 60px safe margin on both sides so the popout mathematically never overlaps the scroll arrows
  left = Math.max(60, Math.min(left, vw - popoutWidth - 60));

  // Center the image vertically on the card, and shift it up slightly more so it expands vertically from the top as well and covers the card underneath
  let top = rect.top - (imageHeight - rect.height) / 2 - 20;
  top = Math.max(12, top);

  // Total popout height = image + details
  const detailsHeight = 155;
  const totalHeight = imageHeight + detailsHeight;

  // Close on scroll
  useEffect(() => {
    const handleScroll = () => onClose();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [onClose]);

  return createPortal(
    <motion.div
      initial={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        opacity: 1,
      }}
      animate={{
        top: top,
        left: left,
        width: popoutWidth,
        height: totalHeight,
        opacity: 1,
      }}
      exit={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        opacity: 0,
      }}
      transition={{
        default: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.15 },
      }}
      className="fixed z-[9999] rounded-2xl overflow-hidden cursor-pointer"
      style={{
        transformOrigin: 'top left',
        willChange: 'top, left, width, height',
        backfaceVisibility: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
      }}
      onMouseLeave={onClose}
      onClick={() => navigate(watchLink)}
    >
      {/* Solid seamless background */}
      <div className="absolute inset-0 bg-[#0c141c]" />

      {/* Image — covers the top portion, with a slow cinematic zoom */}
      <motion.img
        src={imageSrc}
        alt={title}
        className="absolute top-0 left-0 w-full object-cover"
        style={{ height: imageHeight }}
        draggable={false}
        initial={{ scale: 1 }}
        animate={{ scale: 1.06 }}
        transition={{ duration: 8, ease: 'easeOut' }}
      />

      {/* Gradient — extends 40px PAST the image bottom to eliminate any seam */}
      <div
        className="absolute top-0 left-0 w-full"
        style={{
          height: imageHeight + 40,
          background: `linear-gradient(to bottom, transparent 20%, rgba(12,20,28,0.3) 50%, rgba(12,20,28,0.85) 75%, #0c141c 90%)`,
        }}
      />

      {/* Rating chip */}
      {rating && !onDelete && (
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-black/50 backdrop-blur-xl text-[#f5c518] text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-lg border border-white/5">
            ★ {rating}
          </span>
        </div>
      )}

      {/* Delete button for history items */}
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(movie.tmdbId || movie.id); onClose(); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center opacity-70 hover:opacity-100 transition-all duration-300 hover:bg-black hover:scale-110 z-20 border border-white/10"
          title="Remove from history"
        >
          <X size={16} className="text-white" />
        </button>
      )}

      {/* Content — positioned at the bottom, sitting on the solid bg area */}
      <div
        className="absolute bottom-0 left-0 w-full flex flex-col px-3.5 pb-3 z-10"
        style={{ height: detailsHeight + 16 }}
      >
        {/* Title */}
        <h3 className="text-white font-extrabold text-[16px] leading-tight line-clamp-1 mb-1.5 mt-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
          {title}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-[12px] text-white/50 font-semibold mb-1.5">
          {year && <span className="text-white/65">{year}</span>}
          {year && <span className="w-0.5 h-0.5 rounded-full bg-white/25 inline-block" />}
          {seasons
            ? <span>{seasons} Season{seasons > 1 ? 's' : ''}</span>
            : <span className="capitalize">{mediaType}</span>
          }
          {rating >= 7.0 && (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-white/25 inline-block" />
              <span className="text-emerald-400 font-bold">Highly Rated</span>
            </>
          )}
        </div>

        {/* Description */}
        <p className="text-white/45 text-[12px] leading-relaxed line-clamp-2 mb-2">
          {description || 'No description available.'}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            className="flex-1 h-9 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-200 font-bold text-[14px] text-white hover:brightness-110 active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, black))`,
              boxShadow: '0 4px 16px rgba(var(--color-primary-rgb), 0.3)',
            }}
            onClick={(e) => { e.stopPropagation(); navigate(watchLink); }}
          >
            <Play size={16} fill="currentColor" />
            {primaryActionLabel}
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <WatchlistButton
              movie={movie}
              type={mediaType}
              className="w-9 h-9 flex items-center justify-center bg-white/[0.06] text-white/60 rounded-lg hover:bg-white/[0.12] hover:text-white transition-all border border-white/[0.06] hover:border-white/[0.12]"
              size={16}
            />
          </div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

/* ─────────────────────────────────────────────
   PrimeCard — Base card in the carousel row
   Cinematic landscape card with hover title reveal
   ───────────────────────────────────────────── */
export function PrimeCard({ movie, onHoverPopout, rowRef, onDelete, rank, aspect = 'landscape' }) {
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const id = movie.tmdbId || movie.id;
  const mediaType = getMediaType(movie);
  const watchLink = movie.season && movie.episode
    ? `/watch/${id}?type=${mediaType}&s=${movie.season}&e=${movie.episode}`
    : id ? `/watch/${id}?type=${mediaType}` : '/';
  const isPoster = aspect === 'poster';
  const imageSrc = imgError ? PLACEHOLDER : getImageSrc(movie, isPoster);
  const title = movie.title || movie.name || '';
  const year = movie.year || (movie.release_date || movie.first_air_date || '').substring(0, 4);

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      if (cardRef.current) {
        const rowRect = rowRef?.current?.getBoundingClientRect();
        const rowLeft = rowRect?.left ?? 0;
        const rowWidth = rowRect?.width ?? window.innerWidth;
        onHoverPopout({ movie, rect: cardRef.current.getBoundingClientRect(), rowLeft, rowWidth, onDelete, aspect });
      }
    }, 350);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(watchLink)}
      className="relative flex-shrink-0 cursor-pointer snap-start group"
    >
      {/* Netflix Rank Badge positioned partially behind/on top of the card's left side */}
      {rank && (
        <div
          className="absolute -left-6 sm:-left-8 bottom-[-8px] z-10 select-none pointer-events-none transition-transform duration-[800ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:scale-110 group-hover:-translate-y-1"
          aria-hidden="true"
        >
          <span
            className="font-black leading-none select-none tracking-tighter"
            style={{
              fontSize: 'clamp(72px, 8.5vw, 105px)',
              lineHeight: 0.75,
              WebkitTextStroke: '2px #0084ff',
              color: '#000000', // solid pure black
              filter: 'drop-shadow(0 0 10px rgba(0, 132, 255, 0.4)) drop-shadow(4px 4px 6px rgba(0,0,0,0.9))',
              fontFamily: "'Outfit', 'Inter', sans-serif",
              fontWeight: 900,
            }}
          >
            {rank}
          </span>
        </div>
      )}
      <div
        className={`relative rounded-lg overflow-hidden bg-[#111] ${
          isPoster
            ? 'w-[130px] sm:w-[155px] md:w-[170px] lg:w-[190px] xl:w-[205px] aspect-[2/3]'
            : 'w-[200px] sm:w-[240px] md:w-[270px] lg:w-[300px] xl:w-[320px] aspect-video'
        }`}
        style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
      >
        {/* Image with slow smooth zoom */}
        <img
          src={imageSrc}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          onError={() => setImgError(true)}
          loading="lazy"
          draggable={false}
        />

        {/* Gradient overlay — always visible for text readability, deepens on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-700 group-hover:from-black/90" />

        {/* Title + Year — always visible. Shift slightly to avoid overlap with rank badge */}
        <div className={`absolute bottom-0 inset-x-0 px-3 pb-2.5 transition-all duration-300 ${rank ? 'pl-[45px] sm:pl-[55px]' : ''}`}>
          <h4 className="text-white font-semibold text-[13px] sm:text-sm leading-snug line-clamp-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
            {title}
          </h4>
          {year && (
            <span className="text-white/50 text-[10px] font-medium transition-colors duration-700 group-hover:text-white/70">{year}</span>
          )}
        </div>

        {/* Hover border glow — slow and subtle */}
        <div className="absolute inset-0 rounded-lg border border-white/0 transition-all duration-700 group-hover:border-white/15" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PrimeCarouselRow — The full carousel row
   ───────────────────────────────────────────── */
export default function PrimeCarouselRow({ title, badge, movies, loading, titleLink, ranked = false, aspect = 'landscape' }) {
  const rowRef = useRef(null);
  const [activePopout, setActivePopout] = useState(null);
  const navigate = useNavigate();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Detect if any card is currently hovered & zoomed in
  const isHoveredPopped = activePopout !== null;

  const scroll = useCallback((direction) => {
    if (!rowRef.current) return;
    const firstCard = rowRef.current.children[0];
    if (firstCard) {
      const cardWidth = firstCard.offsetWidth;
      const gap = parseInt(window.getComputedStyle(rowRef.current).gap) || 0;
      const visibleItems = Math.floor(rowRef.current.clientWidth / (cardWidth + gap));
      const itemsToScroll = Math.max(1, Math.min(visibleItems, 4));
      const amount = (cardWidth + gap) * itemsToScroll;

      const currentScroll = rowRef.current.scrollLeft;
      const maxScroll = rowRef.current.scrollWidth - rowRef.current.clientWidth;
      let target = currentScroll + direction * amount;

      if (direction === 1) {
        // If remaining space to end is less than 1.5 cards, scroll all the way to the end
        if (maxScroll - target < (cardWidth + gap) * 1.5) {
          target = maxScroll;
        }
      } else if (direction === -1) {
        // If remaining space to beginning is less than 1.5 cards, scroll all the way to 0
        if (target < (cardWidth + gap) * 1.5) {
          target = 0;
        }
      }

      rowRef.current.scrollTo({ left: target, behavior: 'smooth' });
    }
  }, []);

  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 24);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, movies]);

  // Loading skeleton
  if (loading) {
    return (
      <section className="mb-14">
        <div className="flex items-end gap-3 mb-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg skeleton" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[260px] aspect-video bg-white/5 rounded-lg skeleton" />
          ))}
        </div>
      </section>
    );
  }

  const safeMovies = Array.isArray(movies) ? movies : [];
  if (safeMovies.length === 0) return null;

  return (
    <section className="relative group/row">
      {/* Portal-based hover popout */}
      <AnimatePresence mode="wait">
        {activePopout && (
          <HoverPopout
            key={activePopout.movie.id || activePopout.movie.tmdbId}
            popout={activePopout}
            onClose={() => setActivePopout(null)}
            navigate={navigate}
          />
        )}
      </AnimatePresence>

      {/* Row Title */}
      {title && (
        <div className="flex items-end justify-between mb-3 pr-4 sm:pr-0">
          <div className="flex items-center gap-3">
            <h2 className="section-title text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center">
              {title}
              {badge && (
                <span className="ml-3 text-prime-blue text-xs font-bold px-2 py-0.5 bg-prime-blue/10 border border-prime-blue/20 rounded">
                  {badge}
                </span>
              )}
            </h2>
          </div>
        </div>
      )}

      {/* Carousel Track */}
      <div className="relative">
        {/* Left Arrow */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              type="button"
              onClick={() => scroll(-1)}
              title="Scroll left"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: isHoveredPopped ? 1 : 0.75, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`hidden md:flex absolute -left-10 lg:-left-12 top-0 bottom-4 w-10 z-20 cursor-pointer items-center justify-center bg-transparent text-white border-0 shadow-none backdrop-blur-none transition-all duration-300 hover:scale-125 hover:opacity-100 select-none outline-none active:outline-none focus:outline-none focus-visible:outline-none ${
                isHoveredPopped ? 'z-[10001] scale-110' : ''
              }`}
            >
              <ChevronLeft size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Row */}
        <div
          ref={rowRef}
          className={`flex gap-3 sm:gap-4 overflow-x-auto pb-4 pr-4 sm:pr-6 lg:pr-12 snap-x snap-mandatory ${
            ranked ? 'pl-10 sm:pl-12 lg:pl-16' : ''
          }`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {safeMovies.map((movie, idx) => (
            <PrimeCard
              key={movie._id || movie.id || `movie-${idx}`}
              movie={movie}
              onHoverPopout={setActivePopout}
              rowRef={rowRef}
              rank={ranked ? idx + 1 : null}
              aspect={aspect}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              type="button"
              onClick={() => scroll(1)}
              title="Scroll right"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: isHoveredPopped ? 1 : 0.75, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`hidden md:flex absolute -right-10 lg:-right-12 top-0 bottom-4 w-10 z-20 cursor-pointer items-center justify-center bg-transparent text-white border-0 shadow-none backdrop-blur-none transition-all duration-300 hover:scale-125 hover:opacity-100 select-none outline-none active:outline-none focus:outline-none focus-visible:outline-none ${
                isHoveredPopped ? 'z-[10001] scale-110' : ''
              }`}
            >
              <ChevronRight size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}