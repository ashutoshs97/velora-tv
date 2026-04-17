import { useState, useCallback, useEffect, useRef } from 'react';
import { Server, RefreshCw, AlertCircle, Zap } from 'lucide-react';

const SERVERS = [
  {
    id: 1, name: 'Server 1', label: 'VidLink', sublabel: 'vidlink.pro',
    badge: 'HD', recommended: true,
    getUrls: (id, type, s, e) => {
      const params = ['player=jw','primaryColor=ffffff','secondaryColor=a8a8a8',
        'iconColor=ffffff','autoplay=true','nextbutton=false'].join('&');
      return type === 'tv'
        ? [`https://vidlink.pro/tv/${id}/${s}/${e}?${params}`,
           `https://vidlink.pro/tv/${id}/${s}/${e}?autoplay=true`]
        : [`https://vidlink.pro/movie/${id}?${params}`,
           `https://vidlink.pro/movie/${id}?autoplay=true`];
    },
  },
  {
    id: 2, name: 'Server 2', label: 'VidSrc', sublabel: 'vidsrc.cc',
    badge: 'HD', recommended: true,
    getUrls: (id, type, s, e) => type === 'tv'
      ? [`https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}`,
         `https://vidsrc.to/embed/tv/${id}/${s}/${e}`]
      : [`https://vidsrc.cc/v3/embed/movie/${id}`,
         `https://vidsrc.to/embed/movie/${id}`],
  },
  {
    id: 3, name: 'Server 3', label: 'VidSrc Pro', sublabel: 'vidsrc.pro',
    badge: 'HD', recommended: false,
    getUrls: (id, type, s, e) => type === 'tv'
      ? [`https://vidsrc.pro/embed/tv/${id}/${s}/${e}`,
         `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`]
      : [`https://vidsrc.pro/embed/movie/${id}`,
         `https://vidsrc.xyz/embed/movie?tmdb=${id}`],
  },
  {
    id: 4, name: 'Server 4', label: 'Embed', sublabel: 'embed.su',
    badge: '4K', recommended: false,
    getUrls: (id, type, s, e) => type === 'tv'
      ? [`https://embed.su/embed/tv/${id}/${s}/${e}`,
         `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`]
      : [`https://embed.su/embed/movie/${id}`,
         `https://multiembed.mov/?video_id=${id}&tmdb=1`],
  },
    {
    id: 5,
    name: 'Server 5',
    label: 'MovieAPI',
    sublabel: 'movieapi.club',
    badge: 'HD',
    recommended: false,
    getUrls: (id, type, s, e) =>
      type === 'tv'
        ? [
            `https://movieapi.club/tv/${id}-${s}-${e}`,
            `https://moviesapi.club/tv/${id}-${s}-${e}` // mirror
          ]
        : [
            `https://movieapi.club/movie/${id}`,
            `https://moviesapi.club/movie/${id}` // mirror
          ],
  },
  {
    id: 6, name: 'Server 6', label: '2Embed', sublabel: '2embed.cc',
    badge: 'HD', recommended: false,
    getUrls: (id, type, s, e) => type === 'tv'
      ? [`https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
         `https://2embed.org/embedtv/${id}&s=${s}&e=${e}`]
      : [`https://www.2embed.cc/embedmovie/${id}`,
         `https://2embed.org/embedmovie/${id}`],
  },
  {
    id: 7, name: 'Server 7', label: 'MultiEmbed', sublabel: 'multiembed.mov',
    badge: 'HD', recommended: false,
    getUrls: (id, type, s, e) => type === 'tv'
      ? [`https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
         `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`]
      : [`https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
         `https://multiembed.mov/?video_id=${id}&tmdb=1`],
  },
  {
    id: 8, name: 'Server 8', label: 'Smashy', sublabel: 'smashy.stream',
    badge: 'HD', recommended: false,
    getUrls: (id, type, s, e) => type === 'tv'
      ? [`https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
         `https://smashy.stream/tv/${id}?s=${s}&e=${e}`]
      : [`https://player.smashy.stream/movie/${id}`,
         `https://smashy.stream/movie/${id}`],
  },
];

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getSafeType(raw) {
  return raw === 'tv' ? 'tv' : 'movie';
}

export default function MultiSourceAggregator({
  tmdbId,
  type = 'movie',
  season = 1,
  episode = 1,
}) {
  const [activeServer, setActiveServer] = useState(0);
  const [mirrorIndex, setMirrorIndex] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [autoSwitched, setAutoSwitched] = useState(false);
  const [usingMirror, setUsingMirror] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [allFailed, setAllFailed] = useState(false);
  const loadTimerRef = useRef(null);
  const ios = isIOS();

  const maxRetries = SERVERS.length * 2;
  const safeType = getSafeType(type);
  const safeSeason = Math.max(1, Number(season) || 1);
  const safeEpisode = Math.max(1, Number(episode) || 1);

  const currentServer = SERVERS[activeServer] || SERVERS[0];
  const urls = tmdbId
    ? currentServer.getUrls(tmdbId, safeType, safeSeason, safeEpisode)
    : [];
  const src = urls[mirrorIndex] || urls[0] || '';

  // ── Reset on content change ───────────────────────────────────────────
  useEffect(() => {
    setActiveServer(0);
    setMirrorIndex(0);
    setIframeKey(k => k + 1);
    setLoading(true);
    setAutoSwitched(false);
    setUsingMirror(false);
    setRetryCount(0);
    setAllFailed(false);
  }, [tmdbId, safeType, safeSeason, safeEpisode]);

  // ── Loading timeout — mirror → next server → eventually stop ─────────
  useEffect(() => {
    clearTimeout(loadTimerRef.current);
    if (!loading) return;

    if (retryCount >= maxRetries) {
      setLoading(false);
      setAllFailed(true);
      return;
    }

    loadTimerRef.current = setTimeout(() => {
      const urls = currentServer.getUrls(
        tmdbId, safeType, safeSeason, safeEpisode
      );

      setRetryCount(c => c + 1);

      if (mirrorIndex < urls.length - 1) {
        // Try mirror
        setMirrorIndex(m => m + 1);
        setIframeKey(k => k + 1);
        setLoading(true);
        setUsingMirror(true);
      } else {
        // All mirrors tried — next server
        const next = (activeServer + 1) % SERVERS.length;
        setActiveServer(next);
        setMirrorIndex(0);
        setIframeKey(k => k + 1);
        setLoading(true);
        setAutoSwitched(true);
        setUsingMirror(false);
      }
    }, 10000);

    return () => clearTimeout(loadTimerRef.current);
  }, [loading, iframeKey, mirrorIndex, activeServer, retryCount,
    currentServer, tmdbId, safeType, safeSeason, safeEpisode, maxRetries]);

  useEffect(() => {
    return () => clearTimeout(loadTimerRef.current);
  }, []);

  const switchServer = useCallback((idx) => {
    if (idx === activeServer) return;
    setActiveServer(idx);
    setMirrorIndex(0);
    setIframeKey(k => k + 1);
    setLoading(true);
    setAutoSwitched(false);
    setUsingMirror(false);
    setRetryCount(0);
    setAllFailed(false);
  }, [activeServer]);

  const reload = useCallback(() => {
    setMirrorIndex(0);
    setIframeKey(k => k + 1);
    setLoading(true);
    setUsingMirror(false);
    setRetryCount(0);
    setAllFailed(false);
  }, []);

  const tryNext = useCallback(() => {
    const next = (activeServer + 1) % SERVERS.length;
    setActiveServer(next);
    setMirrorIndex(0);
    setIframeKey(k => k + 1);
    setLoading(true);
    setAutoSwitched(true);
    setUsingMirror(false);
    setRetryCount(0);
    setAllFailed(false);
  }, [activeServer]);

  if (!tmdbId) {
    return (
      <div className="rounded-xl border border-white/10 bg-prime-surface p-8 text-center">
        <p className="text-prime-subtext text-sm">No content ID provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">

      {/* ── Player ── */}
      <div className="player-wrapper relative" style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 gap-3">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-prime-blue border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-prime-blue/30 animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-bold">{currentServer.name}</p>
              <p className="text-prime-subtext text-xs mt-0.5">
                {usingMirror
                  ? `Trying alternate route…`
                  : `Connecting to ${currentServer.label}…`}
              </p>
              {activeServer === 0 && (
                <p className="text-amber-400/70 text-[10px] mt-1">Powered by JW Player</p>
              )}
            </div>
          </div>
        )}

        {/* All servers exhausted — manual selection */}
        {allFailed && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 gap-4 p-4">
            <AlertCircle size={36} className="text-amber-400" />
            <div className="text-center">
              <p className="text-white text-sm font-bold mb-1">
                All Servers Attempted
              </p>
              <p className="text-prime-subtext text-xs mb-4">
                Auto-switching tried all available routes. Please select a server manually.
              </p>
              <button
                onClick={reload}
                className="px-5 py-2.5 bg-prime-blue hover:bg-prime-blue/80 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <RefreshCw size={12} className="inline mr-1.5" />
                Start Over
              </button>
            </div>
          </div>
        )}

        {src && (
          <iframe
            key={iframeKey}
            src={src}
            title={`${currentServer.name} — ${currentServer.label}`}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
            onLoad={() => {
              setLoading(false);
              setAllFailed(false);
            }}
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        )}
      </div>

      {/* ── Server Toolbar ── */}
      <div className="rounded-xl border border-white/10 bg-prime-surface p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Server size={14} className="text-prime-blue flex-shrink-0" />
          <span className="text-xs font-bold text-prime-subtext uppercase tracking-wider">
            Select Streaming Server
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-prime-subtext hidden sm:block">
              {currentServer.name} · {currentServer.label}
            </span>
            <button
              onClick={reload}
              title="Reload"
              className="flex items-center gap-1 text-xs text-prime-subtext hover:text-prime-blue transition-colors"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Reload</span>
            </button>
          </div>
        </div>

        {autoSwitched && (
          <div className="mb-3 bg-prime-blue/10 border border-prime-blue/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <Zap size={13} className="text-prime-blue flex-shrink-0" />
            <p className="text-prime-blue text-xs font-medium">
              Auto-switched to {currentServer.name} · {currentServer.label}
            </p>
          </div>
        )}

        {usingMirror && loading && (
          <div className="mb-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
            <RefreshCw size={13} className="text-prime-subtext flex-shrink-0 animate-spin" />
            <p className="text-prime-subtext text-xs">
              Trying alternate route for {currentServer.label}…
            </p>
          </div>
        )}

        {ios && (
          <div className="mb-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex gap-2 items-start">
            <AlertCircle size={13} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-400/80 text-xs leading-relaxed">
              <strong className="text-blue-400">iOS Tip:</strong> Use{' '}
              <strong className="text-blue-300">Server 1 (VidLink)</strong> for
              the best playback on Apple devices. Watch in landscape for the
              best experience.
            </p>
          </div>
        )}

        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2 items-start">
          <AlertCircle size={13} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-amber-500/80 text-xs leading-relaxed">
            <strong className="text-amber-500">Note:</strong> Servers auto-switch
            if unavailable. Server 1 & 2 recommended for best experience.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SERVERS.map((server, idx) => {
            const isActive = activeServer === idx;
            return (
              <button
                key={server.id}
                onClick={() => switchServer(idx)}
                className={`relative flex flex-col px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-prime-blue text-white shadow-lg shadow-prime-blue/20'
                    : 'bg-prime-bg border border-white/8 text-prime-subtext hover:border-prime-blue/40 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-white animate-pulse' : 'bg-white/20'
                  }`} />
                  <span className="text-xs font-bold text-white truncate">
                    {server.name}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                      server.badge === '4K'
                        ? isActive ? 'bg-white/20 text-white' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : isActive ? 'bg-white/20 text-white' : 'bg-prime-blue/10 text-prime-blue border border-prime-blue/20'
                    }`}>
                      {server.badge}
                    </span>
                    {server.recommended && (
                      <span className={`text-[9px] font-bold ${
                        isActive ? 'text-green-200' : 'text-green-400'
                      }`}>✓</span>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] font-semibold truncate ${
                  isActive ? 'text-white' : 'text-white/80'
                }`}>
                  {server.label}
                </span>
                <span className={`text-[9px] truncate mt-0.5 ${
                  isActive ? 'text-blue-200/70' : 'text-prime-subtext/50'
                }`}>
                  {server.sublabel}
                </span>
                {idx === 0 && (
                  <span className={`mt-1.5 self-start text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    JW Player
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hint ── */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-prime-surface border border-white/10 text-xs text-prime-subtext">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-yellow-400" />
        <span>
          <strong className="text-white">Ad-Blocker Recommended:</strong>{' '}
          Third-party servers may show ads. We recommend{' '}
          <strong>uBlock Origin</strong>. Servers auto-switch through all
          available routes before stopping.
        </span>
        <button
          onClick={tryNext}
          className="ml-auto flex-shrink-0 text-prime-blue hover:text-white text-xs font-semibold whitespace-nowrap transition-colors"
        >
          Try next →
        </button>
      </div>
    </div>
  );
}