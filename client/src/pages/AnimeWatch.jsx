import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Globe, Star, Tv } from 'lucide-react';
import { fetchAnimeDetail, fetchAnimeEpisodes, fetchMalToTmdb } from '../api';
import MultiSourceAggregator from '../components/MultiSourceAggregator';

const EPISODES_PER_PAGE = 50;

function isValidId(id) {
  if (!/^\d+$/.test(String(id))) return false;
  return Number(id) > 0;
}

export default function AnimeWatch() {
  const { id } = useParams();

  if (!isValidId(id)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">Invalid anime ID</p>
      </div>
    );
  }

  const malId = Number(id);

  const [anime, setAnime] = useState(null);
  const [animeLoadedId, setAnimeLoadedId] = useState(null);
  const [error, setError] = useState(null);
  const [coverError, setCoverError] = useState(false);

  const [tmdbId, setTmdbId] = useState(null);
  const [tmdbType, setTmdbType] = useState('tv');
  const [tmdbLoaded, setTmdbLoaded] = useState(false);
  const [tmdbError, setTmdbError] = useState(false);

  const [episodes, setEpisodes] = useState([]);
  const [episodesLoadedKey, setEpisodesLoadedKey] = useState('');
  const [epPage, setEpPage] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [selectedSeason, setSelectedSeason] = useState(1);

  // fetch anime details from Jikan
  useEffect(() => {
    let cancelled = false;
    fetchAnimeDetail(malId)
      .then((res) => {
        if (!cancelled) {
          setAnime(res.data?.data || null);
          setAnimeLoadedId(malId);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load anime details.');
      });
    return () => { cancelled = true; };
  }, [malId]);

  // convert MAL ID to TMDB ID
  useEffect(() => {
    let cancelled = false;
    setTmdbLoaded(false);
    setTmdbError(false);
    fetchMalToTmdb(malId)
      .then((res) => {
        if (!cancelled) {
          setTmdbId(res.data.tmdbId);
          setTmdbType(res.data.type || 'tv');
          setTmdbLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTmdbError(true);
          setTmdbLoaded(true);
        }
      });
    return () => { cancelled = true; };
  }, [malId]);

  // fetch episode list from Jikan
  useEffect(() => {
    let cancelled = false;
    fetchAnimeEpisodes(malId, epPage)
      .then((res) => {
        if (!cancelled) {
          setEpisodes(res.data?.data || []);
          setEpisodesLoadedKey(`${malId}:${epPage}`);
        }
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      });
    return () => { cancelled = true; };
  }, [malId, epPage]);

  const coverImg = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url;
  const title = anime?.title_english || anime?.title || 'Loading...';
  const score = anime?.score;
  const totalEpisodes = anime?.episodes || 0;
  const status = anime?.status;
  const year = anime?.year;
  const synopsis = anime?.synopsis;
  const genres = anime?.genres || [];
  const studios = anime?.studios || [];
  const loading = animeLoadedId !== malId;
  const epLoading = episodesLoadedKey !== `${malId}:${epPage}`;

  function selectEpisode(epNumber) {
    setSelectedEpisode(epNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error}</p>
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
      {/* background blur */}
      {coverImg && !coverError && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img
            src={coverImg}
            alt=""
            className="w-full h-full object-cover opacity-5 blur-2xl scale-110"
            onError={() => setCoverError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-prime-bg/60 via-prime-bg/80 to-prime-bg" />
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-16">
        {/* anime info */}
        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          {coverImg && !coverError && (
            <div className="flex-shrink-0">
              <img
                src={coverImg}
                alt={title}
                className="w-48 sm:w-56 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
                onError={() => setCoverError(true)}
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

        {/* player — uses MultiSourceAggregator with TMDB ID */}
        {!tmdbLoaded ? (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-black mb-4">
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <p className="text-prime-subtext text-sm">Finding stream sources...</p>
            </div>
          </div>
        ) : tmdbError ? (
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-black mb-4">
            <div className="w-full aspect-video flex items-center justify-center px-6">
              <div className="max-w-md text-center">
                <AlertCircle size={34} className="text-amber-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">Stream not available</p>
                <p className="text-prime-subtext text-sm">
                  This anime is not available in our streaming database yet.
                  Try searching for it on the main site.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <MultiSourceAggregator
            tmdbId={tmdbId}
            type={tmdbType}
            season={selectedSeason}
            episode={selectedEpisode}
          />
        )}

        {/* episode/season controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 mb-10">
          {/* season selector for multi-season anime */}
          {tmdbType === 'tv' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-prime-subtext font-semibold">Season:</span>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  setSelectedSeason(Number(e.target.value));
                  setSelectedEpisode(1);
                }}
                className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none appearance-none cursor-pointer"
              >
                {Array.from({ length: Math.max(1, Math.ceil(totalEpisodes / 24)) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => selectEpisode(Math.max(1, selectedEpisode - 1))}
              disabled={selectedEpisode <= 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-white font-semibold min-w-[80px] text-center">
              Episode {selectedEpisode}
            </span>
            <button
              onClick={() => selectEpisode(selectedEpisode + 1)}
              disabled={selectedEpisode >= totalEpisodes}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* episode grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Episodes</h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
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
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="h-10 bg-white/5 rounded-lg skeleton" />
              ))}
            </div>
          ) : episodes.length > 0 ? (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {episodes.map((ep) => {
                const epNumber = ep.episode_id || ep.mal_id;
                return (
                  <button
                    key={ep.mal_id}
                    onClick={() => selectEpisode(epNumber)}
                    title={ep.title || `Episode ${epNumber}`}
                    className={`h-10 rounded-lg text-sm font-bold transition-all ${
                      selectedEpisode === epNumber
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-white/5 text-prime-subtext border border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {epNumber}
                  </button>
                );
              })}
            </div>
          ) : totalEpisodes > 0 ? (
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {Array.from({ length: Math.min(totalEpisodes, EPISODES_PER_PAGE) }, (_, i) => {
                const epNumber = i + 1;
                return (
                  <button
                    key={epNumber}
                    onClick={() => selectEpisode(epNumber)}
                    className={`h-10 rounded-lg text-sm font-bold transition-all ${
                      selectedEpisode === epNumber
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                        : 'bg-white/5 text-prime-subtext border border-white/5 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {epNumber}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-prime-subtext text-sm">Episode list unavailable.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}