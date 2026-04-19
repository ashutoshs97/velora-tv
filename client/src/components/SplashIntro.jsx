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
        <div className="flex items-center gap-5">
          <img
            src="/velora-icon.svg"
            alt="Velora"
            style={{
              width: 56,
              height: 56,
              filter: 'drop-shadow(0 0 24px rgba(37,99,235,0.95)) drop-shadow(0 0 60px rgba(37,99,235,0.4))',
            }}
          />
          <span
            style={{
              fontFamily: 'Satoshi, system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(3.5rem, 10vw, 6.5rem)',
              letterSpacing: '0.22em',
              lineHeight: 1,
              background: 'linear-gradient(160deg, #ffffff 0%, #c8d8ff 35%, #ffffff 55%, #ddeeff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(37,99,235,0.5))',
            }}
          >
            VELORA
          </span>
        </div>

        {/* Film-style tag line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.2)' }} />
          <p
            style={{
              fontFamily: 'Satoshi, system-ui, sans-serif',
              fontSize: '0.6rem',
              letterSpacing: '0.5em',
              color: 'rgba(180,200,255,0.5)',
              textTransform: 'uppercase',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Stream Anything
          </p>
          <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.2)' }} />
        </div>
      </motion.div>
    </>
  );
}
