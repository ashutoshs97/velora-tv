import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';
const PLACEHOLDER = 'https://via.placeholder.com/780x439/1A242F/8197A4?text=Velora';

export default function MovieCard({ movie }) {
  const year = movie.release_date?.substring(0, 4) || movie.year || '';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '';
  const imgUrl = movie.backdrop_path || movie.backdropPath
    ? `${BACKDROP_BASE}${movie.backdrop_path || movie.backdropPath}`
    : PLACEHOLDER;

  const id = movie.tmdbId || movie.id;
  const isTv = movie.media_type === 'tv' || movie.type === 'tv' || movie.name; // TV shows use 'name' instead of 'title'
  const watchLink = `/watch/${id}${isTv ? '?type=tv' : '?type=movie'}`;
  const title = movie.title || movie.name;

  return (
    <div className="movie-card-container group">
      <div className="movie-card-inner">
        <img
          src={imgUrl}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => { e.target.src = PLACEHOLDER; }}
        />
        
        {/* Play icon overlay that appears immediately on hover (before expansion) */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link to={watchLink} className="bg-white text-black p-3 rounded-full hover:scale-110 transition-transform">
            <Play size={20} fill="#000" className="ml-0.5" />
          </Link>
        </div>

        {/* Prime Video style metadata overlay (slides up after delay) */}
        <div className="movie-card-meta">
          <Link to={watchLink} className="block">
            <h3 className="font-bold text-white text-sm sm:text-base line-clamp-1 mb-1 shadow-black drop-shadow-md">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-prime-subtext uppercase tracking-wide">
              {year && <span>{year}</span>}
              {rating && (
                <>
                  <span className="w-1 h-1 rounded-full bg-prime-subtext/50" />
                  <span className="text-white border outline outline-1 outline-white/30 px-1 rounded-sm">★ {rating}</span>
                </>
              )}
            </div>
            {movie.overview && (
              <p className="text-[11px] text-gray-300 mt-2 line-clamp-2 leading-snug">
                {movie.overview}
              </p>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
