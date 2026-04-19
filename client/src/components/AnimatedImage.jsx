import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnimatedImage({ src, alt, className, fallbackSrc, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const displaySrc = error && fallbackSrc ? fallbackSrc : src;

  return (
    <motion.img
      src={displaySrc}
      alt={alt}
      className={className}
      initial={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
      animate={
        loaded 
          ? { opacity: 1, scale: 1, filter: 'blur(0px)' } 
          : { opacity: 0, scale: 1.05, filter: 'blur(8px)' }
      }
      transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        if (!error && fallbackSrc) {
          setError(true);
        } else if (props.onError) {
          props.onError(e);
        }
        setLoaded(true);
      }}
      loading="lazy"
      {...props}
    />
  );
}
