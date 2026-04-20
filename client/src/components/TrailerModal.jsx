import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Clapperboard } from 'lucide-react';

export default function TrailerModal({ videoKey, title, onClose }) {
  // close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // don't render if no valid video key
  if (!videoKey || typeof videoKey !== 'string' || !videoKey.trim()) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

      {/* modal box */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-4xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-3 mb-3">
          <Clapperboard size={20} className="text-red-500 flex-shrink-0" />
          <span className="text-white font-semibold text-sm line-clamp-1 flex-1">
            {title} — Official Trailer
          </span>
          <button
            onClick={onClose}
            aria-label="Close trailer"
            className="ml-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* youtube embed */}
        <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <iframe
            src={`https://www.youtube.com/embed/${videoKey.trim()}?autoplay=1&rel=0&modestbranding=1`}
            title={`${title} Trailer`}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}