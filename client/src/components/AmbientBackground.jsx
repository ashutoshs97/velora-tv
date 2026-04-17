import { useEffect, useRef } from 'react';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w92';

export default function AmbientBackground({ posterPath }) {
  const glowRef = useRef(null);

  useEffect(() => {
    // Nothing to do if no poster
    if (!posterPath) return;

    let cancelled = false; // ← unmount guard

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Component unmounted while image was loading — stop
      if (cancelled) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // Canvas API safety check
        const ctx = canvas.getContext('2d');
        if (!ctx) return; // ← canvas not supported — skip silently

        ctx.drawImage(img, 0, 0);

        // Sample pixels from center of poster
        const cx = Math.floor(img.width / 2);
        const cy = Math.floor(img.height / 3);
        const sampleSize = 12;
        let r = 0, g = 0, b = 0, count = 0;

        for (let dx = -sampleSize; dx <= sampleSize; dx += 4) {
          for (let dy = -sampleSize; dy <= sampleSize; dy += 4) {
            // Make sure we don't sample outside canvas bounds
            const px = Math.min(Math.max(cx + dx, 0), img.width - 1);
            const py = Math.min(Math.max(cy + dy, 0), img.height - 1);
            const data = ctx.getImageData(px, py, 1, 1).data;
            r += data[0];
            g += data[1];
            b += data[2];
            count++;
          }
        }

        // Guard against zero count — prevents divide by zero
        if (count === 0) return;

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Boost saturation for vivid glow
        const max = Math.max(r, g, b) || 1;
        const factor = 1.6;
        r = Math.min(255, Math.round((r / max) * max * factor));
        g = Math.min(255, Math.round((g / max) * max * factor));
        b = Math.min(255, Math.round((b / max) * max * factor));

        // Only update DOM if still mounted and ref exists
        if (!cancelled && glowRef.current) {
          glowRef.current.style.background = `radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${r},${g},${b},0.25) 0%, transparent 70%)`;
        }

        // Clean up canvas from memory
        canvas.width = 0;
        canvas.height = 0;

      } catch {
        // CORS or canvas taint — silently skip
      }
    };

    // Handle image load failure gracefully
    img.onerror = () => {
      // Image failed to load — glow stays transparent, no crash
    };

    img.src = `${POSTER_BASE}${posterPath}`;

    // Cleanup — cancel any pending operations on unmount
    return () => {
      cancelled = true;
      img.onload = null;  // ← prevent onload firing after unmount
      img.onerror = null; // ← prevent onerror firing after unmount
      img.src = '';       // ← cancel the image request
    };
  }, [posterPath]);

  return (
    <div
      ref={glowRef}
      className="absolute inset-x-0 top-0 h-[300px] sm:h-[400px] lg:h-[600px] pointer-events-none transition-all duration-[2000ms] ease-in-out"
      aria-hidden="true"
    />
  );
}