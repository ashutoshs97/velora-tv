import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

export default function AnimeCard({ anime }) {
  const id = anime.mal_id || anime.animeId;
  const title = anime.title_english || anime.title || 'Unknown Anime';
  const imgUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.animeImage;
  const watchLink = `/anime/${id}`;

  return (
    <div className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 border border-white/10 transition-all hover:scale-105 hover:border-prime-blue hover:shadow-[0_0_20px_rgba(37,99,235,0.3)]">
      <img
        src={imgUrl}
        alt={title}
        className="w-full h-full object-cover"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Link to={watchLink} className="absolute inset-0 flex items-center justify-center">
          <div className="bg-prime-blue/80 backdrop-blur-sm text-white p-4 rounded-full transition-transform hover:scale-110">
            <Play size={24} fill="currentColor" className="ml-1" />
          </div>
        </Link>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">
            {title}
          </h3>
          {anime.broadcast?.time && (
            <p className="text-xs text-prime-blue font-semibold mt-1">
              {anime.broadcast.time} JST
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
