import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Globe, Star, Tv } from 'lucide-react';
import { fetchAnimeDetail, fetchAnimeEpisodes, fetchAnimeStream } from '../api';

const EPISODES_PER_PAGE = 50;
const IFRAME_LOAD_TIMEOUT_MS = 15000;

export default function AnimeWatch() {
  const { id } = useParams();
  const malId = parseInt(id, 10);

  const [anime, setAnime] = useState(null);
  const [animeLoadedId, setAnimeLoadedId] = useState(null);
  const [error, setError] = useState(null);

  const [episodes, setEpisodes] = useState([]);
  const [episodesLoadedKey, setEpisodesLoadedKey] = useState('');
  const [epPage, setEpPage] = useState(1);

  const [episode, setEpisode] = useState(1);
  const [streamEpisodes, setStreamEpisodes] = useState([]);
  const [streamLoadedId, setStreamLoadedId] = useState(null);
  const [streamError, setStreamError] = useState(null);
  const [streamSourceName, setStreamSourceName] = useState('');
  const [streamProviders, setStreamProviders] = useState([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [playerFailed, setPlayerFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAnimeDetail(malId)
      .then((response) => {
        if (!cancelled) {
          setAnime(response.data?.data || null);
          setAnimeLoadedId(malId);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load anime details.');
      });

    return () => {
      cancelled = true;
    };
  }, [malId]);

  useEffect(() => {
    let cancelled = false;

    fetchAnimeEpisodes(malId, epPage)
      .then((response) => {
        if (!cancelled) {
          setEpisodes(response.data?.data || []);
          setEpisodesLoadedKey(`${malId}:${epPage}`);
        }
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      });

    return () => {
      cancelled = true;
    };
  }, [malId, epPage]);

  useEffect(() => {
    if (!malId) return undefined;

    let cancelled = false;

    fetchAnimeStream(malId)
      .then((response) => {
        const result = response.data || {};
        if (cancelled) return;
        setStreamEpisodes(Array.isArray(result.episodes) ? result.episodes : []);
        setStreamSourceName(result.sourceName || 'Unknown');
        setStreamProviders(Array.isArray(result.providers) ? result.providers : []);
        setStreamLoadedId(malId);
      })
      .catch((err) => {
        if (!cancelled) {
          setStreamError(err?.response?.data?.error || 'No working anime stream source is available right now.');
          setStreamLoadedId(malId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [malId]);

  const coverImg = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url;
  const title = anime?.title_english || anime?.title || 'Loading...';
  const score = anime?.score;
  const totalEpisodes = anime?.episodes || streamEpisodes.length || 0;
  const status = anime?.status;
  const year = anime?.year;
  const synopsis = anime?.synopsis;
  const genres = anime?.genres || [];
  const studios = anime?.studios || [];
  const loading = animeLoadedId !== malId;
  const epLoading = episodesLoadedKey !== `${malId}:${epPage}`;
  const streamLoading = streamLoadedId !== malId;
  const displayError = loading ? null : error;
  const displayStreamError = streamLoading ? null : streamError;
  const visibleStreamEpisodes = useMemo(() => {
    return streamLoading ? [] : streamEpisodes;
  }, [streamLoading, streamEpisodes]);
  const currentEpisode = visibleStreamEpisodes.some((item) => item.ep === episode)
    ? episode
    : (visibleStreamEpisodes[0]?.ep || episode);

  const activeEpisode = useMemo(() => {
    return visibleStreamEpisodes.find((item) => item.ep === currentEpisode) || null;
  }, [visibleStreamEpisodes, currentEpisode]);

  const activeEpisodeUrls = useMemo(() => {
    if (activeEpisode) {
      if (Array.isArray(activeEpisode.urls) && activeEpisode.urls.length > 0) {
        return activeEpisode.urls;
      }

      if (activeEpisode.src) {
        return [activeEpisode.src];
      }
    }

    return [];
  }, [activeEpisode]);

  const activeEpisodeSrc = useMemo(() => {
    return activeEpisodeUrls[sourceIndex] || '';
  }, [activeEpisodeUrls, sourceIndex]);

  const activeProviderName = useMemo(() => {
    const providerNames = [];
    if (activeEpisode && Array.isArray(activeEpisode.providers) && activeEpisode.providers.length > 0) {
      providerNames.push(...activeEpisode.providers);
    }

    return providerNames[sourceIndex] || null;
  }, [activeEpisode, sourceIndex]);

  const allProviderOptions = useMemo(() => {
    const options = [];

    if (activeEpisode && Array.isArray(activeEpisode.providers)) {
      activeEpisode.providers.forEach((provider, idx) => {
        const url = activeEpisodeUrls[idx];
        if (provider && url && !options.some((opt) => opt.provider === provider && opt.url === url)) {
          options.push({ provider, url, kind: 'api' });
        }
      });
    }

    return options;
  }, [activeEpisode, activeEpisodeUrls]);

  useEffect(() => {
    if (!activeEpisodeSrc) return undefined;

    const timer = setTimeout(() => {
      setPlayerLoading(false);
      setPlayerFailed(true);

      if (sourceIndex + 1 < activeEpisodeUrls.length) {
        setSourceIndex((current) => current + 1);
      } else {
        setStreamError(`Episode ${currentEpisode} failed to load from all available providers.`);
      }
    }, IFRAME_LOAD_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [activeEpisodeSrc, activeEpisodeUrls.length, currentEpisode, sourceIndex]);

  function handleIframeLoaded() {
    setPlayerLoading(false);
    setPlayerFailed(false);
  }

  function handleIframeFailed() {
    setPlayerLoading(false);
    setPlayerFailed(true);

    if (sourceIndex + 1 < activeEpisodeUrls.length) {
      setSourceIndex((current) => current + 1);
      return;
    }

    setStreamError(`Episode ${currentEpisode} could not be loaded from available providers.`);
  }

  function chooseProvider(provider) {
    const option = allProviderOptions.find((item) => item.provider === provider);
    if (!option) return;

    const idx = activeEpisodeUrls.findIndex((url) => url === option.url);
    if (idx >= 0) {
      setSourceIndex(idx);
    }

    setPlayerLoading(true);
    setPlayerFailed(false);
    setStreamError(null);
  }

  function selectEpisode(epNumber) {
    setEpisode(epNumber);
    setSourceIndex(0);
    setPlayerLoading(true);
    setPlayerFailed(false);
    setStreamError(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-prime-subtext text-sm">Loading anime...</p>
        </div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">{displayError}</p>
      </div>
    );
  }

  const totalPages = Math.ceil((totalEpisodes || 1) / EPISODES_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {coverImg && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={coverImg} alt="" className="w-full h-full object-cover opacity-5 blur-2xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-prime-bg/60 via-prime-bg/80 to-prime-bg" />
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          {coverImg && (
            <div className="flex-shrink-0">
              <img
                src={coverImg}
                alt={title}
                className="w-48 sm:w-56 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
              />
            </div>
          )}

          <div className="flex-1 pt-2">
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.slice(0, 4).map((g) => (
                <span key={g.mal_id} className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-500/20">
                  {g.name}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">{title}</h1>
            {anime?.title !== anime?.title_english && anime?.title_english && (
              <p className="text-prime-subtext text-sm mb-3">{anime.title}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-prime-subtext">
              {score && (
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star size={14} fill="currentColor" /> {score.toFixed(1)}
                </span>
              )}
              {totalEpisodes > 0 && (
                <span className="flex items-center gap-1">
                  <Tv size={14} /> {totalEpisodes} episodes
                </span>
              )}
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} /> {year}
                </span>
              )}
              {status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  status === 'Currently Airing' ? 'bg-green-600/20 text-green-400' : 'bg-white/10 text-white/70'
                }`}>
                  {status}
                </span>
              )}
              {studios.length > 0 && (
                <span className="flex items-center gap-1">
                  <Globe size={14} /> {studios.map((s) => s.name).join(', ')}
                </span>
              )}
            </div>

            {synopsis && (
              <p className="text-white/70 text-sm leading-relaxed line-clamp-4 max-w-2xl">
                {synopsis.replace('[Written by MAL Rewrite]', '').trim()}
              </p>
            )}

            <a
              href={`https://myanimelist.net/anime/${malId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-xs text-prime-subtext hover:text-white transition-colors"
            >
              <Globe size={12} /> View on MyAnimeList
            </a>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-black mb-4">
          {streamLoading ? (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-prime-subtext text-sm">Finding a working anime stream...</p>
            </div>
          ) : activeEpisodeSrc ? (
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <iframe
                key={`${currentEpisode}-${sourceIndex}-${activeEpisodeSrc}`}
                src={activeEpisodeSrc}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
                title={`${title} Episode ${currentEpisode}`}
                onLoad={handleIframeLoaded}
                onError={handleIframeFailed}
              />
              {playerLoading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <p className="text-prime-subtext text-sm">Loading episode from provider...</p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center px-6">
              <div className="max-w-md text-center">
                <AlertCircle size={34} className="text-amber-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">Stream unavailable</p>
                <p className="text-prime-subtext text-sm">
                  {displayStreamError || 'No working episode source was found for this title.'}
                </p>
                {playerFailed && (
                  <p className="text-prime-subtext text-xs mt-2">Provider blocked or timed out. Try another episode.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2 text-xs text-prime-subtext">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              Source: {streamSourceName || 'AniPub'}
            </span>
            {activeProviderName && (
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                Provider: {activeProviderName}
              </span>
            )}
            {streamEpisodes.length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                {streamEpisodes.length} playable episodes found
              </span>
            )}
            {streamProviders.length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                {streamProviders.length} providers
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEpisode((e) => Math.max(1, e - 1))}
              disabled={episode <= 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-white font-semibold min-w-[80px] text-center">
              Episode {currentEpisode}
            </span>
            <button
              onClick={() => selectEpisode(currentEpisode + 1)}
              disabled={!visibleStreamEpisodes.some((item) => item.ep === currentEpisode + 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {allProviderOptions.length > 1 && (
          <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-wider text-prime-subtext mb-2">Available Sources</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {allProviderOptions.slice(0, 10).map((option) => {
                const active = activeProviderName === option.provider;
                return (
                  <button
                    key={option.provider}
                    onClick={() => chooseProvider(option.provider)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-red-600/80 text-white border-red-500'
                        : 'bg-white/5 text-prime-subtext border-white/10 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {option.provider}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Episodes</h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    onClick={() => setEpPage(pg)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      epPage === pg
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-prime-subtext border border-white/10 hover:text-white'
                    }`}
                  >
                    {(pg - 1) * EPISODES_PER_PAGE + 1}-{Math.min(pg * EPISODES_PER_PAGE, totalEpisodes || pg * EPISODES_PER_PAGE)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {epLoading ? (
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg skeleton" />
              ))}
            </div>
          ) : episodes.length > 0 ? (
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 gap-2">
              {episodes.map((ep) => {
                const epNumber = ep.episode_id || ep.mal_id;
                const isPlayable = visibleStreamEpisodes.some((item) => item.ep === epNumber);

                return (
                  <button
                    key={ep.mal_id}
                    onClick={() => selectEpisode(epNumber)}
                    disabled={!isPlayable}
                    title={ep.title || `Episode ${epNumber}`}
                    className={`h-10 rounded-lg text-sm font-bold transition-all ${
                      currentEpisode === epNumber
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : isPlayable
                          ? 'bg-white/5 text-prime-subtext border border-white/5 hover:bg-white/10 hover:text-white'
                          : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {epNumber}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-prime-subtext text-sm">Episode list unavailable.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
