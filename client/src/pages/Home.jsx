import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  fetchTrending, fetchTrendingTV, fetchTopRated,
  fetchNewReleases, fetchByGenre, fetchSimilar,
  fetchAuthorsChoice, fetchCrimeDocs
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


// Dynamic Author's Choice row is loaded from backend config

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
  const [history, setHistory] = useState(() => {
    try {
      const data = getHistory();
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  });
  const [newReleases, setNewReleases] = useState([]);
  const [authorsChoice, setAuthorsChoice] = useState([]);
  const [crimeDocs, setCrimeDocs] = useState([]);
  const [genreMovies, setGenreMovies] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);

  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingTrendingTV, setLoadingTrendingTV] = useState(true);
  const [loadingTopRated, setLoadingTopRated] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingAuthorsChoice, setLoadingAuthorsChoice] = useState(true);
  const [loadingCrimeDocs, setLoadingCrimeDocs] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);

  const [heroMovies, setHeroMovies] = useState([]);

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);

  const becauseTitle = history?.[0]?.title || history?.[0]?.name || 'your last watch';

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

    const loadAll = async () => {
      const results = await Promise.allSettled([
        fetchTrending(),
        fetchTrendingTV(),
        fetchTopRated(),
        fetchNewReleases(),
        fetchAuthorsChoice(),
        fetchCrimeDocs()
      ]);

      if (cancelled) return;

      // Trending
      if (results[0].status === 'fulfilled') {
        const movies = results[0].value.data?.results || [];
        setTrending(movies);
        const candidates = movies.filter(m => m.backdrop_path && m.vote_average > 6.5).slice(0, 7);
        setHeroMovies(candidates.length ? candidates : movies.filter(m => m.backdrop_path).slice(0, 5));
      } else {
        setTrending([]);
      }
      setLoadingTrending(false);

      // Trending TV
      if (results[1].status === 'fulfilled') {
        setTrendingTV(results[1].value.data?.results || []);
      } else {
        setTrendingTV([]);
      }
      setLoadingTrendingTV(false);

      // Top Rated
      if (results[2].status === 'fulfilled') {
        setTopRated(results[2].value.data?.results || []);
      } else {
        setTopRated([]);
      }
      setLoadingTopRated(false);

      // New Releases
      if (results[3].status === 'fulfilled') {
        setNewReleases(results[3].value.data?.results || []);
      } else {
        setNewReleases([]);
      }
      setLoadingNew(false);

      // Authors Choice
      if (results[4].status === 'fulfilled') {
        setAuthorsChoice(results[4].value.data?.results || []);
      } else {
        setAuthorsChoice([]);
      }
      setLoadingAuthorsChoice(false);

      // Crime Docs
      if (results[5].status === 'fulfilled') {
        setCrimeDocs(results[5].value.data?.results || []);
      } else {
        setCrimeDocs([]);
      }
      setLoadingCrimeDocs(false);
    };

    loadAll();

    return () => { cancelled = true; };
  }, [loadHistory]);

  useEffect(() => {
    let cancelled = false;
    fetchByGenre(selectedGenre.id)
      .then(res => { if (!cancelled) setGenreMovies(res.data?.results || []); })
      .catch(() => { if (!cancelled) setGenreMovies([]); })
      .finally(() => { if (!cancelled) setLoadingGenre(false); });
    return () => { cancelled = true; };
  }, [selectedGenre]);


  useEffect(() => {
    if (!history?.length) return;
    let cancelled = false;
    const latest = history[0];
    if (!latest?.tmdbId) return;
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
  const filteredAuthorsChoice = useMemo(() => filterItems(authorsChoice), [filterItems, authorsChoice]);
  const filteredCrimeDocs = useMemo(() => filterItems(crimeDocs), [filterItems, crimeDocs]);
  const filteredBecauseYouWatched = useMemo(() => filterItems(becauseYouWatched), [filterItems, becauseYouWatched]);
  const filteredGenreMovies = useMemo(() => filterItems(genreMovies), [filterItems, genreMovies]);

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
          <CarouselRow
            title="Top 10 Movies"
            badge="Trending"
            movies={filteredTrending.slice(0, 10)}
            loading={loadingTrending}
            ranked
            usePoster
          />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <CarouselRow
            title="Top 10 TV Shows"
            badge="Popular"
            movies={filteredTrendingTV.slice(0, 10)}
            loading={loadingTrendingTV}
            ranked
            usePoster
          />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.35s' }}>
          <PrimeCarouselRow title="Author's Choice" badge="Letterboxd Favorites" movies={filteredAuthorsChoice} loading={loadingAuthorsChoice} titleLink="https://letterboxd.com/ashutoshs97/likes/films/by/popular/" />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <PrimeCarouselRow title="Critically Acclaimed" badge="Top Rated" movies={filteredTopRated} loading={loadingTopRated} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.45s' }}>
          <PrimeCarouselRow title="Binge-Worthy TV Shows" badge="Series" movies={filteredTrendingTV} loading={loadingTrendingTV} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.48s' }}>
          <PrimeCarouselRow title="Author's Handpicked Crime Documentaries" badge="True Crime" movies={filteredCrimeDocs} loading={loadingCrimeDocs} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
          <PrimeCarouselRow title="Fresh Drops" badge="New This Month" movies={filteredNewReleases} loading={loadingNew} />
        </div>
        {becauseYouWatched.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '0.55s' }}>
            <PrimeCarouselRow title={`Because You Watched "${becauseTitle}"`} movies={filteredBecauseYouWatched} />
          </div>
        )}

        {/* genre */}
        <div className="mb-20 animate-fade-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center mb-5 px-1">
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 flex items-center">
              Browse by Genre
            </h2>
          </div>
          <div className="flex gap-2.5 mb-6 overflow-x-auto pb-4 pt-1 px-1 -mx-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {GENRES.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  if (selectedGenre.id !== g.id) {
                    setLoadingGenre(true);
                    setSelectedGenre(g);
                  }
                }}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 ${
                  selectedGenre.id === g.id 
                    ? 'text-white bg-prime-blue/20 border border-prime-blue/30' 
                    : 'text-prime-subtext border border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <PrimeCarouselRow title="" movies={filteredGenreMovies} loading={loadingGenre} />
        </div>
      </div>
    </motion.div>
  );
}
