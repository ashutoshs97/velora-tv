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
              width: 60,
              height: 60,
              filter: 'drop-shadow(0 0 28px rgba(37,99,235,1)) drop-shadow(0 0 70px rgba(37,99,235,0.45))',
            }}
          />
          <span
            style={{
              fontFamily: '"Cinzel", Georgia, serif',
              fontWeight: 900,
              fontSize: 'clamp(3.8rem, 11vw, 7rem)',
              letterSpacing: '0.28em',
              lineHeight: 1,
              background: 'linear-gradient(170deg, #f0f4ff 0%, #c2d5ff 25%, #ffffff 50%, #a8c4f8 75%, #e8efff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 24px rgba(37,99,235,0.55)) drop-shadow(0 0 80px rgba(37,99,235,0.2))',
              WebkitTextStroke: '0px transparent', // reset
            }}
          >
            VELORA
          </span>
        </div>

        {/* Film-style tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(140,170,255,0.4))' }} />
          <p
            style={{
              fontFamily: '"Cinzel", Georgia, serif',
              fontSize: '0.55rem',
              letterSpacing: '0.6em',
              color: 'rgba(160,190,255,0.45)',
              textTransform: 'uppercase',
              fontWeight: 900,
              margin: 0,
            }}
          >
            Stream Anything
          </p>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, rgba(140,170,255,0.4), transparent)' }} />
        </div>
      </motion.div>
    </>
  );
}
