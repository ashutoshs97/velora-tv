import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings2, Palette, Activity } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

const THEMES = [
  { id: 'blue', label: 'Prime Blue', bg: 'bg-[#00B4FF]' },
  { id: 'red', label: 'Netflix Red', bg: 'bg-[#e50914]' },
  { id: 'purple', label: 'Max Purple', bg: 'bg-[#a855f7]' },
  { id: 'green', label: 'Hulu Green', bg: 'bg-[#10b981]' },
];

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, setTheme, reducedMotion, setReducedMotion } = useSettings();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[101] m-auto w-full max-w-sm h-fit max-h-[80vh] bg-[#0F1923] border border-white/10 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-white">
                <Settings2 size={20} className="text-prime-blue" />
                <h2 className="text-xl font-bold font-display">Preferences</h2>
              </div>
              <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Theme Picker */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-prime-subtext" />
                  <label className="text-sm font-semibold text-prime-subtext uppercase tracking-wider">Accent Color</label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {THEMES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        triggerHaptic('light');
                        setTheme(t.id);
                      }}
                      className={`flex flex-col items-center gap-2 outline-none`}
                    >
                      <div className={`w-10 h-10 rounded-full ${t.bg} border-2 transition-all ${
                        theme === t.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                      }`} />
                      <span className={`text-[10px] font-bold ${theme === t.id ? 'text-white' : 'text-white/40'}`}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reduced Motion Toggle */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={16} className="text-prime-subtext" />
                  <label className="text-sm font-semibold text-prime-subtext uppercase tracking-wider">Performance</label>
                </div>
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    setReducedMotion(!reducedMotion);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                >
                  <div>
                    <div className="text-white font-bold text-sm">Reduced Motion</div>
                    <div className="text-white/50 text-xs mt-0.5">Disable spatial animations to save battery</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center transition-colors px-1 ${
                    reducedMotion ? 'bg-prime-blue' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      reducedMotion ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
