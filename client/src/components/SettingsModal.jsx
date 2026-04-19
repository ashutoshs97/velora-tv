import { motion } from 'framer-motion';
import { X, Moon, Zap, Paintbrush } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const THEMES = [
  { id: 'blue', name: 'Velora Blue', color: '#2563eb' },
  { id: 'red', name: 'Netflix Red', color: '#e50914' },
  { id: 'green', name: 'Hulu Green', color: '#1ce783' },
  { id: 'purple', name: 'HBO Purple', color: '#7c3aed' },
];

export default function SettingsModal({ onClose }) {
  const { reducedMotion, setReducedMotion, theme, setTheme } = useSettings();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap size={20} className="text-[var(--color-primary, #2563eb)]" style={{ color: 'var(--color-primary, #2563eb)' }} />
            App Settings
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2 mb-1">
                <Moon size={16} className="text-white/50" />
                Reduced Motion
              </h3>
              <p className="text-xs text-white/50 w-4/5 leading-relaxed">
                Disables heavy animations across the site. Recommended for older devices to save battery and improve performance.
              </p>
            </div>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                reducedMotion ? 'bg-[var(--color-primary)]' : 'bg-white/20'
              }`}
              style={{ backgroundColor: reducedMotion ? 'var(--color-primary, #2563eb)' : '' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Theme Selector */}
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
              <Paintbrush size={16} className="text-white/50" />
              Accent Theme
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    theme === t.id
                      ? 'bg-white/10 border-white/30'
                      : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: t.color }} />
                  <span className="text-sm font-medium text-white">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="p-5 border-t border-white/5 bg-black/20 text-center">
          <p className="text-[11px] text-white/30 uppercase tracking-widest font-semibold">Velora UI/UX Engine</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
