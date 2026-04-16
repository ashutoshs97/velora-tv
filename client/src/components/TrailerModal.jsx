import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clapperboard } from 'lucide-react';

export default function TrailerModal({ videoKey, title, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
      >
        {/* Backdrop blur */}
        <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" />

        {/* Modal box */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative w-full max-w-4xl z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <Clapperboard size={20} className="text-red-500" />
            <span className="text-white font-semibold text-sm line-clamp-1">{title} — Official Trailer</span>
            <button
              onClick={onClose}
              className="ml-auto w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* YouTube embed */}
          <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`${title} Trailer`}
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
