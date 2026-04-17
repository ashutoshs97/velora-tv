import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Play, Plus, Share2, Award, CheckCircle2,
  Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import {
  fetchTrendingTV, fetchTopRatedTV, fetchPopularTV, fetchHistory,
  fetchOnAirTV, fetchByGenre, fetchByMood, fetchSimilar, fetchTVDetail
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

export default function Shows() {
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

    const loadPopular = async () => {
      } catch {
      }
    };

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

    const loadNewReleases = async () => {
      try {
        const res = await fetchOnAirTV();
        if (!cancelled) setNewReleases(res.data?.results || []);
      } catch {
        if (!cancelled) setNewReleases([]);
      } finally {
        if (!cancelled) setLoadingNew(false);
      }
    };

    loadPopular();
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
          TV Shows
        </h1>
        <p className="text-prime-subtext font-medium mt-3 text-lg max-w-2xl">
          Binge your favorite series, discover trending exclusives, and catch up on new seasonal releases.
        </p>
      </div>

      {/* ── Content Swimlanes ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20 space-y-14 mt-8">

        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <RecentlyWatched history={history} onRefresh={loadHistory} />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <CarouselRow
            title="Trending Series"
            badge="Popular"
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



        <div className="animate-fade-up" style={{ animationDelay: '0.7s' }}>
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

        {/* ── Bottom ambient glow ── */}
        <div className="pointer-events-none absolute bottom-0 right-1/4 w-[700px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(ellipse, rgba(0,180,255,0.2) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

    </motion.div>
  );
}