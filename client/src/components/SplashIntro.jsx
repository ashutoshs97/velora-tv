import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LETTERS = ['V', 'E', 'L', 'O', 'R', 'A'];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      delayChildren: 0.4,
      staggerChildren: 0.1,
    },
  },
};

const letterVariants = {
  hidden: {
    y: -90,
    opacity: 0,
    rotateX: -60,
    scale: 1.4,
  },
  visible: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 18,
      mass: 0.9,
    },
  },
};

const glowVariants = {
  off: { textShadow: '0 0 0px rgba(37,99,235,0)', color: '#ffffff' },
  on: {
    textShadow: [
      '0 0 0px rgba(37,99,235,0)',
      '0 0 40px rgba(37,99,235,0.9), 0 0 100px rgba(37,99,235,0.5)',
      '0 0 20px rgba(37,99,235,0.6), 0 0 60px rgba(37,99,235,0.3)',
    ],
    color: ['#ffffff', '#d4e8ff', '#ffffff'],
    transition: { duration: 0.8, ease: 'easeInOut' },
  },
};

const underlineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { delay: 1.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

const taglineVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delay: 1.6, duration: 0.5, ease: 'easeOut' },
  },
};

export default function SplashIntro({ onDone }) {
  const [glow, setGlow]       = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // After all letters drop (~0.4 + 6×0.1 + spring settle), fire glow
    const glowTimer = setTimeout(() => setGlow(true), 1200);

    // Begin exit after glow + hold
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        sessionStorage.setItem('velora_intro_shown', '1');
        onDone();
      }, 700);
    }, 2600);

    return () => {
      clearTimeout(glowTimer);
      clearTimeout(exitTimer);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: '#080E14' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Ambient radial glow behind logo */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 500,
              height: 500,
              background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
            animate={glow ? { opacity: [1, 1.6, 1] } : { opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Icon drops in first */}
          <motion.img
            src="/velora-icon.svg"
            alt="Velora"
            className="mb-5"
            style={{ width: 56, height: 56 }}
            initial={{ y: -60, opacity: 0, scale: 1.3 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 240, damping: 18 }}
          />

          {/* Letter-by-letter drop */}
          <motion.div
            className="flex items-end gap-[0.06em] perspective-[800px]"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ perspective: '800px' }}
          >
            {LETTERS.map((letter, i) => (
              <motion.span
                key={i}
                variants={letterVariants}
                animate={glow ? glowVariants.on : glowVariants.off}
                style={{
                  display: 'inline-block',
                  fontFamily: 'Satoshi, system-ui, sans-serif',
                  fontWeight: 900,
                  fontSize: 'clamp(3.5rem, 10vw, 6.5rem)',
                  letterSpacing: '0.05em',
                  color: '#ffffff',
                  lineHeight: 1,
                  transformOrigin: 'top center',
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>

          {/* Animated underline */}
          <motion.div
            className="mt-2 h-[2px] rounded-full"
            style={{
              width: 'clamp(200px, 40vw, 380px)',
              background: 'linear-gradient(90deg, transparent, #2563eb, #60a5fa, #2563eb, transparent)',
              transformOrigin: 'center',
            }}
            variants={underlineVariants}
            initial="hidden"
            animate="visible"
          />

          {/* Tagline */}
          <motion.p
            className="mt-4 text-white/40 tracking-[0.3em] uppercase text-xs sm:text-sm font-semibold"
            style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
            variants={taglineVariants}
            initial="hidden"
            animate="visible"
          >
            Stream Anything
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
