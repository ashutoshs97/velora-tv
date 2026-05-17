import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { removeFromHistory } from '../utils/watchHistory';
import { PrimeCard, HoverPopout } from './PrimeCarouselRow';

export default function RecentlyWatched({ history, onRefresh }) {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activePopout, setActivePopout] = useState(null);

  // Edge detection for arrow shifting
  const isHoveredPopped = activePopout !== null;

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
  }, [checkScroll, history]);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const amount = el.clientWidth * 0.75;
    const currentScroll = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    let target = currentScroll + dir * amount;

    // Snapping tolerance (about 1.5 cards + gap: 1.5 * 260px = ~390px)
    const snapTolerance = 390;

    if (dir === 1) {
      if (maxScroll - target < snapTolerance) {
        target = maxScroll;
      }
    } else if (dir === -1) {
      if (target < snapTolerance) {
        target = 0;
      }
    }

    el.scrollTo({ left: target, behavior: 'smooth' });
    requestAnimationFrame(checkScroll);
  };

  const handleDelete = (tmdbId) => {
    removeFromHistory(tmdbId);
    onRefresh?.();
  };

  if (!history || history.length === 0) return null;

  return (
    <section className="relative group/row">
      <AnimatePresence mode="wait">
        {activePopout && (
          <HoverPopout
            key={activePopout.movie.id || activePopout.movie.tmdbId}
            popout={activePopout}
            onClose={() => setActivePopout(null)}
            primaryActionLabel="Resume"
            onDelete={handleDelete}
            navigate={navigate}
          />
        )}
      </AnimatePresence>

      {/* title */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Continue Watching
        </h2>
      </div>

      {/* carousel */}
      <div className="relative">
        <AnimatePresence>
          {canScrollLeft && (
            <motion.div
              onClick={() => scroll(-1)}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: isHoveredPopped ? 1 : 0.75, x: 0 }}
              exit={{ opacity: 0, x: -80 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`hidden sm:flex absolute -left-10 lg:-left-12 top-0 bottom-4 w-10 z-40 cursor-pointer items-center justify-center bg-transparent text-white border-0 shadow-none backdrop-blur-none transition-all duration-300 hover:scale-125 hover:opacity-100 select-none outline-none active:outline-none focus:outline-none focus-visible:outline-none ${
                isHoveredPopped ? 'z-[10001] scale-110' : ''
              }`}
              role="button"
              aria-label="Scroll left"
            >
              <ChevronLeft size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 pr-12 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {history.map((item, idx) => (
            <PrimeCard
              key={item.tmdbId || item.id || `history-${idx}`}
              movie={item}
            onHoverPopout={setActivePopout}
              rowRef={scrollRef}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <AnimatePresence>
          {canScrollRight && (
            <motion.div
              onClick={() => scroll(1)}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: isHoveredPopped ? 1 : 0.75, x: 0 }}
              exit={{ opacity: 0, x: 80 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              style={{ WebkitTapHighlightColor: 'transparent' }}
              className={`hidden sm:flex absolute -right-10 lg:-right-12 top-0 bottom-4 w-10 z-40 cursor-pointer items-center justify-center bg-transparent text-white border-0 shadow-none backdrop-blur-none transition-all duration-300 hover:scale-125 hover:opacity-100 select-none outline-none active:outline-none focus:outline-none focus-visible:outline-none ${
                isHoveredPopped ? 'z-[10001] scale-110' : ''
              }`}
              role="button"
              aria-label="Scroll right"
            >
              <ChevronRight size={26} strokeWidth={2.4} className="drop-shadow-[0_2px_5px_rgba(0,0,0,0.45)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
