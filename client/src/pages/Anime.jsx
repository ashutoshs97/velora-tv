import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import PrimeCarouselRow from '../components/PrimeCarouselRow';
import CarouselRow from '../components/CarouselRow';

const JIKAN = 'https://api.jikan.moe/v4';

// ── Jikan genre IDs ───────────────────────────────────────────────────────
const GENRES = [
  { id: 1,  label: 'Action',        emoji: '⚔️' },
  { id: 22, label: 'Romance',       emoji: '💕' },
  { id: 10, label: 'Fantasy',       emoji: '🔮' },
  { id: 24, label: 'Sci-Fi',        emoji: '🚀' },
  { id: 37, label: 'Supernatural',  emoji: '👻' },
  { id: 40, label: 'Psychological', emoji: '🧠' },
  { id: 2,  label: 'Adventure',     emoji: '🗺️' },
  { id: 4,  label: 'Comedy',        emoji: '😂' },
  { id: 8,  label: 'Drama',         emoji: '🎭' },
  { id: 36, label: 'Slice of Life', emoji: '🌸' },
  { id: 7,  label: 'Mystery',       emoji: '🕵️' },
  { id: 14, label: 'Horror',        emoji: '💀' },
  { id: 30, label: 'Sports',        emoji: '⚽' },
];

// ── Normalize Jikan data to match carousel component shape ────────────────
function norm(anime) {
  const img =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url || '';
  return {
    id: anime.mal_id,
    title: anime.title_english || anime.title || 'Unknown',
    poster_path: null,
    backdrop_path: null,
    animeImage: img,
    vote_average: anime.score || 0,
    release_date: anime.year ? `${anime.year}-01-01` : '',
    media_type: 'anime',
    episodes: anime.episodes,
    status: anime.status,
  };
}

async function jikanFetch(path) {
  const res = await fetch(`${JIKAN}${path}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  const json = await res.json();
  return (json.data || []).map(norm);
}

// ── Small hook keeps component code clean ─────────────────────────────────
function useJikan(path) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    jikanFetch(path)
      .then(data  => { if (!cancelled) setItems(data); })
      .catch(()   => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [path]);
  return { items, loading };
}

export default function Anime() {
  const trending  = useJikan('/seasons/now?limit=24');
  const top       = useJikan('/top/anime?limit=24');
  const popular   = useJikan('/anime?order_by=popularity&sort=asc&limit=24');
  const airing    = useJikan('/anime?status=airing&order_by=score&sort=desc&limit=24');
  const upcoming  = useJikan('/seasons/upcoming?limit=24');
  const movies    = useJikan('/top/anime?type=movie&limit=24');
  const ova       = useJikan('/anime?type=ova&order_by=score&sort=desc&limit=24');
  const acclaimed = useJikan('/anime?min_score=8.5&order_by=score&sort=desc&limit=24');
  const shorts    = useJikan('/anime?type=ona&order_by=score&sort=desc&limit=24');

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [genreItems, setGenreItems]       = useState([]);
  const [loadingGenre, setLoadingGenre]   = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);
    jikanFetch(`/anime?genres=${selectedGenre.id}&order_by=score&sort=desc&limit=24`)
      .then(data  => { if (!cancelled) setGenreItems(data); })
      .catch(()   => { if (!cancelled) setGenreItems([]); })
      .finally(() => { if (!cancelled) setLoadingGenre(false); });
    return () => { cancelled = true; };
  }, [selectedGenre]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      {/* ── Page Header ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-6">
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🎌</span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
                Anime
              </h1>
            </div>
            <p className="text-prime-subtext font-medium mt-1 text-lg max-w-2xl">
              Explore thousands of anime — from timeless classics to the latest seasonal releases.
            </p>
          </div>
        </div>
      </div>

      {/* ── Ambient glow behind header ── */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-10"
        style={{ background: 'radial-gradient(ellipse, rgba(255,100,100,0.4) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      {/* ── Content ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 mt-4">

        {/* 1 ── Trending This Season */}
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <PrimeCarouselRow
            title="Trending This Season"
            badge="Seasonal"
            movies={trending.items}
            loading={trending.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* 2 ── Currently Airing */}
        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <PrimeCarouselRow
            title="Currently Airing"
            badge="Live"
            movies={airing.items}
            loading={airing.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* 3 ── Top Rated All Time */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <CarouselRow
            title="Top Rated All Time"
            badge="Hall of Fame"
            movies={top.items}
            loading={top.loading}
            ranked
            usePoster
            watchPrefix="/anime"
          />
        </div>

        {/* 4 ── Most Popular */}
        <div className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <PrimeCarouselRow
            title="Most Popular"
            badge="Fan Favourites"
            movies={popular.items}
            loading={popular.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* 5 ── Critically Acclaimed (score ≥ 8.5) */}
        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <PrimeCarouselRow
            title="Critically Acclaimed"
            badge="Score 8.5+"
            movies={acclaimed.items}
            loading={acclaimed.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* 6 ── Browse by Genre */}
        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Genre</h2>
          </div>
          <div
            className="flex gap-3 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {GENRES.map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g)}
                className={`relative flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 overflow-hidden ${
                  selectedGenre.id === g.id
                    ? 'text-white shadow-[0_0_20px_rgba(255,100,100,0.4)] scale-105 border-transparent'
                    : 'text-prime-subtext bg-[#1A242F]/50 backdrop-blur-md border border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {selectedGenre.id === g.id && (
                  <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 opacity-90" />
                )}
                <span className="relative z-10">{g.emoji}</span>
                <span className="relative z-10">{g.label}</span>
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={genreItems}
            loading={loadingGenre}
            watchPrefix="/anime"
          />
        </div>

        {/* 7 ── Upcoming Next Season */}
        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <PrimeCarouselRow
            title="Upcoming Next Season"
            badge="Coming Soon"
            movies={upcoming.items}
            loading={upcoming.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* 8 ── Anime Movies */}
        <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
          <CarouselRow
            title="Anime Movies"
            badge="Cinema"
            movies={movies.items}
            loading={movies.loading}
            usePoster
            watchPrefix="/anime"
          />
        </div>

        {/* 9 ── OVAs & Specials */}
        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow
            title="OVAs & Specials"
            badge="OVA"
            movies={ova.items}
            loading={ova.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* 10 ── Short Series & ONAs */}
        <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
          <PrimeCarouselRow
            title="Short Series & ONAs"
            badge="Short"
            movies={shorts.items}
            loading={shorts.loading}
            watchPrefix="/anime"
          />
        </div>

        {/* Bottom ambient glow */}
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(255,80,80,0.25) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>
    </motion.div>
  );
}
