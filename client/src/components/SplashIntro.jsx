import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const EASE_CURTAIN = [0.76, 0, 0.24, 1]; // cinematic cubic-bezier

export default function SplashIntro({ onDone }) {
  const [phase, setPhase] = useState('hold'); // hold → wipe → done

  useEffect(() => {
    // Logo fades in immediately, bars start wiping after a hold
    const wipeTimer = setTimeout(() => setPhase('wipe'), 1300);
    const doneTimer = setTimeout(() => {
      sessionStorage.setItem('velora_intro_shown', '1');
      onDone();
    }, 2700);

    return () => {
      clearTimeout(wipeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  const isWiping = phase === 'wipe';

  return (
    <>
      {/* ── Top curtain bar ─────────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[9999]"
        style={{ height: '50vh', background: '#000', originY: 0 }}
        animate={isWiping ? { y: '-100%' } : { y: '0%' }}
        transition={{ duration: 1.0, ease: EASE_CURTAIN }}
      >
        {/* Subtle scan line at bottom edge of top bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.6), transparent)' }}
        />
      </motion.div>

      {/* ── Bottom curtain bar ──────────────────────────────────────────── */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[9999]"
        style={{ height: '50vh', background: '#000', originY: 1 }}
        animate={isWiping ? { y: '100%' } : { y: '0%' }}
        transition={{ duration: 1.0, ease: EASE_CURTAIN }}
      >
        {/* Subtle scan line at top edge of bottom bar */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.6), transparent)' }}
        />
      </motion.div>

      {/* ── Logo — centered between the two bars ────────────────────────── */}
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none select-none gap-3"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          isWiping
            ? { opacity: 0, scale: 1.08, transition: { duration: 0.45, ease: 'easeIn' } }
            : { opacity: 1, scale: 1,    transition: { duration: 0.5,  ease: 'easeOut', delay: 0.15 } }
        }
      >
        {/* Velora icon + wordmark */}
        <div className="flex items-center gap-4">
          <img
            src="/velora-icon.svg"
            alt="Velora"
            style={{
              width: 52,
              height: 52,
              filter: 'drop-shadow(0 0 18px rgba(37,99,235,0.8))',
            }}
          />
          <span
            style={{
              fontFamily: 'Satoshi, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(2.8rem, 8vw, 5rem)',
              letterSpacing: '0.14em',
              color: '#ffffff',
              textShadow: '0 0 40px rgba(37,99,235,0.7), 0 0 80px rgba(37,99,235,0.3)',
              lineHeight: 1,
            }}
          >
            VELORA
          </span>
        </div>

        {/* Film-style tag line */}
        <p
          style={{
            fontFamily: 'Satoshi, system-ui, sans-serif',
            fontSize: '0.65rem',
            letterSpacing: '0.4em',
            color: 'rgba(255,255,255,0.35)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Stream Anything
        </p>
      </motion.div>
    </>
  );
}
