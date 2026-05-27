import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Share2, Play as PlayIcon,
  Check, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  fetchMovieDetail, fetchTVDetail,
  fetchSimilar, fetchRecommendations, fetchTVSeason,
} from '../api';
import MultiSourceAggregator from '../components/MultiSourceAggregator';
import TrailerModal from '../components/TrailerModal';
import AmbientBackground from '../components/AmbientBackground';
import CarouselRow from '../components/CarouselRow';
import CommentsSection from '../components/CommentsSection';
import WatchlistButton from '../components/WatchlistButton';
import { addToHistory } from '../utils/watchHistory';
import { getTmdbImage } from '../utils/tmdbImages';

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
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [showColdStartWarning, setShowColdStartWarning] = useState(false);
  const [seasonMenuOpen, setSeasonMenuOpen] = useState(false);
  const episodeRailRef = useRef(null);
  const seasonsCache = useRef({});

  const cast = useMemo(() => movie?.credits?.cast?.slice(0, 15) || [], [movie]);
  const genres = useMemo(() => movie?.genres?.map(g => g.name).join(', ') || '', [movie]);
  const runtime = useMemo(() => {
    if (type === 'tv') {
      let min = movie?.episode_run_time?.[0];
      if (!min && seasonDetails?.episodes?.length > 0) {
        const runtimes = seasonDetails.episodes.map(e => e.runtime).filter(Boolean);
        if (runtimes.length > 0) {
          min = Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length);
        }
      }
      if (!min) return null;
      return `Avg. ${min}m/ep`;
    }
    const min = movie?.runtime;
    if (!min) return null;
    return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
  }, [movie, type, seasonDetails]);
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
  const seasons = useMemo(
    () => movie?.seasons?.filter(s => s.season_number > 0) || [],
    [movie]
  );
  const activeSeason = useMemo(
    () => seasons.find(s => s.season_number === season),
    [seasons, season]
  );
  const episodes = useMemo(() => {
    if (seasonDetails?.episodes?.length) return seasonDetails.episodes;
    const count = activeSeason?.episode_count || 1;
    return Array.from({ length: count }, (_, i) => ({
      id: `fallback-${season}-${i + 1}`,
      episode_number: i + 1,
      name: `Episode ${i + 1}`,
      overview: '',
      still_path: null,
    }));
  }, [activeSeason, season, seasonDetails]);




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

  // load season details (episodes list) with caching & pre-fetching
  useEffect(() => {
    if (type !== 'tv' || !id || !season) return;
    
    const cacheKey = `${id}-${season}`;
    const cachedData = seasonsCache.current[cacheKey];
    
    if (cachedData) {
      setSeasonDetails(cachedData);
      setSeasonLoading(false);
      return;
    }

    let cancelled = false;
    setSeasonLoading(true);
    setSeasonDetails(null); // Clear previous episodes immediately to prevent flashes

    fetchTVSeason(id, season)
      .then(res => {
        if (cancelled) return;
        const data = res.data || null;
        if (data) {
          seasonsCache.current[cacheKey] = data;
          setSeasonDetails(data);
          
          // Pre-fetch next season to cache if available
          const currentSeasonIdx = seasons.findIndex(s => s.season_number === season);
          if (currentSeasonIdx !== -1 && currentSeasonIdx < seasons.length - 1) {
            const nextSeasonNum = seasons[currentSeasonIdx + 1].season_number;
            const nextCacheKey = `${id}-${nextSeasonNum}`;
            if (!seasonsCache.current[nextCacheKey]) {
              fetchTVSeason(id, nextSeasonNum)
                .then(nextRes => {
                  if (nextRes.data) {
                    seasonsCache.current[nextCacheKey] = nextRes.data;
                  }
                })
                .catch(() => {});
            }
          }
        }
      })
      .catch(() => {
        if (!cancelled) setSeasonDetails(null);
      })
      .finally(() => {
        if (!cancelled) setSeasonLoading(false);
      });
      
    return () => { cancelled = true; };
  }, [id, type, season, seasons]);

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

  const recordEpisodeHistory = useCallback((nextSeason, nextEpisode) => {
    if (!movie) return;
    addToHistory({
      tmdbId: movie.id,
      title: movie.title || movie.name,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      year: (movie.release_date || movie.first_air_date || '').substring(0, 4),
      rating: movie.vote_average,
      overview: movie.overview,
      type: type,
      season: nextSeason,
      episode: nextEpisode,
    });
  }, [movie, type]);

  const alignEpisodeToStart = useCallback((episodeNumber, behavior = 'smooth') => {
    const rail = episodeRailRef.current;
    if (!rail) return;

    const card = rail.querySelector(`[data-episode-number="${Number(episodeNumber)}"]`);
    if (!card) return;
    
    card.scrollIntoView({ behavior, block: 'nearest', inline: 'start' });
  }, []);

  const handleEpisodeChange = useCallback((newEpisode) => {
    setEpisode(newEpisode);
    recordEpisodeHistory(season, newEpisode);
    requestAnimationFrame(() => alignEpisodeToStart(newEpisode));
  }, [alignEpisodeToStart, recordEpisodeHistory, season]);

  const handleSeasonChange = useCallback((newSeason) => {
    setSeason(newSeason);
    setEpisode(1);
    setSeasonMenuOpen(false);
    recordEpisodeHistory(newSeason, 1);
    requestAnimationFrame(() => {
      if (episodeRailRef.current) {
        episodeRailRef.current.scrollTo(0, 0);
      }
    });
  }, [recordEpisodeHistory]);

  useEffect(() => {
    if (type !== 'tv' || seasonLoading) return;
    const frame = requestAnimationFrame(() => {
      alignEpisodeToStart(episode, 'auto');
    });
    return () => cancelAnimationFrame(frame);
  }, [alignEpisodeToStart, episode, episodes.length, seasonLoading, type]);

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
      className="min-h-screen bg-[#080E14] flex flex-col relative overflow-hidden"
    >
      <AmbientBackground posterPath={movie?.poster_path} />

      {showTrailer && trailerKey && (
        <TrailerModal
          videoKey={trailerKey}
          title={movie?.title || movie?.name}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* player area */}
      <div className="w-full relative z-30 pt-24 pb-8 bg-transparent">
        <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-10 xl:px-14">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            
            {/* Player Container */}
            <div className={`w-full ${type === 'tv' && seasons.length > 0 ? 'lg:w-[70%] xl:w-[75%]' : ''} flex-shrink-0 flex flex-col`}>
              <MultiSourceAggregator tmdbId={id} type={type} season={season} episode={episode} />
            </div>

            {/* Episode List Container */}
            {type === 'tv' && seasons.length > 0 && (
              <div className="w-full lg:w-[30%] xl:w-[25%] flex-shrink-0">
                <div className="overflow-visible rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl shadow-2xl shadow-black/40 lg:max-h-[min(800px,calc(100vh-120px))] flex flex-col">
                  <div className="flex flex-col gap-4 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start lg:gap-3">
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[15px] font-bold text-white tracking-tight">
                        Episodes
                      </span>
                      <span className="text-[13px] text-white/40 font-medium">
                        {episodes.length} Episode{episodes.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="relative w-full sm:w-auto mt-3 sm:mt-0 lg:mt-0 lg:w-full">
                      <button
                        type="button"
                        onClick={() => setSeasonMenuOpen(open => !open)}
                        className="flex w-full items-center justify-between gap-3 rounded-full bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-md px-4 py-2.5 text-left text-[13px] font-semibold text-white/90 transition-all duration-200 border border-white/[0.08] hover:border-white/[0.15] sm:w-auto sm:min-w-[180px] lg:w-full"
                        aria-haspopup="listbox"
                        aria-expanded={seasonMenuOpen}
                      >
                        <span className="truncate">{activeSeason?.name || `Season ${season}`}</span>
                        <ChevronDown
                          size={15}
                          className={`flex-shrink-0 text-white/50 transition-transform duration-300 ${seasonMenuOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      {seasonMenuOpen && (
                        <div
                          className="absolute left-0 right-0 z-40 mt-2 flex max-h-80 w-full min-w-[220px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0F1923]/95 backdrop-blur-2xl shadow-2xl shadow-black/70 sm:w-64 lg:w-full"
                          role="listbox"
                        >
                          <div className="custom-scrollbar overflow-y-auto max-h-[calc(20rem-2px)] p-2 pr-1.5">
                            {seasons.map(s => (
                              <button
                                key={s.id || s.season_number}
                                type="button"
                                onClick={() => handleSeasonChange(s.season_number)}
                                className={`flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${
                                  s.season_number === season
                                    ? 'bg-prime-blue/15 text-white'
                                    : 'text-white/70 hover:bg-white/[0.06] hover:text-white'
                                }`}
                                role="option"
                                aria-selected={s.season_number === season}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-[13px] font-semibold">{s.name || `Season ${s.season_number}`}</span>
                                  <span className="text-[11px] font-medium text-white/35">
                                    {s.episode_count || 0} episodes
                                  </span>
                                </span>
                                {s.season_number === season && (
                                  <Check size={14} className="flex-shrink-0 text-prime-blue" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative p-0 flex-1 overflow-hidden flex flex-col">
                    <motion.div
                      key={season}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      ref={episodeRailRef}
                      className="custom-scrollbar flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto snap-x lg:snap-y snap-mandatory p-3 lg:p-4 lg:pt-5 pb-2 lg:scroll-pt-5"
                    >
                      {seasonLoading && !seasonDetails ? (
                        Array.from({ length: 6 }, (_, i) => (
                          <div key={`episode-skeleton-${i}`} className="skeleton h-40 w-[235px] lg:w-full lg:h-[120px] flex-shrink-0 rounded-lg snap-start" />
                        ))
                      ) : episodes.map(ep => {
                        const isActive = Number(ep.episode_number) === Number(episode);
                        const imagePath = ep.still_path || activeSeason?.poster_path || movie.backdrop_path;
                        const imgData = ep.still_path
                          ? getTmdbImage(ep.still_path, 'still', 'w300')
                          : imagePath
                            ? getTmdbImage(imagePath, 'backdrop', 'w780')
                            : { src: null, srcSet: undefined };
                        const imageSrc = imgData.src;
                        const imgSrcSet = imgData.srcSet;
                        return (
                          <button
                            key={ep.id || ep.episode_number}
                            type="button"
                            data-episode-number={ep.episode_number}
                            onClick={() => handleEpisodeChange(ep.episode_number)}
                            className={`group relative w-[235px] lg:w-full flex-shrink-0 flex flex-col lg:flex-row overflow-hidden rounded-xl border text-left transition-colors duration-300 snap-start ${
                              isActive
                                ? 'border-prime-blue bg-prime-blue/10 shadow-[0_0_15px_rgba(1,180,228,0.3)]'
                                : 'border-white/10 bg-black/25 hover:border-white/25 hover:bg-white/5'
                            }`}
                          >
                            <div className="relative aspect-video w-full lg:w-36 xl:w-40 flex-shrink-0 overflow-hidden bg-prime-surface">
                              {imageSrc ? (
                                <img
                                  src={imageSrc}
                                  srcSet={imgSrcSet}
                                  sizes="(max-width: 1024px) 235px, 160px"
                                  alt={ep.name || `Episode ${ep.episode_number}`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#111D28] text-sm font-bold text-prime-subtext">
                                  Episode {ep.episode_number}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-[11px] font-black uppercase tracking-wide text-white">
                                E{ep.episode_number}
                              </span>
                              {isActive && (
                                <span className="absolute right-2 top-2 rounded-full bg-prime-blue px-2 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                                  Now
                                </span>
                              )}
                            </div>
                            <div className="min-h-[84px] p-3 lg:p-3 flex-1 flex flex-col justify-center">
                              <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
                                {ep.name || `Episode ${ep.episode_number}`}
                              </h3>
                              <p className="mt-1.5 line-clamp-2 lg:line-clamp-3 text-[11px] leading-relaxed text-white/50">
                                {ep.overview || ep.air_date || 'Episode details from TMDB.'}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* details area */}
      <div className="flex-1 bg-transparent relative z-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-10">
          
          {/* header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 mt-6 lg:mt-0">
            <div className="min-w-0 flex-1">
              <h1 className="max-w-[min(100%,50rem)] whitespace-normal break-words text-balance text-[clamp(2rem,4vw,3.5rem)] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/60 mb-4 leading-tight drop-shadow-sm font-display tracking-tight">
                {movie.title || movie.name}
              </h1>
              
              <div className="inline-flex flex-wrap items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl mb-2">
                {year && (
                  <span className="text-[13px] font-bold text-white/90 tracking-widest uppercase">
                    {year}
                  </span>
                )}
                
                {runtime && (
                  <>
                    <div className="w-[4px] h-[4px] rounded-full bg-white/30" />
                    <span className="text-[13px] font-bold text-white/90 tracking-widest uppercase">
                      {runtime}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-wrap pb-2 lg:pb-4">
              {trailerKey && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10"
                >
                  <PlayIcon size={18} className="fill-current" />
                  <span>Trailer</span>
                </button>
              )}
              <WatchlistButton
                movie={movie}
                type={type}
                className="flex items-center justify-center bg-white/10 hover:bg-white/20 text-white p-3 sm:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 backdrop-blur-md border border-white/10"
                size={20}
                useBookmark
              />
              <button
                onClick={handleShare}
                title="Share"
                className={`flex items-center justify-center bg-white/10 hover:bg-white/20 text-white p-3 sm:p-3.5 rounded-full transition-all hover:scale-105 active:scale-95 backdrop-blur-md border border-white/10 ${copied ? '!bg-green-500/30 !border-green-500' : ''}`}
              >
                {copied
                  ? <Check size={20} className="text-green-400" />
                  : <Share2 size={20} className="-ml-0.5" />
                }
              </button>
            </div>
          </div>


          {/* tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto">
            {['details', 'cast'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 rounded-full whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-white bg-prime-blue/20 border border-prime-blue/30 shadow-[0_0_12px_rgba(1,180,228,0.15)]'
                    : 'text-prime-subtext hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab === 'details' ? 'Details' : 'Cast & Crew'}
              </button>
            ))}
          </div>

          {/* separator */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

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
                      <span className="text-sm text-prime-subtext block mb-1">Rating</span>
                      <div className="flex items-center gap-2 text-[14px] font-bold text-white">
                        <span className="bg-gradient-to-r from-[#90cea1] to-[#01b4e4] text-[#0d253f] text-[10px] font-black px-1.5 py-0.5 rounded-sm tracking-widest uppercase shadow-sm">
                          TMDB
                        </span>
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
                          src={getTmdbImage(person.profile_path, 'profile', 'w185').src}
                          srcSet={getTmdbImage(person.profile_path, 'profile', 'w185').srcSet}
                          sizes="(max-width: 640px) 80px, 96px"
                          alt={person.name || 'Cast member'}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
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
};
