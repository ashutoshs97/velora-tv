import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';

const NUM_STARS = 800;

function generateStars() {
  return Array.from({ length: NUM_STARS }, () => ({
    x: (Math.random() - 0.5) * 2000,
    y: (Math.random() - 0.5) * 2000,
    z: Math.random() * 900 + 100,
    pz: 0,
  }));
}

export default function SplashIntro({ onDone }) {
  const canvasRef    = useRef(null);
  const starsRef     = useRef(generateStars());
  const animRef      = useRef(null);
  const speedRef     = useRef(3);
  const [exiting, setExiting] = useState(false);
  const logoControls = useAnimation();

  const handleDone = useCallback(() => {
    sessionStorage.setItem('velora_intro_shown', '1');
    onDone();
  }, [onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    const handleResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const stars = starsRef.current;

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 4, 10, 0.22)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const speed = speedRef.current;

      for (const star of stars) {
        star.pz = star.z;
        star.z -= speed;

        if (star.z <= 0) {
          star.x  = (Math.random() - 0.5) * 2000;
          star.y  = (Math.random() - 0.5) * 2000;
          star.z  = 1000;
          star.pz = star.z;
        }

        const sx = (star.x / star.z) * 400 + cx;
        const sy = (star.y / star.z) * 400 + cy;
        const px = (star.x / star.pz) * 400 + cx;
        const py = (star.y / star.pz) * 400 + cy;

        if (sx < 0 || sx > W || sy < 0 || sy > H) continue;

        const t    = 1 - star.z / 1000;
        const size = Math.max(0.3, t * 2.8);
        const brightness = Math.min(1, t * 1.6);

        // Blue-white color tint
        const r = Math.round(180 + brightness * 75);
        const g = Math.round(200 + brightness * 55);
        const b = 255;

        ctx.strokeStyle = `rgba(${r},${g},${b},${brightness})`;
        ctx.lineWidth   = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    // ── Animation sequence ──────────────────────────────────────────────────
    const sequence = async () => {
      // 1) Logo fades in, tiny
      await logoControls.start({
        opacity: 1,
        scale: 0.09,
        transition: { delay: 0.5, duration: 0.7, ease: 'easeOut' },
      });

      // 2) Gradually ramp up star speed
      const rampStart    = performance.now();
      const rampDuration = 1800;
      const ramp = setInterval(() => {
        const p = Math.min((performance.now() - rampStart) / rampDuration, 1);
        speedRef.current = 3 + p * p * 80; // quadratic ramp → 83 max
        if (p >= 1) clearInterval(ramp);
      }, 16);

      // 3) Logo rockets toward viewer
      await logoControls.start({
        scale: 60,
        opacity: 0,
        transition: { duration: 2.0, ease: [0.55, 0, 1, 1] },
      });

      // 4) Fade out overlay → reveal homepage
      setExiting(true);
      setTimeout(handleDone, 650);
    };

    sequence();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [logoControls, handleDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: '#02040A' }}
      animate={exiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.65, ease: 'easeInOut' }}
    >
      {/* Starfield canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Central glow pulse */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300,
          height: 300,
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo */}
      <motion.div
        className="relative z-10 select-none pointer-events-none flex items-center gap-4"
        initial={{ opacity: 0, scale: 0.09 }}
        animate={logoControls}
      >
        <img
          src="/velora-icon.svg"
          alt="Velora"
          className="w-14 h-14 sm:w-20 sm:h-20"
          style={{ filter: 'drop-shadow(0 0 20px rgba(37,99,235,0.9)) drop-shadow(0 0 60px rgba(37,99,235,0.4))' }}
        />
        <span
          style={{
            fontFamily: 'Satoshi, system-ui, sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            letterSpacing: '0.18em',
            color: '#ffffff',
            textShadow:
              '0 0 30px rgba(37,99,235,1), 0 0 80px rgba(37,99,235,0.6), 0 0 160px rgba(37,99,235,0.3)',
          }}
        >
          VELORA
        </span>
      </motion.div>
    </motion.div>
  );
}
