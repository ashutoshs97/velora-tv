import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
  const trending = useAnimeCollection(stableFetchAnimeTrending);

  // load rest after trending to respect Jikan rate limits
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

  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);
    fetchAnimeGenre(selectedGenre.id)
      .then((res) => { if (!cancelled) setGenreItems(toAnimeItems(res)); })
      .catch(() => { if (!cancelled) setGenreItems([]); })
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
      {/* page header */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
          Anime
        </h1>
        <p className="text-prime-subtext font-medium mt-3 text-lg max-w-2xl">
          Explore thousands of anime from timeless classics to the latest seasonal releases.
        </p>
      </div>

      {/* content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 mt-8">

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