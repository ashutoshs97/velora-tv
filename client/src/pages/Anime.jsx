import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star } from 'lucide-react';
import PrimeCarouselRow from '../components/PrimeCarouselRow';
import CarouselRow from '../components/CarouselRow';
import {
  fetchAnimeAcclaimed,
  fetchAnimeAiring,
  fetchAnimeGenre,
  fetchAnimeMovies,
  fetchAnimeOVA,
  fetchAnimePopular,
  fetchAnimeShort,
  fetchAnimeTop,
  fetchAnimeTrending,
  fetchAnimeUpcoming,
} from '../api';

const GENRES = [
  { id: 1, label: 'Action', emoji: '⚔️' },
  { id: 22, label: 'Romance', emoji: '💕' },
  { id: 10, label: 'Fantasy', emoji: '🔮' },
  { id: 24, label: 'Sci-Fi', emoji: '🚀' },
  { id: 37, label: 'Supernatural', emoji: '👻' },
  { id: 40, label: 'Psychological', emoji: '🧠' },
  { id: 2, label: 'Adventure', emoji: '🗺️' },
  { id: 4, label: 'Comedy', emoji: '😂' },
  { id: 8, label: 'Drama', emoji: '🎭' },
  { id: 36, label: 'Slice of Life', emoji: '🌸' },
  { id: 7, label: 'Mystery', emoji: '🕵️' },
  { id: 14, label: 'Horror', emoji: '💀' },
  { id: 30, label: 'Sports', emoji: '⚽' },
];

function norm(anime) {
  const img =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    '';

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
    overview: anime.synopsis?.replace('[Written by MAL Rewrite]', '').trim() || '',
  };
}

function toAnimeItems(response) {
  return (response?.data?.data || []).map(norm);
}

function useAnimeCollection(apiCall) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiCall()
      .then((response) => {
        if (!cancelled) setItems(toAnimeItems(response));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiCall]);

  return { items, loading };
}

export default function Anime() {
  const trending = useAnimeCollection(fetchAnimeTrending);
  const top = useAnimeCollection(fetchAnimeTop);
  const popular = useAnimeCollection(fetchAnimePopular);
  const airing = useAnimeCollection(fetchAnimeAiring);
  const upcoming = useAnimeCollection(fetchAnimeUpcoming);
  const movies = useAnimeCollection(fetchAnimeMovies);
  const ova = useAnimeCollection(fetchAnimeOVA);
  const acclaimed = useAnimeCollection(fetchAnimeAcclaimed);
  const shorts = useAnimeCollection(fetchAnimeShort);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [genreItems, setGenreItems] = useState([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const autoAdvanceRef = useRef(null);

  const heroItems = useMemo(
    () => trending.items.filter((item) => item.animeImage).slice(0, 6),
    [trending.items]
  );

  const heroAnime = heroItems[heroIndex] || null;

  const goToSlide = useCallback((index) => {
    setHeroIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    if (!heroItems.length) return;
    setHeroIndex((prev) => (prev + 1) % heroItems.length);
  }, [heroItems.length]);

  const prevSlide = useCallback(() => {
    if (!heroItems.length) return;
    setHeroIndex((prev) => (prev - 1 + heroItems.length) % heroItems.length);
  }, [heroItems.length]);

  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);

    fetchAnimeGenre(selectedGenre.id)
      .then((response) => {
        if (!cancelled) setGenreItems(toAnimeItems(response));
      })
      .catch(() => {
        if (!cancelled) setGenreItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGenre(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGenre]);

  useEffect(() => {
    setHeroIndex(0);
  }, [heroItems.length]);

  useEffect(() => {
    clearInterval(autoAdvanceRef.current);
    if (!heroItems.length) return undefined;

    autoAdvanceRef.current = setInterval(nextSlide, 9000);
    return () => clearInterval(autoAdvanceRef.current);
  }, [heroItems.length, nextSlide]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      {heroAnime && (
        <section className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[620px] overflow-hidden -mt-20 pt-4">
          <div className="absolute inset-0">
            <img
              src={heroAnime.animeImage}
              alt={heroAnime.title}
              className="w-full h-full object-cover object-top opacity-75 scale-[1.06]"
            />
          </div>

          <div className="absolute inset-0 bg-hero-gradient-x opacity-95 z-[1] pointer-events-none" />
          <div className="absolute inset-0 bg-hero-gradient-y z-[1] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#080E14]/90 to-transparent pointer-events-none z-[1]" />

          <div className="relative z-10 w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[620px] flex flex-col justify-end pt-28 pb-20 sm:pb-28">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
              <div className="w-full md:w-3/4 lg:w-[58%]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl sm:text-4xl">🎌</span>
                  <span className="text-[13px] font-bold text-red-300 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 uppercase tracking-[0.18em]">
                    Seasonal Spotlight
                  </span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-[1.12] tracking-[-0.025em] drop-shadow-2xl line-clamp-3 font-display pb-2">
                  {heroAnime.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
                  <span className="text-[13px] font-bold text-red-300 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur border border-white/10">
                    Trending This Season
                  </span>
                  {heroAnime.release_date && (
                    <span className="text-[15px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                      {heroAnime.release_date.substring(0, 4)}
                    </span>
                  )}
                  {heroAnime.vote_average > 0 && (
                    <div className="flex items-center gap-1 text-[15px] font-bold text-yellow-400 border-l border-white/20 pl-4">
                      <Star size={16} fill="currentColor" />
                      <span>{Number(heroAnime.vote_average).toFixed(1)}</span>
                    </div>
                  )}
                  {heroAnime.episodes && (
                    <span className="text-[15px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                      {heroAnime.episodes} Episodes
                    </span>
                  )}
                </div>

                {heroAnime.overview && (
                  <p className="text-sm sm:text-base text-white/85 line-clamp-4 mb-7 max-w-xl font-medium leading-relaxed drop-shadow-md">
                    {heroAnime.overview}
                  </p>
                )}

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <Link
                    to={`/anime/${heroAnime.id}`}
                    className="btn-primary text-sm sm:text-base hover:scale-105"
                  >
                    <Play size={20} fill="#000" className="mr-1.5" /> Watch Now
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[88px] sm:bottom-[100px] left-0 right-0 z-20">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between relative">
              <div className="w-10 hidden sm:block" />
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                {heroItems.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goToSlide(i)}
                    aria-label={`Go to anime slide ${i + 1}`}
                    className="group relative h-[4px] rounded-full overflow-hidden transition-all duration-300 shadow-sm"
                    style={{ width: i === heroIndex ? 36 : 14 }}
                  >
                    <span className="absolute inset-0 bg-white/25 rounded-full" />
                    {i === heroIndex && (
                      <motion.span
                        key={heroIndex}
                        className="absolute inset-0 bg-white rounded-full origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 9, ease: 'linear' }}
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  aria-label="Previous anime"
                  className="w-9 h-9 flex-shrink-0 rounded-full bg-black/40 backdrop-blur border border-white/12 text-white flex items-center justify-center hover:bg-white/15 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next anime"
                  className="w-9 h-9 flex-shrink-0 rounded-full bg-black/40 backdrop-blur border border-white/12 text-white flex items-center justify-center hover:bg-white/15 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 pb-6">
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">🎌</span>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
                Anime
              </h1>
            </div>
            <p className="text-prime-subtext font-medium mt-1 text-lg max-w-2xl">
              Explore thousands of anime from timeless classics to the latest seasonal releases.
            </p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] opacity-10"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,100,100,0.4) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 mt-4">
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <PrimeCarouselRow
            title="Trending This Season"
            badge="Seasonal"
            movies={trending.items}
            loading={trending.loading}
            watchPrefix="/anime"
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <PrimeCarouselRow
            title="Currently Airing"
            badge="Live"
            movies={airing.items}
            loading={airing.loading}
            watchPrefix="/anime"
          />
        </div>

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

        <div className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <PrimeCarouselRow
            title="Most Popular"
            badge="Fan Favourites"
            movies={popular.items}
            loading={popular.loading}
            watchPrefix="/anime"
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <PrimeCarouselRow
            title="Critically Acclaimed"
            badge="Score 8.5+"
            movies={acclaimed.items}
            loading={acclaimed.loading}
            watchPrefix="/anime"
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Genre</h2>
          </div>
          <div
            className="flex gap-3 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {GENRES.map((g) => (
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

        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <PrimeCarouselRow
            title="Upcoming Next Season"
            badge="Coming Soon"
            movies={upcoming.items}
            loading={upcoming.loading}
            watchPrefix="/anime"
          />
        </div>

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

        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow
            title="OVAs & Specials"
            badge="OVA"
            movies={ova.items}
            loading={ova.loading}
            watchPrefix="/anime"
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
          <PrimeCarouselRow
            title="Short Series & ONAs"
            badge="Short"
            movies={shorts.items}
            loading={shorts.loading}
            watchPrefix="/anime"
          />
        </div>

        <div
          className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[300px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(ellipse, rgba(255,80,80,0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>
    </motion.div>
  );
}
