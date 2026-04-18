import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { AlertCircle, Calendar, ChevronLeft, ChevronRight, Globe, Star, Tv } from 'lucide-react';

const JIKAN = 'https://api.jikan.moe/v4';
const ANIPUB = 'https://anipub.xyz';
const EPISODES_PER_PAGE = 50;

async function jikanGet(path) {
  const res = await fetch(`${JIKAN}${path}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

function toSlug(title = '') {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function stripSrcPrefix(link = '') {
  return link.startsWith('src=') ? link.slice(4) : link;
}

function buildEpisodeSources(streamDetails) {
  const local = streamDetails?.local;
  if (!local?.link) return [];

  const episodes = [{ ep: 1, src: stripSrcPrefix(local.link) }];
  (local.ep || []).forEach((entry, index) => {
    const src = stripSrcPrefix(entry?.link || '');
    if (src) {
      episodes.push({ ep: index + 2, src });
    }
  });
  return episodes;
}

async function fetchAniPubStream(anime) {
  const candidateNames = [
    anime?.title_english,
    anime?.title,
    anime?.title_japanese,
  ].filter(Boolean);

  for (const name of candidateNames) {
    const findRes = await fetch(`${ANIPUB}/api/find/${encodeURIComponent(name)}`);
    if (!findRes.ok) continue;

    const match = await findRes.json();
    if (!match?.exist || !match?.id) continue;

    const detailsRes = await fetch(`${ANIPUB}/v1/api/details/${match.id}`);
    if (!detailsRes.ok) continue;

    const details = await detailsRes.json();
    const episodes = buildEpisodeSources(details);
    if (episodes.length > 0) {
      return {
        sourceName: details?.local?.name || name,
        sourceId: match.id,
        episodes,
      };
    }
  }

  for (const name of candidateNames) {
    const slug = toSlug(name);
    if (!slug) continue;

    const infoRes = await fetch(`${ANIPUB}/api/info/${encodeURIComponent(slug)}`);
    if (!infoRes.ok) continue;

    const info = await infoRes.json();
    if (!info?._id) continue;

    const detailsRes = await fetch(`${ANIPUB}/v1/api/details/${info._id}`);
    if (!detailsRes.ok) continue;

    const details = await detailsRes.json();
    const episodes = buildEpisodeSources(details);
    if (episodes.length > 0) {
      return {
        sourceName: details?.local?.name || info?.Name || slug,
        sourceId: info._id,
        episodes,
      };
    }
  }

  throw new Error('No playable episodes found from AniPub');
}

export default function AnimeWatch() {
  const { id } = useParams();
  const malId = parseInt(id, 10);

  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [episodes, setEpisodes] = useState([]);
  const [epLoading, setEpLoading] = useState(true);
  const [epPage, setEpPage] = useState(1);

  const [episode, setEpisode] = useState(1);
  const [streamEpisodes, setStreamEpisodes] = useState([]);
  const [streamLoading, setStreamLoading] = useState(true);
  const [streamError, setStreamError] = useState(null);
  const [streamSourceName, setStreamSourceName] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    jikanGet(`/anime/${malId}/full`)
      .then((r) => {
        if (!cancelled) setAnime(r.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load anime details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [malId]);

  useEffect(() => {
    let cancelled = false;
    setEpLoading(true);

    jikanGet(`/anime/${malId}/episodes?page=${epPage}`)
      .then((r) => {
        if (!cancelled) setEpisodes(r.data || []);
      })
      .catch(() => {
        if (!cancelled) setEpisodes([]);
      })
      .finally(() => {
        if (!cancelled) setEpLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [malId, epPage]);

  useEffect(() => {
    if (!anime) return undefined;

    let cancelled = false;
    setStreamLoading(true);
    setStreamError(null);
    setStreamEpisodes([]);
    setStreamSourceName('');

    fetchAniPubStream(anime)
      .then((result) => {
        if (cancelled) return;
        setStreamEpisodes(result.episodes);
        setStreamSourceName(result.sourceName);
      })
      .catch(() => {
        if (!cancelled) {
          setStreamError('No working anime stream source is available right now.');
        }
      })
      .finally(() => {
        if (!cancelled) setStreamLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [anime]);

  const coverImg = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url;
  const title = anime?.title_english || anime?.title || 'Loading...';
  const score = anime?.score;
  const totalEpisodes = anime?.episodes || streamEpisodes.length || 0;
  const status = anime?.status;
  const year = anime?.year;
  const synopsis = anime?.synopsis;
  const genres = anime?.genres || [];
  const studios = anime?.studios || [];

  const activeEpisodeSrc = useMemo(() => {
    return streamEpisodes.find((item) => item.ep === episode)?.src || '';
  }, [streamEpisodes, episode]);

  useEffect(() => {
    if (!streamEpisodes.length) return;
    if (!streamEpisodes.some((item) => item.ep === episode)) {
      setEpisode(streamEpisodes[0].ep);
    }
  }, [streamEpisodes, episode]);

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
            <iframe
              key={`${episode}-${activeEpisodeSrc}`}
              src={activeEpisodeSrc}
              className="w-full"
              style={{ aspectRatio: '16/9' }}
              allowFullScreen
              allow="autoplay; fullscreen"
              title={`${title} Episode ${episode}`}
            />
          ) : (
            <div className="w-full aspect-video flex items-center justify-center px-6">
              <div className="max-w-md text-center">
                <AlertCircle size={34} className="text-amber-400 mx-auto mb-3" />
                <p className="text-white font-semibold mb-2">Stream unavailable</p>
                <p className="text-prime-subtext text-sm">
                  {streamError || 'No working episode source was found for this title.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-2 text-xs text-prime-subtext">
            <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              Source: {streamSourceName || 'AniPub'}
            </span>
            {streamEpisodes.length > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                {streamEpisodes.length} playable episodes found
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
              Episode {episode}
            </span>
            <button
              onClick={() => setEpisode((e) => e + 1)}
              disabled={!streamEpisodes.some((item) => item.ep === episode + 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

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
                const isPlayable = streamEpisodes.some((item) => item.ep === epNumber);

                return (
                  <button
                    key={ep.mal_id}
                    onClick={() => setEpisode(epNumber)}
                    disabled={!isPlayable}
                    title={ep.title || `Episode ${epNumber}`}
                    className={`h-10 rounded-lg text-sm font-bold transition-all ${
                      episode === epNumber
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
