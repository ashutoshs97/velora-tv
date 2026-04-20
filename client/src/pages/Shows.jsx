import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  fetchTrendingTV, fetchTopRatedTV, fetchOnAirTV,
  fetchByGenre, fetchByMood, fetchSimilar
} from '../api';
import CarouselRow from '../components/CarouselRow';
import PrimeCarouselRow from '../components/PrimeCarouselRow';
import RecentlyWatched from '../components/RecentlyWatched';
import { getHistory } from '../utils/watchHistory';

const GENRES = [
  { id: 10759, label: 'Action & Adventure' },
  { id: 35, label: 'Comedy' },
  { id: 18, label: 'Drama' },
  { id: 9648, label: 'Mystery' },
  { id: 10765, label: 'Sci-Fi & Fantasy' },
  { id: 80, label: 'Crime' },
  { id: 10751, label: 'Family' },
  { id: 10762, label: 'Kids' },
  { id: 10764, label: 'Reality' },
  { id: 10767, label: 'Talk' },
];

const MOODS = [
  { key: 'action', label: 'Action' },
  { key: 'comedy', label: 'Comedy' },
  { key: 'horror', label: 'Horror' },
  { key: 'romance', label: 'Romance' },
  { key: 'scifi', label: 'Sci-Fi' },
  { key: 'animated', label: 'Animated' },
];

function getHistoryType(item) {
  if (!item) return 'tv';
  if (item.type === 'tv') return 'tv';
  if (item.media_type === 'tv') return 'tv';
  return 'tv';
}

export default function Shows() {
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [history, setHistory] = useState([]);
  const [onAir, setOnAir] = useState([]);
  const [genreShows, setGenreShows] = useState([]);
  const [moodShows, setMoodShows] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [becauseTitle, setBecauseTitle] = useState('');

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingOnAir, setLoadingOnAir] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);

  const loadHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      try {
        const res = await fetchTrendingTV();
        if (!cancelled) setTrending(res.data?.results || []);
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    };

    const loadTopRated = async () => {
      try {
        const res = await fetchTopRatedTV();
        if (!cancelled) setTopRated(res.data?.results || []);
      } catch {
        if (!cancelled) setTopRated([]);
      } finally {
        if (!cancelled) setLoadingTopRated(false);
      }
    };

    const loadOnAir = async () => {
      try {
        const res = await fetchOnAirTV();
        if (!cancelled) setOnAir(res.data?.results || []);
      } catch {
        if (!cancelled) setOnAir([]);
      } finally {
        if (!cancelled) setLoadingOnAir(false);
      }
    };

    loadTrending();
    loadTopRated();
    loadOnAir();
    loadHistory();

    return () => { cancelled = true; };
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);
    fetchByGenre(selectedGenre.id, 'tv')
      .then(res => {
        if (!cancelled) setGenreShows(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setGenreShows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGenre(false);
      });
    return () => { cancelled = true; };
  }, [selectedGenre]);

  useEffect(() => {
    let cancelled = false;
    setLoadingMood(true);
    fetchByMood(selectedMood.key)
      .then(res => {
        if (!cancelled) setMoodShows(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setMoodShows([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMood(false);
      });
    return () => { cancelled = true; };
  }, [selectedMood]);

  useEffect(() => {
    if (!history?.length) return;
    let cancelled = false;
    const latest = history[0];
    if (!latest?.tmdbId) return;

    const safeType = getHistoryType(latest);
    setBecauseTitle(latest.title || latest.name || 'your last watch');

    fetchSimilar(latest.tmdbId, safeType)
      .then(res => {
        if (!cancelled) setBecauseYouWatched(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setBecauseYouWatched([]);
      });

    return () => { cancelled = true; };
  }, [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
          TV Shows
        </h1>
        <p className="text-prime-subtext font-medium mt-3 text-lg max-w-2xl">
          Binge your favorite series, discover trending exclusives, and catch up on new releases.
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 mt-8">

        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <RecentlyWatched history={history} onRefresh={loadHistory} />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <CarouselRow
            title="Trending Series"
            badge="Popular"
            movies={trending}
            loading={loadingTrending}
            ranked
            usePoster
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <PrimeCarouselRow
            title="Critically Acclaimed"
            badge="Top Rated"
            movies={topRated}
            loading={loadingTopRated}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <PrimeCarouselRow
            title="Currently Airing"
            badge="On Air"
            movies={onAir}
            loading={loadingOnAir}
          />
        </div>

        {becauseYouWatched.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <CarouselRow
              title={`Because You Watched "${becauseTitle}"`}
              movies={becauseYouWatched}
              usePoster
            />
          </div>
        )}

        {/* browse by genre */}
        <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
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
                    ? 'bg-prime-blue text-white'
                    : 'bg-white/5 text-prime-subtext hover:text-white'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={genreShows}
            loading={loadingGenre}
          />
        </div>

        {/* browse by mood */}
        <div className="mb-24 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Browse by Mood
            </h2>
          </div>
          <div
            className="flex gap-2 mb-6 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMood(m)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${
                  selectedMood.key === m.key
                    ? 'bg-prime-blue text-white'
                    : 'bg-white/5 text-prime-subtext hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={moodShows}
            loading={loadingMood}
          />
        </div>

      </div>
    </motion.div>
  );
}