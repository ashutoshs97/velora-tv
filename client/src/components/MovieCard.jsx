import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

// ── Local SVG placeholder — no third party needed ─────────────────────────
const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='780' height='439' viewBox='0 0 780 439'%3E%3Crect width='780' height='439' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

// ── Safe media type detection ─────────────────────────────────────────────
function getSafeType(movie) {
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

export default function MovieCard({ movie }) {
  const [imgError, setImgError] = useState(false);

  // ── Safe value extraction ─────────────────────────────────────────────
  const year = movie.release_date?.substring(0, 4)
    || movie.first_air_date?.substring(0, 4)
    || movie.year
    || '';

  // Only show rating if meaningful (above 0)
  const rating = movie.vote_average > 0
    ? Number(movie.vote_average).toFixed(1)
    : '';

  // ── Safe image source ─────────────────────────────────────────────────
  const rawPath = movie.backdrop_path || movie.backdropPath;
  const imgUrl = imgError || !rawPath
    ? PLACEHOLDER_SVG
    : `${BACKDROP_BASE}${rawPath}`;

  // ── Safe ID and watch link ────────────────────────────────────────────
  const id = movie.tmdbId || movie.id;
  const mediaType = getSafeType(movie);
  const watchLink = id
    ? `/watch/${id}?type=${mediaType}`
    : '/';  // fallback to home if no id

  const title = movie.title || movie.name || 'Untitled';

  return (
    <div className="movie-card-container group">
      <div className="movie-card-inner">
        <img
          src={imgUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)} // ← local state, no chain dependency
        />

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {id ? (
            <Link
              to={watchLink}
              className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform"
              aria-label={`Play ${title}`}
            >
              <Play size={20} fill="#000" className="ml-0.5" />
            </Link>
          ) : (
            <div className="bg-white/20 text-white p-3 rounded-full">
              <Play size={20} fill="white" className="ml-0.5" />
            </div>
          )}
        </div>

        {/* Metadata overlay */}
        <div className="movie-card-meta">
          {id ? (
            <Link to={watchLink} className="block">
              <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 mb-1 drop-shadow-md">
                {title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-prime-subtext uppercase tracking-wide">
                {year && <span>{year}</span>}
                {rating && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-prime-subtext/50" />
                    <span className="text-white border outline outline-1 outline-white/30 px-1 rounded-sm">
                      ★ {rating}
                    </span>
                  </>
                )}
              </div>
              {movie.overview && (
                <p className="text-[11px] text-gray-300 mt-2 line-clamp-2 leading-snug">
                  {movie.overview}
                </p>
              )}
            </Link>
          ) : (
            // No ID — render without link
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 mb-1 drop-shadow-md">
                {title}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}