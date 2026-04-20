import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const EASE_CURTAIN = [0.76, 0, 0.24, 1];

export default function SplashIntro({ onDone }) {
  const [phase, setPhase] = useState('hold');
  const [done, setDone] = useState(false);

  const handleDone = useCallback(() => {
    sessionStorage.setItem('velora_intro_shown', '1');
    setDone(true);
    onDone?.();
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;

    const wipeTimer = setTimeout(() => {
      if (!cancelled) setPhase('wipe');
    }, 1300);

    const doneTimer = setTimeout(() => {
      if (!cancelled) handleDone();
    }, 2700);

    return () => {
      cancelled = true;
      clearTimeout(wipeTimer);
      clearTimeout(doneTimer);
    };
  }, [handleDone]);

  // nothing to render once done
  if (done) return null;

  const isWiping = phase === 'wipe';

  return (
    <>
      {/* top curtain */}
      <motion.div
        className="fixed top-0 left-0 right-0 z-[9999]"
        style={{ height: '50vh', background: '#000', originY: 0 }}
        animate={isWiping ? { y: '-100%' } : { y: '0%' }}
        transition={{ duration: 1.0, ease: EASE_CURTAIN }}
      />

      {/* bottom curtain */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[9999]"
        style={{ height: '50vh', background: '#000', originY: 1 }}
        animate={isWiping ? { y: '100%' } : { y: '0%' }}
        transition={{ duration: 1.0, ease: EASE_CURTAIN }}
      />

      {/* logo */}
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none select-none gap-3"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={
          isWiping
            ? { opacity: 0, scale: 1.08, transition: { duration: 0.45, ease: 'easeIn' } }
            : { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut', delay: 0.15 } }
        }
      >
        {/* background glow */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: -1 }}>
          <div
            style={{
              width: '80vw',
              height: '40vh',
              background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.25) 0%, rgba(37,99,235,0.05) 40%, transparent 65%)',
            }}
          />
        </div>

        {/* icon + wordmark */}
        <div className="flex items-center gap-5 relative">
          <img
            src="/velora-icon.svg"
            alt="Velora"
            width={60}
            height={60}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span
            style={{
              fontFamily: '"Clash Display", system-ui, sans-serif',
              fontWeight: 900,
              fontSize: 'clamp(3.8rem, 11vw, 7rem)',
              letterSpacing: '0.28em',
              lineHeight: 1,
              background: 'linear-gradient(170deg, #f0f4ff 0%, #c2d5ff 25%, #ffffff 50%, #a8c4f8 75%, #e8efff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            VELORA
          </span>
        </div>

        {/* tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px' }}>
          <div style={{ width: 40, height: 1, background: 'linear-gradient(90deg, transparent, rgba(140,170,255,0.4))' }} />
          <p
            style={{
              fontFamily: '"Clash Display", system-ui, sans-serif',
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