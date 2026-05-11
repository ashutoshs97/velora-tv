import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Star, Share2, ListVideo, Play as PlayIcon,
  CheckCircle2, Bookmark, Check,
} from 'lucide-react';
import {
  fetchMovieDetail, fetchTVDetail,
  fetchSimilar, fetchRecommendations,
} from '../api';
import MultiSourceAggregator from '../components/MultiSourceAggregator';
import TrailerModal from '../components/TrailerModal';
import AmbientBackground from '../components/AmbientBackground';
import CarouselRow from '../components/CarouselRow';
import CommentsSection from '../components/CommentsSection';
import WatchlistButton from '../components/WatchlistButton';
import { addToHistory } from '../utils/watchHistory';

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

function getSafeType(raw) {
  return raw === 'tv' ? 'tv' : 'movie';
}

export default function Watch() {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = getSafeType(searchParams.get('type'));
  const urlSeason = Number(searchParams.get('s')) || null;
  const urlEpisode = Number(searchParams.get('e')) || null;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [showTrailer, setShowTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [showColdStartWarning, setShowColdStartWarning] = useState(false);

  // load movie details
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = type === 'tv'
          ? await fetchTVDetail(id)
          : await fetchMovieDetail(id);
        if (cancelled) return;
        const data = res.data;
        setMovie(data);
        const t = data.title || data.name;
        const releaseYear = (data.release_date || data.first_air_date || '').substring(0, 4);
        addToHistory({
          tmdbId: data.id,
          title: t,
          posterPath: data.poster_path,
          backdropPath: data.backdrop_path,
          year: releaseYear,
          rating: data.vote_average,
          overview: data.overview,
          type: type,
          season: type === 'tv' ? (urlSeason || 1) : undefined,
          episode: type === 'tv' ? (urlEpisode || 1) : undefined,
        });
        if (type === 'tv' && data.seasons?.length > 0) {
          if (urlSeason) {
            setSeason(urlSeason);
            setEpisode(urlEpisode || 1);
          } else {
            const firstRealSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
            setSeason(firstRealSeason.season_number || 1);
            setEpisode(1);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load details. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [id, type, urlSeason, urlEpisode]);

  // cold start warning
  useEffect(() => {
    let warningTimer;
    if (loading) {
      warningTimer = setTimeout(() => setShowColdStartWarning(true), 3000);
    } else {
      setShowColdStartWarning(false);
    }
    return () => clearTimeout(warningTimer);
  }, [loading]);

  // similar + recommendations
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchSimilar(id, type)
      .then(r => { if (!cancelled) setSimilar(r.data?.results || []); })
      .catch(() => {});
    fetchRecommendations(id, type)
      .then(r => { if (!cancelled) setRecommended(r.data?.results || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [id, type]);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/watch/${id}?type=${type}`;
    const textToShare = `Check out "${movie?.title || movie?.name || 'this'}" on Velora! 🍿\n\n${url}`;
    const copyFallback = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToShare;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch { /* silent */ }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToShare)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(copyFallback);
    } else {
      copyFallback();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [id, type, movie]);

  const cast = useMemo(() => movie?.credits?.cast?.slice(0, 15) || [], [movie]);
  const genres = useMemo(() => movie?.genres?.map(g => g.name).join(', ') || '', [movie]);
  const runtime = useMemo(() => {
    const min = movie?.runtime || movie?.episode_run_time?.[0];
    if (!min) return null;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  }, [movie]);
  const year = useMemo(
    () => (movie?.release_date || movie?.first_air_date)?.substring(0, 4) || '',
    [movie]
  );
  const directorName = useMemo(
    () => movie?.credits?.crew?.find(c => c.job === 'Director')?.name
      || movie?.created_by?.[0]?.name
      || 'Unknown',
    [movie]
  );
  const trailerKey = useMemo(() => {
    const key = movie?.videos?.results?.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    )?.key || movie?.videos?.results?.[0]?.key;
    return typeof key === 'string' && key.trim().length > 0 ? key : null;
  }, [movie]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-24 flex items-center justify-center bg-black px-4"
      >
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-12 h-12 border-2 border-prime-blue border-t-transparent rounded-full animate-spin" />
          {showColdStartWarning && (
            <div className="animate-fade-up">
              <p className="text-prime-blue font-bold tracking-wide mb-2">
                Waking up the server...
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                Free-tier backend spins down after inactivity. Please wait ~50 seconds.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (error || !movie) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-24 flex items-center justify-center bg-black px-4"
      >
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg font-bold">{error || 'Movie not found.'}</p>
          <Link to="/" className="btn-primary inline-flex text-sm">
            <ArrowLeft size={16} className="mr-2" /> Go Home
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="min-h-screen bg-black flex flex-col"
    >
      <div className="relative">
        <AmbientBackground posterPath={movie?.poster_path} />
      </div>

      {showTrailer && trailerKey && (
        <TrailerModal
          videoKey={trailerKey}
          title={movie?.title || movie?.name}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* player area */}
      <div className="w-full relative z-10 pt-24 pb-8 bg-black">
        <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-8">
          <MultiSourceAggregator tmdbId={id} type={type} season={season} episode={episode} />

          {type === 'tv' && movie?.seasons && (
            <div className="mt-8 bg-[#1A242F] border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-prime-blue">
                <ListVideo size={20} />
                <span className="font-bold text-white tracking-wide uppercase text-sm">Episodes</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  className="bg-black/50 border border-white/20 text-white text-sm rounded-lg outline-none focus:border-prime-blue px-3 py-2 cursor-pointer appearance-none"
                  style={{ colorScheme: 'dark' }}
                  value={season}
                  onChange={(e) => {
                  const newSeason = Number(e.target.value);
                  setSeason(newSeason);
                  setEpisode(1);
                  if (movie) {
                    addToHistory({
                      tmdbId: movie.id,
                      title: movie.title || movie.name,
                      posterPath: movie.poster_path,
                      backdropPath: movie.backdrop_path,
                      year: (movie.release_date || movie.first_air_date || '').substring(0, 4),
                      rating: movie.vote_average,
                      overview: movie.overview,
                      type: type,
                      season: newSeason,
                      episode: 1,
                    });
                  }
                }}
                >
                  {movie.seasons
                    .filter(s => s.season_number > 0)
                    .map(s => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number}
                      </option>
                    ))}
                </select>
                <select
                  className="bg-black/50 border border-white/20 text-white text-sm rounded-lg outline-none focus:border-prime-blue px-3 py-2 cursor-pointer appearance-none"
                  style={{ colorScheme: 'dark' }}
                  value={episode}
                  onChange={(e) => {
                  const newEpisode = Number(e.target.value);
                  setEpisode(newEpisode);
                  if (movie) {
                    addToHistory({
                      tmdbId: movie.id,
                      title: movie.title || movie.name,
                      posterPath: movie.poster_path,
                      backdropPath: movie.backdrop_path,
                      year: (movie.release_date || movie.first_air_date || '').substring(0, 4),
                      rating: movie.vote_average,
                      overview: movie.overview,
                      type: type,
                      season: season,
                      episode: newEpisode,
                    });
                  }
                }}
                >
                  {Array.from(
                    { length: movie.seasons.find(s => s.season_number === season)?.episode_count || 1 },
                    (_, i) => (
                      <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* details area */}
      <div className="flex-1 bg-prime-bg relative z-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10">

          {/* header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-3 break-words">
                {movie.title || movie.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="flex items-center gap-1 text-[13px] font-bold text-prime-blue">
                  <CheckCircle2 size={14} /> Included with Velora
                </span>
                {year && (
                  <span className="text-[14px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                    {year}
                  </span>
                )}
                {runtime && (
                  <span className="text-[14px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                    {runtime}
                  </span>
                )}
                {type === 'tv' && movie.number_of_seasons && (
                  <span className="text-[14px] font-bold text-prime-subtext border-l border-white/20 pl-4">
                    {movie.number_of_seasons} Seasons
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {trailerKey && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-red-600/80 border border-white/15 hover:border-red-500 text-white text-sm font-bold transition-all duration-200"
                >
                  <PlayIcon size={16} fill="currentColor" /> Watch Trailer
                </button>
              )}
              <WatchlistButton
                movie={movie}
                type={type}
                className="btn-secondary !p-4"
                size={20}
                useBookmark
              />
              <button
                onClick={handleShare}
                title="Share"
                className={`btn-secondary !p-4 transition-all ${copied ? '!bg-green-500/30 !border-green-500' : ''}`}
              >
                {copied
                  ? <Check size={20} className="text-green-400" />
                  : <Share2 size={20} className="-ml-0.5" />
                }
              </button>
            </div>
          </div>

          {/* tabs */}
          <div className="flex items-center gap-6 sm:gap-8 border-b border-white/10 mb-8 overflow-x-auto">
            {['details', 'cast'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative whitespace-nowrap ${
                  activeTab === tab ? 'text-white' : 'text-prime-subtext hover:text-white'
                }`}
              >
                {tab === 'details' ? 'Details' : 'Cast & Crew'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-prime-blue rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* tab content */}
          <div className="min-h-[300px]">
            {activeTab === 'details' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in">
                <div className="lg:col-span-2">
                  {movie.tagline && (
                    <p className="text-white/60 italic mb-4 font-medium">"{movie.tagline}"</p>
                  )}
                  <p className="text-base sm:text-lg text-white/90 leading-relaxed font-medium">
                    {movie.overview || 'No overview available.'}
                  </p>
                </div>
                <div className="space-y-4 border-l border-white/10 pl-6 lg:pl-10">
                  <div>
                    <span className="text-sm text-prime-subtext block mb-1">
                      {type === 'tv' ? 'Creator' : 'Director'}
                    </span>
                    <span className="text-white font-medium">{directorName}</span>
                  </div>
                  {genres && (
                    <div>
                      <span className="text-sm text-prime-subtext block mb-1">Genres</span>
                      <span className="text-white font-medium">{genres}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-prime-subtext block mb-1">Original Language</span>
                    <span className="text-white font-medium uppercase">
                      {movie.original_language || 'N/A'}
                    </span>
                  </div>
                  {movie.vote_average > 0 && (
                    <div>
                      <span className="text-sm text-prime-subtext block mb-1">TMDB Rating</span>
                      <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                        <Star size={16} fill="currentColor" />
                        <span>{movie.vote_average.toFixed(1)} / 10</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cast' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4 sm:gap-6 animate-fade-in">
                {cast.length > 0 ? cast.map((person) => (
                  <div key={person.id} className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-2 sm:mb-3 bg-prime-surface border-[3px] border-transparent group-hover:border-prime-blue transition-colors shadow-xl flex-shrink-0">
                      {person.profile_path ? (
                        <img
                          src={`${PROFILE_BASE}${person.profile_path}`}
                          alt={person.name || 'Cast member'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="w-full h-full items-center justify-center text-prime-subtext text-xl font-bold bg-[#252E39]"
                        style={{ display: person.profile_path ? 'none' : 'flex' }}
                      >
                        {person.name?.[0] ?? '?'}
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-white leading-tight mb-1 line-clamp-2">
                      {person.name || 'Unknown'}
                    </span>
                    <span className="text-[10px] sm:text-xs text-prime-subtext line-clamp-1">
                      {person.character || ''}
                    </span>
                  </div>
                )) : (
                  <p className="text-prime-subtext col-span-full">No cast information available.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* similar + recommended + comments */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
          {similar.length > 0 && (
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CarouselRow title="Similar" movies={similar} usePoster />
            </div>
          )}
          {recommended.length > 0 && (
            <div className="mt-10 mb-16">
              <CarouselRow title="Recommended For You" badge="Curated" movies={recommended} />
            </div>
          )}
          <div className="animate-fade-up mb-20" style={{ animationDelay: '0.2s' }}>
            <CommentsSection mediaType={type} mediaId={id} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function fallbackCopy(text) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  } catch { /* silent */ }
}
