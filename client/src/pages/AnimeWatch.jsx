import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Star, Tv, Calendar, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

const JIKAN = 'https://api.jikan.moe/v4';

async function jikanGet(path) {
  const res = await fetch(`${JIKAN}${path}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

// ── Anime-specific embed servers (accept MAL ID + episode) ────────────────
function getAnimeEmbedUrls(malId, episode, isDub) {
  const lang = isDub ? 'dub' : 'sub';
  return [
    // 2anime — most reliable MAL-ID embed
    `https://2anime.xyz/embed/${malId}/${episode}`,
    // aniBrain player
    `https://player.smashy.stream/anime/${malId}?ep=${episode}`,
    // 9anime fallback
    `https://9anime.pl/watch/anime-${malId}?ep=${episode}`,
    // AniPlay
    `https://aniplay.co/api/mal/${malId}/${episode}/${lang}`,
  ];
}

const SERVERS = [
  { id: 1, name: 'Server 1', label: '2Anime',      badge: 'HD',  recommended: true  },
  { id: 2, name: 'Server 2', label: 'SmashyStream', badge: 'HD',  recommended: false },
  { id: 3, name: 'Server 3', label: '9Anime',       badge: 'HD',  recommended: false },
  { id: 4, name: 'Server 4', label: 'AniPlay',      badge: '4K',  recommended: false },
];

const EPISODES_PER_PAGE = 50;

export default function AnimeWatch() {
  const { id } = useParams();
  const malId = parseInt(id, 10);

  const [anime, setAnime]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const [episodes, setEpisodes]   = useState([]);
  const [epLoading, setEpLoading] = useState(true);
  const [epPage, setEpPage]       = useState(1);
  const [totalEps, setTotalEps]   = useState(0);

  const [episode, setEpisode]     = useState(1);
  const [isDub, setIsDub]         = useState(false);
  const [serverIdx, setServerIdx] = useState(0);
  const [iframeSrc, setIframeSrc] = useState('');

  // ── Load anime detail ─────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    jikanGet(`/anime/${malId}/full`)
      .then(r => { if (!cancelled) setAnime(r.data); })
      .catch(() => { if (!cancelled) setError('Failed to load anime details.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [malId]);

  // ── Load episodes ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setEpLoading(true);
    jikanGet(`/anime/${malId}/episodes?page=${epPage}`)
      .then(r => {
        if (cancelled) return;
        const data = r.data || [];
        setEpisodes(data);
        if (r.pagination?.last_visible_page) {
          setTotalEps(r.pagination.last_visible_page * EPISODES_PER_PAGE);
        }
      })
      .catch(() => { if (!cancelled) setEpisodes([]); })
      .finally(() => { if (!cancelled) setEpLoading(false); });
    return () => { cancelled = true; };
  }, [malId, epPage]);

  // ── Build iframe URL whenever server / episode / dub changes ─────────
  useEffect(() => {
    const urls = getAnimeEmbedUrls(malId, episode, isDub);
    setIframeSrc(urls[serverIdx] || urls[0]);
  }, [malId, episode, isDub, serverIdx]);

  const coverImg = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url;
  const bannerImg = anime?.images?.webp?.image_url || coverImg;
  const title = anime?.title_english || anime?.title || 'Loading…';
  const score = anime?.score;
  const eps = anime?.episodes;
  const status = anime?.status;
  const year = anime?.year;
  const synopsis = anime?.synopsis;
  const genres = anime?.genres || [];
  const studios = anime?.studios || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-prime-subtext text-sm">Loading anime…</p>
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

  // Episode pages
  const totalPages = Math.ceil((eps || 1) / EPISODES_PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* ── Banner ambient ── */}
      {coverImg && (
        <div className="fixed inset-0 z-0 pointer-events-none">
          <img src={coverImg} alt="" className="w-full h-full object-cover opacity-5 blur-2xl scale-110" />
          <div className="absolute inset-0 bg-gradient-to-b from-prime-bg/60 via-prime-bg/80 to-prime-bg" />
        </div>
      )}

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-24 pb-16">

        {/* ── Top info row ── */}
        <div className="flex flex-col lg:flex-row gap-8 mb-10">
          {/* Poster */}
          {coverImg && (
            <div className="flex-shrink-0">
              <img
                src={coverImg}
                alt={title}
                className="w-48 sm:w-56 rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
              />
            </div>
          )}

          {/* Meta */}
          <div className="flex-1 pt-2">
            <div className="flex flex-wrap gap-2 mb-3">
              {genres.slice(0, 4).map(g => (
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
              {eps && (
                <span className="flex items-center gap-1">
                  <Tv size={14} /> {eps} episodes
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
                  <Globe size={14} /> {studios.map(s => s.name).join(', ')}
                </span>
              )}
            </div>

            {synopsis && (
              <p className="text-white/70 text-sm leading-relaxed line-clamp-4 max-w-2xl">
                {synopsis.replace('[Written by MAL Rewrite]', '').trim()}
              </p>
            )}

            {/* External link */}
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

        {/* ── Player ── */}
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/60 ring-1 ring-white/10 bg-black mb-6">
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            className="w-full"
            style={{ aspectRatio: '16/9' }}
            allowFullScreen
            allow="autoplay; fullscreen"
            title={`${title} Episode ${episode}`}
          />
        </div>

        {/* ── Player controls ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          {/* Sub / Dub toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/10">
            {['Sub', 'Dub'].map((lang, i) => (
              <button
                key={lang}
                onClick={() => setIsDub(i === 1)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                  isDub === (i === 1)
                    ? 'bg-white text-black shadow'
                    : 'text-prime-subtext hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Server selector */}
          <div className="flex flex-wrap gap-2">
            {SERVERS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setServerIdx(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  serverIdx === i
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-prime-subtext border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                <span>{s.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-black ${
                  serverIdx === i ? 'bg-black/20 text-black' : 'bg-white/10'
                }`}>{s.badge}</span>
                {s.recommended && serverIdx !== i && (
                  <span className="text-[10px] text-green-400 font-bold">★</span>
                )}
              </button>
            ))}
          </div>

          {/* Episode navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEpisode(e => Math.max(1, e - 1))}
              disabled={episode <= 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-white font-semibold min-w-[80px] text-center">
              Episode {episode}
            </span>
            <button
              onClick={() => setEpisode(e => e + 1)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* ── Episode grid ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Episodes</h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                  <button
                    key={pg}
                    onClick={() => setEpPage(pg)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                      epPage === pg
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-prime-subtext border border-white/10 hover:text-white'
                    }`}
                  >
                    {(pg - 1) * EPISODES_PER_PAGE + 1}–{Math.min(pg * EPISODES_PER_PAGE, eps || pg * EPISODES_PER_PAGE)}
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
              {episodes.map(ep => (
                <button
                  key={ep.mal_id}
                  onClick={() => setEpisode(ep.episode_id || ep.mal_id)}
                  title={ep.title || `Episode ${ep.episode_id}`}
                  className={`h-10 rounded-lg text-sm font-bold transition-all ${
                    episode === (ep.episode_id || ep.mal_id)
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/5 text-prime-subtext border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {ep.episode_id || ep.mal_id}
                </button>
              ))}
            </div>
          ) : (
            /* Fallback: numeric episode selector for long-running shows */
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-20 gap-2">
              {Array.from({ length: Math.min(eps || 12, 100) }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setEpisode(n)}
                  className={`h-10 rounded-lg text-sm font-bold transition-all ${
                    episode === n
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/5 text-prime-subtext border border-white/5 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {n}
                </button>
              ))}
              {eps && eps > 100 && (
                <div className="col-span-full text-center text-prime-subtext text-sm py-2">
                  Showing first 100 episodes — use navigation arrows for more.
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}
