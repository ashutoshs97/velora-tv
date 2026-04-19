import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashIntro({ onDone }) {
  const [phase, setPhase]     = useState('enter');  // enter → flash → exit
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // After logo slams in (~0.6s), trigger the flash
    const flashTimer = setTimeout(() => setPhase('flash'), 650);

    // Hold, then begin exit
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        sessionStorage.setItem('velora_intro_shown', '1');
        onDone();
      }, 600);
    }, 1800);

    return () => {
      clearTimeout(flashTimer);
      clearTimeout(exitTimer);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Flash overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'white' }}
            initial={{ opacity: 0 }}
            animate={phase === 'flash' ? { opacity: [0, 0.18, 0] } : { opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />

          {/* Logo slam */}
          <motion.div
            className="flex items-center gap-4 select-none"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 22,
              mass: 0.8,
              delay: 0.05,
            }}
          >
            <motion.img
              src="/velora-icon.svg"
              alt="Velora"
              style={{ width: 56, height: 56 }}
              animate={phase === 'flash' ? { filter: ['drop-shadow(0 0 0px rgba(37,99,235,0))', 'drop-shadow(0 0 30px rgba(37,99,235,1))', 'drop-shadow(0 0 12px rgba(37,99,235,0.5))'] } : {}}
              transition={{ duration: 0.4 }}
            />
            <motion.span
              style={{
                fontFamily: 'Satoshi, system-ui, sans-serif',
                fontWeight: 900,
                fontSize: 'clamp(3rem, 9vw, 5.5rem)',
                letterSpacing: '0.12em',
                color: '#ffffff',
                lineHeight: 1,
              }}
              animate={
                phase === 'flash'
                  ? {
                      textShadow: [
                        '0 0 0px rgba(37,99,235,0)',
                        '0 0 50px rgba(37,99,235,1), 0 0 120px rgba(37,99,235,0.4)',
                        '0 0 10px rgba(37,99,235,0.3)',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.4 }}
            >
              VELORA
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
