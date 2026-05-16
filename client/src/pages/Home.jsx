import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  fetchTrending, fetchTrendingTV, fetchTopRated,
  fetchNewReleases, fetchByGenre, fetchByMood, fetchSimilar,
} from '../api';
import HeroBanner from '../components/HeroBanner';
import CarouselRow from '../components/CarouselRow';
import PrimeCarouselRow from '../components/PrimeCarouselRow';
import RecentlyWatched from '../components/RecentlyWatched';
import WatchlistButton from '../components/WatchlistButton';
import { useSettings } from '../contexts/SettingsContext';
import { getHistory } from '../utils/watchHistory';

const GENRES = [
  { id: 28, label: 'Action' }, { id: 35, label: 'Comedy' },
  { id: 18, label: 'Drama' }, { id: 27, label: 'Horror' },
  { id: 878, label: 'Sci-Fi' }, { id: 10749, label: 'Romance' },
  { id: 16, label: 'Animation' }, { id: 99, label: 'Documentary' },
  { id: 53, label: 'Thriller' }, { id: 10751, label: 'Family' },
];

const MOODS = [
  { key: 'action', label: 'Action' },
  { key: 'comedy', label: 'Comedy' },
  { key: 'horror', label: 'Horror' },
  { key: 'romance', label: 'Romance' },
  { key: 'scifi', label: 'Sci-Fi' },
  { key: 'animated', label: 'Animated' },
];

const AUTHORS_CHOICE = [
  { id: 496243, title: "Parasite", poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg", backdrop_path: "/hiKmpZMGZsrkA3cdce8a7Dpos1j.jpg", vote_average: 8.494, release_date: "2019-05-30", media_type: "movie" },
  { id: 38, title: "Eternal Sunshine of the Spotless Mind", poster_path: "/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg", backdrop_path: "/W1ffLQGHoxfAOq0ZYdPtJlvAdb.jpg", vote_average: 8.091, release_date: "2004-03-19", media_type: "movie" },
  { id: 419430, title: "Get Out", poster_path: "/mE24wUCfjK8AoBBjaMjho7Rczr7.jpg", backdrop_path: "/o8dPH0ZSIyyViP6rjRX1djwCUwI.jpg", vote_average: 7.622, release_date: "2017-02-24", media_type: "movie" },
  { id: 530385, title: "Midsommar", poster_path: "/7LEI8ulZzO5gy9Ww2NVCrKmHeDZ.jpg", backdrop_path: "/pYgj8e2Y6RufnSyOA6OnzmxFXxZ.jpg", vote_average: 7.2, release_date: "2019-07-03", media_type: "movie" },
  { id: 27205, title: "Inception", poster_path: "/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg", backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg", vote_average: 8.372, release_date: "2010-07-15", media_type: "movie" },
  { id: 546554, title: "Knives Out", poster_path: "/pThyQovXQrw2m0s9x82twj48Jq4.jpg", backdrop_path: "/4HWAQu28e2yaWrtupFPGFkdNU7V.jpg", vote_average: 7.839, release_date: "2019-11-27", media_type: "movie" },
  { id: 129, title: "Spirited Away", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", backdrop_path: "/dyJvKsNs2KP8qQnAXbRwDjblViy.jpg", vote_average: 8.534, release_date: "2001-07-20", media_type: "movie" },
  { id: 569094, title: "Spider-Man: Across the Spider-Verse", poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", backdrop_path: "/9xfDWXAUbFXQK585JvByT5pEAhe.jpg", vote_average: 8.333, release_date: "2023-05-31", media_type: "movie" },
  { id: 489, title: "Good Will Hunting", poster_path: "/z2FnLKpFi1HPO7BEJxdkv6hpJSU.jpg", backdrop_path: "/xj1Sv1xm4Y0ydBueGuf10Y9qM0O.jpg", vote_average: 8.159, release_date: "1997-12-05", media_type: "movie" },
  { id: 16869, title: "Inglourious Basterds", poster_path: "/7sfbEnaARXDDhKm0CZ7D7uc2sbo.jpg", backdrop_path: "/hwNtEmmugU5Yd7hpfprNWI0DGIn.jpg", vote_average: 8.217, release_date: "2009-08-02", media_type: "movie" },
  { id: 84892, title: "The Perks of Being a Wallflower", poster_path: "/aKCvdFFF5n80P2VdS7d8YBwbCjh.jpg", backdrop_path: "/aM6E4DBP6588q3tEr9hz41ls80q.jpg", vote_average: 7.803, release_date: "2012-09-20", media_type: "movie" },
  { id: 19913, title: "(500) Days of Summer", poster_path: "/qXAuQ9hF30sQRsXf40OfRVl0MJZ.jpg", backdrop_path: "/1M2i4Mxd03elGOTmEkIvqrHfmyS.jpg", vote_average: 7.3, release_date: "2009-07-17", media_type: "movie" },
  { id: 210577, title: "Gone Girl", poster_path: "/ts996lKsxvjkO2yiYG0ht4qAicO.jpg", backdrop_path: "/iWak7wT0j6ycCc8lKr4NBz9c7n5.jpg", vote_average: 7.889, release_date: "2014-10-01", media_type: "movie" },
  { id: 2062, title: "Ratatouille", poster_path: "/t3vaWRPSf6WjDSamIkKDs1iQWna.jpg", backdrop_path: "/xgDj56UWyeWQcxQ44f5A3RTWuSs.jpg", vote_average: 7.839, release_date: "2007-06-28", media_type: "movie" },
];

function getHistoryType(item) {
  if (!item) return 'movie';
  if (item.type === 'tv') return 'tv';
  if (item.media_type === 'tv') return 'tv';
  if (item.name && !item.title) return 'tv';
  return 'movie';
}

export default function Home() {
  const { minRating, hideWatched } = useSettings();

  const [trending, setTrending] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [history, setHistory] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [moodMovies, setMoodMovies] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [becauseTitle, setBecauseTitle] = useState('');

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTrendingTV, setLoadingTrendingTV] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);
  const [loadingMood, setLoadingMood] = useState(false);

  const [heroMovies, setHeroMovies] = useState([]);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedMood, setSelectedMood] = useState(MOODS[0]);



  const loadHistory = useCallback(() => {
    try {
      const data = getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadTrending = async () => {
      try {
        const res = await fetchTrending();
        if (cancelled) return;
        const movies = res.data?.results || [];
        setTrending(movies);
        const candidates = movies.filter(m => m.backdrop_path && m.vote_average > 6.5).slice(0, 7);
        setHeroMovies(candidates.length ? candidates : movies.filter(m => m.backdrop_path).slice(0, 5));
        setHeroIndex(0);
      } catch { if (!cancelled) setTrending([]); }
      finally { if (!cancelled) setLoadingTrending(false); }
    };
    const loadTrendingTV = async () => {
      try { const res = await fetchTrendingTV(); if (!cancelled) setTrendingTV(res.data?.results || []); }
      catch { if (!cancelled) setTrendingTV([]); }
      finally { if (!cancelled) setLoadingTrendingTV(false); }
    };
    const loadTopRated = async () => {
      try { const res = await fetchTopRated(); if (!cancelled) setTopRated(res.data?.results || []); }
      catch { if (!cancelled) setTopRated([]); }
      finally { if (!cancelled) setLoadingTopRated(false); }
    };
    const loadNewReleases = async () => {
      try { const res = await fetchNewReleases(); if (!cancelled) setNewReleases(res.data?.results || []); }
      catch { if (!cancelled) setNewReleases([]); }
      finally { if (!cancelled) setLoadingNew(false); }
    };
    loadTrending();
    loadTrendingTV();
    loadTopRated();
    loadNewReleases();
    loadHistory();
    return () => { cancelled = true; };
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    setLoadingGenre(true);
    fetchByGenre(selectedGenre.id)
      .then(res => { if (!cancelled) setGenreMovies(res.data?.results || []); })
      .catch(() => { if (!cancelled) setGenreMovies([]); })
      .finally(() => { if (!cancelled) setLoadingGenre(false); });
    return () => { cancelled = true; };
  }, [selectedGenre]);

  useEffect(() => {
    let cancelled = false;
    setLoadingMood(true);
    fetchByMood(selectedMood.key)
      .then(res => { if (!cancelled) setMoodMovies(res.data?.results || []); })
      .catch(() => { if (!cancelled) setMoodMovies([]); })
      .finally(() => { if (!cancelled) setLoadingMood(false); });
    return () => { cancelled = true; };
  }, [selectedMood]);

  useEffect(() => {
    if (!history?.length) return;
    let cancelled = false;
    const latest = history[0];
    if (!latest?.tmdbId) return;
    setBecauseTitle(latest.title || latest.name || 'your last watch');
    fetchSimilar(latest.tmdbId, getHistoryType(latest))
      .then(res => { if (!cancelled) setBecauseYouWatched(res.data?.results || []); })
      .catch(() => { if (!cancelled) setBecauseYouWatched([]); });
    return () => { cancelled = true; };
  }, [history]);



  const watchedIds = useMemo(() => new Set(history.map(h => h.tmdbId || h.id)), [history]);

  const filterItems = useCallback((arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.filter(m => {
      if (minRating > 0 && (m.vote_average || 0) < minRating) return false;
      if (hideWatched && watchedIds.has(m.id)) return false;
      return true;
    });
  }, [minRating, hideWatched, watchedIds]);

  const filteredTrending = useMemo(() => filterItems(trending), [filterItems, trending]);
  const filteredTrendingTV = useMemo(() => filterItems(trendingTV), [filterItems, trendingTV]);
  const filteredTopRated = useMemo(() => filterItems(topRated), [filterItems, topRated]);
  const filteredNewReleases = useMemo(() => filterItems(newReleases), [filterItems, newReleases]);
  const filteredBecauseYouWatched = useMemo(() => filterItems(becauseYouWatched), [filterItems, becauseYouWatched]);
  const filteredGenreMovies = useMemo(() => filterItems(genreMovies), [filterItems, genreMovies]);
  const filteredMoodMovies = useMemo(() => filterItems(moodMovies), [filterItems, moodMovies]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen pb-16"
    >
      {/* hero */}
      <HeroBanner heroMovies={heroMovies} />

      {/* content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 -mt-16 relative z-20 space-y-14">
        <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <RecentlyWatched history={history} onRefresh={loadHistory} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <CarouselRow title="Top 10 Movies" badge="Trending" movies={filteredTrending} loading={loadingTrending} ranked usePoster />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <CarouselRow title="Top 10 TV Shows" badge="Popular" movies={filteredTrendingTV} loading={loadingTrendingTV} ranked usePoster />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <PrimeCarouselRow title="Author's Choice" badge="Letterboxd Favorites" movies={AUTHORS_CHOICE} titleLink="https://letterboxd.com/ashutoshs97/likes/films/by/popular/" />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <PrimeCarouselRow title="Critically Acclaimed" badge="Top Rated" movies={filteredTopRated} loading={loadingTopRated} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
          <CarouselRow title="Binge-Worthy TV Shows" badge="Series" movies={filteredTrendingTV} loading={loadingTrendingTV} usePoster />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow title="Fresh Drops" badge="New This Month" movies={filteredNewReleases} loading={loadingNew} />
        </div>
        {becauseYouWatched.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
            <CarouselRow title={`Because You Watched "${becauseTitle}"`} movies={filteredBecauseYouWatched} usePoster />
          </div>
        )}

        {/* genre */}
        <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Genre</h2>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {GENRES.map((g) => (
              <button key={g.id} onClick={() => setSelectedGenre(g)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${selectedGenre.id === g.id ? 'bg-prime-blue text-white' : 'bg-white/5 text-prime-subtext hover:text-white'}`}>
                {g.label}
              </button>
            ))}
          </div>
          <PrimeCarouselRow title="" movies={filteredGenreMovies} loading={loadingGenre} />
        </div>

        {/* mood */}
        <div className="mb-24 animate-fade-up" style={{ animationDelay: '0.65s' }}>
          <div className="flex items-center gap-3 mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Browse by Mood</h2>
          </div>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {MOODS.map((m) => (
              <button key={m.key} onClick={() => setSelectedMood(m)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${selectedMood.key === m.key ? 'bg-prime-blue text-white' : 'bg-white/5 text-prime-subtext hover:text-white'}`}>
                {m.label}
              </button>
            ))}
          </div>
          <PrimeCarouselRow title="" movies={filteredMoodMovies} loading={loadingMood} />
        </div>
      </div>
    </motion.div>
  );
}
