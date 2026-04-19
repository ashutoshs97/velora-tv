import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Star, VolumeX, Volume2, RotateCcw } from 'lucide-react';
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
  { id: 1, label: 'Action' },
  { id: 22, label: 'Romance' },
  { id: 10, label: 'Fantasy' },
  { id: 24, label: 'Sci-Fi' },
  { id: 37, label: 'Supernatural' },
  { id: 40, label: 'Psychological' },
  { id: 2, label: 'Adventure' },
  { id: 4, label: 'Comedy' },
  { id: 8, label: 'Drama' },
  { id: 36, label: 'Slice of Life' },
  { id: 7, label: 'Mystery' },
  { id: 14, label: 'Horror' },
  { id: 30, label: 'Sports' },
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
    trailer_youtube_id: anime.trailer?.youtube_id,
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
      .then((res) => { if (!cancelled) setItems(toAnimeItems(res)); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiCall]);
  return { items, loading };
}

const stableFetchAnimeTrending = fetchAnimeTrending;
const stableFetchAnimeTop = fetchAnimeTop;
const stableFetchAnimePopular = fetchAnimePopular;
const stableFetchAnimeAiring = fetchAnimeAiring;
const stableFetchAnimeUpcoming = fetchAnimeUpcoming;
const stableFetchAnimeMovies = fetchAnimeMovies;
const stableFetchAnimeOVA = fetchAnimeOVA;
const stableFetchAnimeAcclaimed = fetchAnimeAcclaimed;
const stableFetchAnimeShort = fetchAnimeShort;

export default function Anime() {
  // load trending first — hero depends on it
  const trending = useAnimeCollection(stableFetchAnimeTrending);

  // load rest only after trending is done to avoid Jikan rate limits
  const [secondaryReady, setSecondaryReady] = useState(false);
  useEffect(() => {
    if (!trending.loading) setSecondaryReady(true);
  }, [trending.loading]);

  const noopFetch = useCallback(async () => ({ data: { data: [] } }), []);
  const top = useAnimeCollection(secondaryReady ? stableFetchAnimeTop : noopFetch);
  const popular = useAnimeCollection(secondaryReady ? stableFetchAnimePopular : noopFetch);
  const airing = useAnimeCollection(secondaryReady ? stableFetchAnimeAiring : noopFetch);
  const upcoming = useAnimeCollection(secondaryReady ? stableFetchAnimeUpcoming : noopFetch);
  const movies = useAnimeCollection(secondaryReady ? stableFetchAnimeMovies : noopFetch);
  const ova = useAnimeCollection(secondaryReady ? stableFetchAnimeOVA : noopFetch);
  const acclaimed = useAnimeCollection(secondaryReady ? stableFetchAnimeAcclaimed : noopFetch);
  const shorts = useAnimeCollection(secondaryReady ? stableFetchAnimeShort : noopFetch);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [genreItems, setGenreItems] = useState([]);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const autoAdvanceRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerActive, setTrailerActive] = useState(false);
  const [trailerEnded, setTrailerEnded] = useState(false);
  const [trailerMuted, setTrailerMuted] = useState(true);
  const trailerTimerRef = useRef(null);
  const replayTimerRef = useRef(null);
  const trailerIframeRef = useRef(null);

  const heroItems = useMemo(
    () => trending.items.filter((item) => item.animeImage).slice(0, 6),
    [trending.items]
  );
  const heroAnime = heroItems[heroIndex] || null;
  const hasHero = heroItems.length > 0 && heroAnime;

  const goToSlide = useCallback((index) => { setHeroIndex(index); }, []);

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
      .then((res) => { if (!cancelled) setGenreItems(toAnimeItems(res)); })
      .catch(() => { if (!cancelled) setGenreItems([]); })
      .finally(() => { if (!cancelled) setLoadingGenre(false); });
    return () => { cancelled = true; };
  }, [selectedGenre]);

  useEffect(() => {
    clearInterval(autoAdvanceRef.current);
    if (!heroItems.length) return;
    if (trailerActive && !trailerEnded) return;
    autoAdvanceRef.current = setInterval(nextSlide, 10000);
    return () => clearInterval(autoAdvanceRef.current);
  }, [heroItems.length, nextSlide, trailerActive, trailerEnded]);

  useEffect(() => {
    setTrailerKey(null);
    setTrailerActive(false);
    setTrailerEnded(false);
    setTrailerMuted(true);
    clearTimeout(trailerTimerRef.current);
    if (!heroAnime?.trailer_youtube_id) return;
    setTrailerKey(heroAnime.trailer_youtube_id);
    let cancelled = false;
    trailerTimerRef.current = setTimeout(() => {
      if (!cancelled) setTrailerActive(true);
    }, 5000);
    return () => {
      cancelled = true;
      clearTimeout(trailerTimerRef.current);
    };
  }, [heroAnime]);

  const replayTrailer = useCallback(() => {
    clearTimeout(replayTimerRef.current);
    setTrailerEnded(false);
    setTrailerActive(false);
    replayTimerRef.current = setTimeout(() => setTrailerActive(true), 100);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(replayTimerRef.current);
      clearTimeout(trailerTimerRef.current);
      clearInterval(autoAdvanceRef.current);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setTrailerMuted((m) => {
      const newMuted = !m;
      try {
        const iframe = trailerIframeRef.current;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: newMuted ? 'mute' : 'unMute' }),
            'https://www.youtube.com'
          );
        }
      } catch { /* silent */ }
      return newMuted;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      {/* hero — shows loading state or actual hero */}
      {(hasHero || trending.loading) && (
        <section
          className="relative w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[620px] overflow-hidden -mt-20 pt-4"
          style={{ clipPath: 'inset(0)' }}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            touchEndX.current = e.changedTouches[0].clientX;
            const diff = touchStartX.current - touchEndX.current;
            if (Math.abs(diff) > 50) {
              diff > 0 ? nextSlide() : prevSlide();
            }
          }}
        >
          {/* loading placeholder */}
          {trending.loading && !hasHero && (
            <div className="absolute inset-0 bg-[#0d1117]" />
          )}

          {/* backdrop */}
          {hasHero && (
            <AnimatePresence initial={false}>
              {(!trailerActive || trailerEnded) && (
                <motion.div
                  key={`bg-${heroIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0 w-full h-full"
                >
                  <img
                    src={heroAnime.animeImage}
                    alt={heroAnime.title}
                    className="w-full h-full object-cover opacity-75 scale-[1.06]"
                    style={{ objectPosition: '50% 20%' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* trailer */}
          {hasHero && (
            <AnimatePresence>
              {trailerActive && trailerKey && !trailerEnded && (
                <motion.div
                  key="trailer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.5, ease: 'easeInOut' }}
                  className="absolute inset-0 w-full h-full"
                >
                  <iframe
                    ref={trailerIframeRef}
                    src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    className="w-full h-full"
                    style={{ border: 'none', pointerEvents: 'none' }}
                    title="Hero Trailer"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* gradients */}
          <div className="absolute inset-0 bg-hero-gradient-x opacity-95 z-[1] pointer-events-none" />
          <div className="absolute inset-0 bg-hero-gradient-y z-[1] pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#080E14]/90 to-transparent pointer-events-none z-[1]" />

          {/* hero content — only when data is ready */}
          {hasHero && (
            <div className="relative z-10 w-full min-h-[75vh] sm:min-h-[85vh] lg:min-h-[620px] flex flex-col justify-end pt-36 pb-32 sm:pb-36 lg:pb-32">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
                <div className="w-full md:w-3/4 lg:w-[58%]">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[13px] font-bold text-red-300 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20 uppercase tracking-[0.18em]">
                      🎌 Seasonal Spotlight
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

                  <AnimatePresence>
                    {(!trailerActive || trailerEnded) && heroAnime.overview && (
                      <motion.p
                        key="synopsis"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                        className="text-sm sm:text-base text-white/85 line-clamp-4 mb-7 max-w-xl font-medium leading-relaxed drop-shadow-md"
                      >
                        {heroAnime.overview}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <Link
                    to={`/anime/${heroAnime.id}`}
                    className="btn-primary text-sm sm:text-base hover:scale-105 inline-flex items-center"
                  >
                    <Play size={20} fill="#000" className="mr-1.5" /> Watch Now
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* dots and controls — only when hero is ready */}
          {hasHero && (
            <div className="absolute bottom-24 sm:bottom-[100px] left-0 right-0 z-[5] pointer-events-none">
              <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between relative">
                <div className="hidden sm:block w-10" />
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto">
                  {heroItems.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goToSlide(i)}
                      aria-label={`Slide ${i + 1}`}
                      className="group relative h-[4px] rounded-full overflow-hidden transition-all duration-300"
                      style={{ width: i === heroIndex ? 36 : 14 }}
                    >
                      <span className="absolute inset-0 bg-white/25 rounded-full" />
                      {i === heroIndex && (
                        <motion.span
                          key={heroIndex}
                          className="absolute inset-0 bg-white rounded-full origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 10, ease: 'linear' }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <div className="hidden sm:flex ml-auto items-center gap-2 pointer-events-auto">
                  {trailerKey && trailerActive && !trailerEnded && (
                    <button
                      onClick={toggleMute}
                      aria-label={trailerMuted ? 'Unmute' : 'Mute'}
                      className="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/20 text-white flex items-center justify-center hover:bg-white/15 transition-all"
                    >
                      {trailerMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                  )}
                  {trailerKey && trailerEnded && (
                    <button
                      onClick={replayTrailer}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-all"
                    >
                      <RotateCcw size={12} /> Replay
                    </button>
                  )}
                  <button
                    onClick={prevSlide}
                    aria-label="Previous"
                    className="w-10 h-10 flex-shrink-0 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    onClick={nextSlide}
                    aria-label="Next"
                    className="w-10 h-10 flex-shrink-0 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* content */}
      <div className={`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 ${(hasHero || trending.loading) ? '-mt-8 pt-4' : 'pt-28'}`}>

        {/* page title */}
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

        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <PrimeCarouselRow
            title="Trending This Season"
            badge="Seasonal"
            movies={trending.items}
            loading={trending.loading}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <PrimeCarouselRow
            title="Currently Airing"
            badge="Live"
            movies={airing.items}
            loading={airing.loading}
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
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <PrimeCarouselRow
            title="Most Popular"
            badge="Fan Favourites"
            movies={popular.items}
            loading={popular.loading}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <PrimeCarouselRow
            title="Critically Acclaimed"
            badge="Score 8.5+"
            movies={acclaimed.items}
            loading={acclaimed.loading}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Browse by Genre
            </h2>
          </div>
          <div
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                  selectedGenre.id === g.id
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-prime-subtext hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={genreItems}
            loading={loadingGenre}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <PrimeCarouselRow
            title="Upcoming Next Season"
            badge="Coming Soon"
            movies={upcoming.items}
            loading={upcoming.loading}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
          <CarouselRow
            title="Anime Movies"
            badge="Cinema"
            movies={movies.items}
            loading={movies.loading}
            usePoster
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow
            title="OVAs & Specials"
            badge="OVA"
            movies={ova.items}
            loading={ova.loading}
          />
        </div>

        <div className="animate-fade-up mb-24" style={{ animationDelay: '0.55s' }}>
          <PrimeCarouselRow
            title="Short Series & ONAs"
            badge="Short"
            movies={shorts.items}
            loading={shorts.loading}
          />
        </div>

      </div>
    </motion.div>
  );
}