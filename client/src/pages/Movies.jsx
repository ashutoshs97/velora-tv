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

const A24_MOVIES = [
  { id: 545611, title: "Everything Everywhere All at Once", poster_path: "/u68AjlvlutfEIcpmbYpKcdi09ut.jpg", backdrop_path: "/ss0Os3uWJfQAENILHZUdX8Tt1OC.jpg", vote_average: 7.72, release_date: "2022-03-24", media_type: "movie" },
  { id: 376867, title: "Moonlight", poster_path: "/qLnfEmPrDjJfPyyddLJPkXmshkp.jpg", backdrop_path: "/jm1oD3eB08LImSwL1LrzF9AJQ5b.jpg", vote_average: 7.4, release_date: "2016-10-21", media_type: "movie" },
  { id: 503919, title: "The Lighthouse", poster_path: "/f1tIYarTbkBdIT1aW0gzelDwknv.jpg", backdrop_path: "/sYLzRuEcwSz0L1Z92wQNrETHU9O.jpg", vote_average: 7.477, release_date: "2019-10-18", media_type: "movie" },
  { id: 473033, title: "Uncut Gems", poster_path: "/6XN1vxHc7kUSqNWtaQKN45J5x2v.jpg", backdrop_path: "/eGljNfNCrPhFYG2RXXmmE0OKu5.jpg", vote_average: 7.162, release_date: "2019-08-30", media_type: "movie" },
  { id: 785084, title: "The Whale", poster_path: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg", backdrop_path: "/46FRuCeAn6TrS4F1P4F9zhyCpyo.jpg", vote_average: 7.775, release_date: "2022-12-09", media_type: "movie" },
  { id: 929590, title: "Civil War", poster_path: "/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg", backdrop_path: "/en3GU5uGkKaYmSyetHV4csHHiH3.jpg", vote_average: 6.857, release_date: "2024-04-10", media_type: "movie" },
  { id: 760104, title: "X", poster_path: "/lopZSVtXzhFY603E9OqF7O1YKsh.jpg", backdrop_path: "/70Rm9ItxKuEKN8iu6rNjfwAYUCJ.jpg", vote_average: 6.72, release_date: "2022-03-17", media_type: "movie" },
  { id: 1138194, title: "Heretic", poster_path: "/fr96XzlzsONrQrGfdLMiwtQjott.jpg", backdrop_path: "/ag66gJCiZ06q1GSJuQlhGLi3Udx.jpg", vote_average: 6.979, release_date: "2024-10-31", media_type: "movie" },
  { id: 467244, title: "The Zone of Interest", poster_path: "/hUu9zyZmDd8VZegKi1iK1Vk0RYS.jpg", backdrop_path: "/pnTSOKcYnvdpQNQElAtJM1rWOxH.jpg", vote_average: 7.012, release_date: "2023-12-15", media_type: "movie" },
  { id: 949423, title: "Pearl", poster_path: "/z5uIG81pXyHKg7cUFIu84Wjn4NS.jpg", backdrop_path: "/8rmx3Wh6fQdSL2nzTmdFn9thcK8.jpg", vote_average: 7.233, release_date: "2022-09-16", media_type: "movie" },
  { id: 666277, title: "Past Lives", poster_path: "/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg", backdrop_path: "/7HR38hMBl23lf38MAN63y4pKsHz.jpg", vote_average: 7.714, release_date: "2023-06-02", media_type: "movie" },
  { id: 559907, title: "The Green Knight", poster_path: "/if4hw3Ou5Sav9Em7WWHj66mnywp.jpg", backdrop_path: "/kIQc0kkqIYTo65x5XjlKgqdDQ6a.jpg", vote_average: 6.604, release_date: "2021-07-29", media_type: "movie" },
  { id: 437586, title: "mid90s", poster_path: "/9Tw0Y3DK5kGIU9X1yw3Q9gCkOlb.jpg", backdrop_path: "/BOeORWljjIPGuCwUgLls24ctF3.jpg", vote_average: 7.473, release_date: "2018-10-19", media_type: "movie" },
  { id: 489925, title: "Eighth Grade", poster_path: "/xTa9cLhGHfQ7084UvoPQ2bBXKqd.jpg", backdrop_path: "/nDfZN2q1IPGaLiwAgr9sU209MU5.jpg", vote_average: 7.2, release_date: "2018-01-19", media_type: "movie" },
];

const NEON_MOVIES = [
  { id: 792307, title: "Poor Things", poster_path: "/kCGlIMHnOm8JPXSmcaY6LJ1kCuQ.jpg", backdrop_path: "/m5ZsfKcxMDk5s7nEzQ1ntAIfOzX.jpg", vote_average: 7.8, release_date: "2023-12-08", media_type: "movie" },
  { id: 667216, title: "Infinity Pool", poster_path: "/cQKyNm0Nz6KWiDBQF9w4aZAmOfC.jpg", backdrop_path: "/1xhcEecvRJXQ2OAVO7l9btlrN6D.jpg", vote_average: 6.1, release_date: "2023-01-27", media_type: "movie" },
  { id: 869291, title: "Cuckoo", poster_path: "/4bGP5cnSZbfBJfIidZNSEIKnav7.jpg", backdrop_path: "/1eoCL8fPUZKlho03XVeNzZ3nlds.jpg", vote_average: 5.7, release_date: "2024-02-16", media_type: "movie" },
  { id: 1024773, title: "It Lives Inside", poster_path: "/73gIfV8gDwkVgUrFDzt4TfZC9Zc.jpg", backdrop_path: "/dp0rdbGSbZTyWumnbWspXQp87hA.jpg", vote_average: 5.683, release_date: "2023-09-06", media_type: "movie" },
];

const IRANIAN_MOVIES = [
  { id: 60243, title: "A Separation", poster_path: "/xQadpnoLokxzN3hRpCPbBGpxsiz.jpg", backdrop_path: "/kcXBa2ru0PXcGI8U3JiInsG6FRR.jpg", vote_average: 7.899, release_date: "2011-02-15", media_type: "movie" },
  { id: 21334, title: "Children of Heaven", poster_path: "/jWqh1CJWAEcxckMRrf6ARhIEh0R.jpg", backdrop_path: "/9W250lyDDC3P9AgW5ZKGRj7R2Pv.jpg", vote_average: 7.9, release_date: "1997-08-01", media_type: "movie" },
  { id: 30017, title: "Close-Up", poster_path: "/m9HG2N9ZKCmNN9qOHJTNyy18wn3.jpg", backdrop_path: "/3t1qZqP1e17wQshpPKSqII1OogM.jpg", vote_average: 7.941, release_date: "1990-05-09", media_type: "movie" },
  { id: 49964, title: "Where Is The Friend's House?", poster_path: "/2rTW4s1kgvoqVs0Kv8ARle1SrkF.jpg", backdrop_path: "/ylBiGZhgBsly0frseG2PvqoYM4o.jpg", vote_average: 7.9, release_date: "1987-07-01", media_type: "movie" },
  { id: 30020, title: "Taste of Cherry", poster_path: "/u6GYH4HyR0BVwpqFuTOc2g4KB1L.jpg", backdrop_path: "/44SNTCSZTdbF5bzgUy4IfPV3DUq.jpg", vote_average: 7.683, release_date: "1997-09-28", media_type: "movie" },
  { id: 375315, title: "The Salesman", poster_path: "/x4PIuYU5ZMMXiTrheNR8vCTYPBf.jpg", backdrop_path: "/woSmQgo1wxE4WRVXWHrmgv3jy2O.jpg", vote_average: 7.3, release_date: "2016-06-24", media_type: "movie" },
  { id: 37181, title: "About Elly", poster_path: "/ctLrMQrg3kss2JO7OIr7RVdN5an.jpg", backdrop_path: "/3loY85G8vB0OcpleFFezf4kSDsy.jpg", vote_average: 7.467, release_date: "2009-06-06", media_type: "movie" },
  { id: 889699, title: "Holy Spider", poster_path: "/6ObJ4x7m1F5QRY06WzOxNJQHwGb.jpg", backdrop_path: "/fx6c2UuNnXPwuRvu4tGaJJJITT6.jpg", vote_average: 7.276, release_date: "2022-07-13", media_type: "movie" },
  { id: 672208, title: "A Hero", poster_path: "/5VBPRWW13OJoiLA6suLofnjLKou.jpg", backdrop_path: "/rXRf5Okqg0FzDpmZkt4wly2asB2.jpg", vote_average: 7.31, release_date: "2021-12-15", media_type: "movie" },
  { id: 320006, title: "Taxi", poster_path: "/lY2RW6pxRYyPmrgUF0rjqbeAnTu.jpg", backdrop_path: "/677ohgE1vEEMSIHZILT19z4rf58.jpg", vote_average: 7.043, release_date: "2015-04-15", media_type: "movie" },
  { id: 375012, title: "Under the Shadow", poster_path: "/3hxT9XviA3VzUtelHBk2xA6I9FY.jpg", backdrop_path: "/keX3XBX34vUDDULvcohfzPXIU8T.jpg", vote_average: 6.486, release_date: "2016-09-30", media_type: "movie" },
  { id: 47104, title: "Through the Olive Trees", poster_path: "/xcwCF0YTyAOMrVLgXHjvPP0gGbh.jpg", backdrop_path: "/4BIIX7qiKYYJSm4cWTB2dHfCwZE.jpg", vote_average: 7.441, release_date: "1995-01-25", media_type: "movie" },
  { id: 583794, title: "Law of Tehran", poster_path: "/ujNhy2Vu7S1FHuwePMIYMkIbGTj.jpg", backdrop_path: "/ubn9Em9G2aFNtogNGCR6IoDBqM.jpg", vote_average: 7.176, release_date: "2019-03-17", media_type: "movie" },
];

const FOCUS_MOVIES = [
  { id: 76203, title: "12 Years a Slave", poster_path: "/xdANQijuNrJaw1HA61rDccME4Tm.jpg", backdrop_path: "/4Bb1kMIfrT2tYRZ9M6Jhqy6gkeF.jpg", vote_average: 7.933, release_date: "2013-10-18", media_type: "movie" },
  { id: 281957, title: "The Revenant", poster_path: "/ji3ecJphATlVgWNY0B0RVXZizdf.jpg", backdrop_path: "/mNQtUJv1F3u0uSKILFrGjIHqkxx.jpg", vote_average: 7.54, release_date: "2015-12-25", media_type: "movie" },
  { id: 194662, title: "Birdman", poster_path: "/rHUg2AuIuLSIYMYFgavVwqt1jtc.jpg", backdrop_path: "/s0OrExdg7i3RLR7oqzHRk4q2kL4.jpg", vote_average: 7.444, release_date: "2014-10-17", media_type: "movie" },
  { id: 639933, title: "The Northman", poster_path: "/aSSJMnHknzKjlZ6zybwD7eyJ4Po.jpg", backdrop_path: "/fMiEp00v8gGWEceL4QeLu6H6z69.jpg", vote_average: 7.033, release_date: "2022-04-07", media_type: "movie" },
  { id: 1813, title: "The Devil's Advocate", poster_path: "/5ZzBGpxy55OQzHxKVY11IpY6a0o.jpg", backdrop_path: "/2Y6Q7eYDXoolcHjYCAyJQlE2CVT.jpg", vote_average: 7.469, release_date: "1997-10-17", media_type: "movie" },
  { id: 9509, title: "Man on Fire", poster_path: "/grCGLCcTHv9TChibzOwzUpykcjB.jpg", backdrop_path: "/6c7j7MQCczzNVvcrNEiXbs8Kt2p.jpg", vote_average: 7.458, release_date: "2004-04-23", media_type: "movie" },
  { id: 43347, title: "Love & Other Drugs", poster_path: "/wZLM2uKJRYNchLmiCIjosX0rXy8.jpg", backdrop_path: "/fGBJEfGjHmhg7nLAT0Jkcv9qV5e.jpg", vote_average: 7.038, release_date: "2010-11-22", media_type: "movie" },
  { id: 340837, title: "A Cure for Wellness", poster_path: "/8QWJtne0pTsNoJ86KE993aQYTLW.jpg", backdrop_path: "/uXx9wjfJEzLlfqB8GW67SYBrhVT.jpg", vote_average: 6.351, release_date: "2017-02-15", media_type: "movie" },
];

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

        <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
          <PrimeCarouselRow
            title="A24 Films"
            badge="Studio"
            movies={A24_MOVIES}
            loading={false}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow
            title="Neon Films"
            badge="Studio"
            movies={NEON_MOVIES}
            loading={false}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
          <PrimeCarouselRow
            title="Iranian Cinema"
            badge="World Cinema"
            movies={IRANIAN_MOVIES}
            loading={false}
          />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <PrimeCarouselRow
            title="Focus Features"
            badge="Studio"
            movies={FOCUS_MOVIES}
            loading={false}
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