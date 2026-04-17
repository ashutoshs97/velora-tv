import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Plus, Share2, Award, CheckCircle2,
  Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import {
  fetchTrending, fetchTopRated, fetchHistory,
  fetchNewReleases, fetchByGenre, fetchByMood, fetchSimilar, fetchMovieDetail
} from '../api';
import CarouselRow from '../components/CarouselRow';
import PrimeCarouselRow from '../components/PrimeCarouselRow';
import RecentlyWatched from '../components/RecentlyWatched';

const GENRES = [
  { id: 28, label: 'Action' }, { id: 35, label: 'Comedy' },
  { id: 18, label: 'Drama' }, { id: 27, label: 'Horror' },
  { id: 878, label: 'Sci-Fi' }, { id: 10749, label: 'Romance' },
  { id: 16, label: 'Animation' }, { id: 99, label: 'Documentary' },
  { id: 53, label: 'Thriller' }, { id: 10751, label: 'Family' },
];

const MOODS = [
  { key: 'action', emoji: '💥', label: 'Adrenaline Rush' },
  { key: 'comedy', emoji: '😂', label: 'Feel-Good Vibes' },
  { key: 'horror', emoji: '👻', label: 'Late Night Scare' },
  { key: 'romance', emoji: '💕', label: 'Date Night' },
  { key: 'scifi', emoji: '🚀', label: 'Mind-Bending' },
  { key: 'animated', emoji: '✨', label: 'Family Fun' },
];

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ── Safe media type helper ────────────────────────────────────────────────
function getSafeType(movie) {
  if (!movie) return 'movie';
  if (movie.media_type === 'tv') return 'tv';
  if (movie.media_type === 'movie') return 'movie';
  if (movie.type === 'tv') return 'tv';
  if (movie.name && !movie.title) return 'tv';
  return 'movie';
}

export default function Movies() {
  // ── Data states ───────────────────────────────────────────────────────
  const [trending, setTrending] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [history, setHistory] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [moodMovies, setMoodMovies] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [becauseTitle, setBecauseTitle] = useState('');

  // ── Loading states ────────────────────────────────────────────────────
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);

  // ── Filter/selection states ───────────────────────────────────────────
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);


  // ── History loader ────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchHistory();
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch {
      // DB unavailable — history stays empty, app still works
      setHistory([]);
    }
  }, []);

  // ── Initial data load ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const loadTrending = async () => {
      try {
        const res = await fetchTrending();
        if (cancelled) return;
        const movies = res.data?.results || [];
        setTrending(movies);
      } catch {
        if (!cancelled) setTrending([]);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    };

    const loadTopRated = async () => {
      try {
        const res = await fetchTopRated();
        if (!cancelled) setTopRated(res.data?.results || []);
      } catch {
        if (!cancelled) setTopRated([]);
      } finally {
        if (!cancelled) setLoadingTopRated(false);
      }
    };

    const loadNewReleases = async () => {
      try {
        const res = await fetchNewReleases();
        if (!cancelled) setNewReleases(res.data?.results || []);
      } catch {
        if (!cancelled) setNewReleases([]);
      } finally {
        if (!cancelled) setLoadingNew(false);
      }
    };

    loadTrending();
    loadTopRated();
    loadNewReleases();
    loadHistory();

    return () => { cancelled = true; };
  }, [loadHistory]);

  // ── Genre movies ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);
    fetchByGenre(selectedGenre.id)
      .then(res => {
        if (!cancelled) setGenreMovies(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setGenreMovies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingGenre(false);
      });
    return () => { cancelled = true; };
  }, [selectedGenre]);

  // ── Mood movies ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoadingMood(true);
    fetchByMood(selectedMood.key)
      .then(res => {
        if (!cancelled) setMoodMovies(res.data?.results || []);
      })
      .catch(() => {
        if (!cancelled) setMoodMovies([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingMood(false);
      });
    return () => { cancelled = true; };
  }, [selectedMood]);

  // ── Because You Watched ───────────────────────────────────────────────
  useEffect(() => {
    if (!history?.length) return;
    let cancelled = false;
    const latest = history[0];
    if (!latest?.tmdbId) return;

    setBecauseTitle(latest.title || 'your last watch');
    fetchSimilar(latest.tmdbId, latest.type || 'movie')
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
      {/* ── Page Header ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-32 pb-4">
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-display">
          Movies
        </h1>
        <p className="text-prime-subtext font-medium mt-3 text-lg max-w-2xl">
          Explore our extensive catalog of blockbuster hits, critically acclaimed masterpieces, and hidden gems.
        </p>
      </div>

      {/* ── Content Swimlanes ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 mt-8">

        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <RecentlyWatched history={history} onRefresh={loadHistory} />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <CarouselRow
            title="Top 10 Movies"
            badge="Trending"
            movies={trending}
            loading={loadingTrending}
            ranked
            usePoster
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow
            title="Critically Acclaimed"
            badge="Top Rated"
            movies={topRated}
            loading={loadingTopRated}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <PrimeCarouselRow
            title="Fresh Drops"
            badge="New This Month"
            movies={newReleases}
            loading={loadingNew}
          />
        </div>

        {becauseYouWatched.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.75s' }}>
            <CarouselRow
              title={`Because You Watched "${becauseTitle}"`}
              movies={becauseYouWatched}
              usePoster
            />
          </div>
        )}

        {/* Browse by Genre */}
        <div className="animate-fade-up" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Browse by Genre
            </h2>
          </div>
          {/* Horizontally scrollable genre pills */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGenre(g)}
                className={`relative flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
                  selectedGenre.id === g.id
                    ? 'text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border-transparent scale-105'
                    : 'text-prime-subtext bg-[#1A242F]/50 backdrop-blur-md border border-white/10 hover:border-white/30 hover:text-white hover:bg-[#1A242F]/80'
                }`}
              >
                {selectedGenre.id === g.id && (
                  <span className="absolute inset-0 bg-gradient-to-r from-prime-blue to-blue-500 opacity-90" />
                )}
                <span className="relative z-10">{g.label}</span>
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={genreMovies}
            loading={loadingGenre}
          />
        </div>

        {/* Mood Collections */}
        <div className="mb-24 animate-fade-up" style={{ animationDelay: '0.85s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              What's Your Mood?
            </h2>
          </div>
          {/* Horizontally scrollable mood pills */}
          <div className="flex gap-3 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {MOODS.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMood(m)}
                className={`relative flex-shrink-0 flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
                  selectedMood.key === m.key
                    ? 'text-white shadow-[0_0_20px_rgba(0,180,255,0.4)] border-transparent scale-105'
                    : 'text-prime-subtext bg-[#1A242F]/50 backdrop-blur-md border border-white/10 hover:border-white/30 hover:text-white hover:bg-[#1A242F]/80'
                }`}
              >
                {selectedMood.key === m.key && (
                  <span className="absolute inset-0 bg-gradient-to-r from-prime-blue to-blue-500 opacity-90" />
                )}
                <span className="relative z-10 text-base">{m.emoji}</span>
                <span className="relative z-10">{m.label}</span>
              </button>
            ))}
          </div>
          <PrimeCarouselRow
            title=""
            movies={moodMovies}
            loading={loadingMood}
          />
        </div>

        {/* ── Bottom ambient glow ── */}
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(0,180,255,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

    </motion.div>
  );
}