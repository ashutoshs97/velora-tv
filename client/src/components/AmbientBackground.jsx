import { useEffect, useRef } from 'react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

/**
 * Samples the dominant color from a movie poster via a hidden canvas,
 * then renders it as an animated radial glow behind the player.
 */
export default function AmbientBackground({ posterPath }) {
  const glowRef = useRef(null);

  useEffect(() => {
    if (!posterPath) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${POSTER_BASE}${posterPath}`;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Sample a cluster of pixels from the center of the poster
        const cx = Math.floor(img.width / 2);
        const cy = Math.floor(img.height / 3);
        const sampleSize = 12;
        let r = 0, g = 0, b = 0, count = 0;

        for (let dx = -sampleSize; dx <= sampleSize; dx += 4) {
          for (let dy = -sampleSize; dy <= sampleSize; dy += 4) {
            const data = ctx.getImageData(cx + dx, cy + dy, 1, 1).data;
            r += data[0]; g += data[1]; b += data[2]; count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Boost saturation — make the color more vivid for the glow effect
        const max = Math.max(r, g, b) || 1;
        const factor = 1.6;
        r = Math.min(255, Math.round((r / max) * max * factor));
        g = Math.min(255, Math.round((g / max) * max * factor));
        b = Math.min(255, Math.round((b / max) * max * factor));

        if (glowRef.current) {
          glowRef.current.style.background = `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${r},${g},${b},0.25) 0%, transparent 70%)`;
        }
      } catch {
        // CORS or canvas taint — silently skip
      }
    };
  }, [posterPath]);

  return (
    <div
      ref={glowRef}
      className="absolute inset-x-0 top-0 h-[600px] pointer-events-none transition-all duration-[2000ms] ease-in-out"
      aria-hidden="true"
    />
  );
}
