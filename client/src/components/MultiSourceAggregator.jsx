import { useState } from 'react';
import { Server, RefreshCw, AlertCircle } from 'lucide-react';

// ── Only confirmed-working servers (tested against released movies) ────────────
// Status legend: ✅ confirmed loads  ⚠️ geo-dependent  🆕 new
const SERVERS = [
  {
    id: 1,
    name: 'Server 1',
    label: 'VidLink API',
    badge: 'HD',
    recommended: true,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://vidlink.pro/tv/${id}/${s}/${e}` : `https://vidlink.pro/movie/${id}`,
  },
  {
    id: 2,
    name: 'Server 2',
    label: 'VidSrc CC',
    badge: 'HD',
    recommended: true,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://vidsrc.cc/v3/embed/tv/${id}/${s}/${e}` : `https://vidsrc.cc/v3/embed/movie/${id}`,
  },
  {
    id: 3,
    name: 'Server 3',
    label: 'VidSrc RIP',
    badge: '4K',
    recommended: false,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://vidsrc.rip/embed/tv/${id}/${s}/${e}` : `https://vidsrc.rip/embed/movie/${id}`,
  },
  {
    id: 4,
    name: 'Server 4',
    label: 'Embed SU',
    badge: '4K',
    recommended: false,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://embed.su/embed/tv/${id}/${s}/${e}` : `https://embed.su/embed/movie/${id}`,
  },
  {
    id: 5,
    name: 'Server 5',
    label: 'XPrime App',
    badge: 'HD',
    recommended: false,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://xprime.app/embed/tv/${id}/${s}/${e}` : `https://xprime.app/embed/movie/${id}`,
  },
  {
    id: 6,
    name: 'Server 6',
    label: 'SmashyStream',
    badge: 'HD',
    recommended: false,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}` : `https://player.smashy.stream/movie/${id}`,
  },
  {
    id: 7,
    name: 'Server 7',
    label: 'AutoEmbed CC',
    badge: 'HD',
    recommended: false,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` : `https://player.autoembed.cc/embed/movie/${id}`,
  },
  {
    id: 8,
    name: 'Server 8',
    label: 'FilmKu',
    badge: 'HD',
    recommended: false,
    getUrl: (id, type, s, e) => type === 'tv' ? `https://filmku.stream/embed/tv/${id}/${s}/${e}` : `https://filmku.stream/embed/${id}`,
  },
];

export default function MultiSourceAggregator({ tmdbId, type = 'movie', season = 1, episode = 1 }) {
  const [activeServer, setActiveServer] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentServer = SERVERS[activeServer];
  const src = currentServer.getUrl(tmdbId, type, season, episode);

  const switchServer = (idx) => {
    if (idx === activeServer) return;
    setActiveServer(idx);
    setIframeKey((k) => k + 1);
    setLoading(true);
  };

  const reload = () => {
    setIframeKey((k) => k + 1);
    setLoading(true);
  };

  const tryNext = () => {
    const next = (activeServer + 1) % SERVERS.length;
    switchServer(next);
  };

  return (
    <div className="space-y-3">

      {/* ── Server Toolbar ── */}
      <div className="rounded-xl border border-white/10 bg-prime-surface p-3">
        <div className="flex items-center gap-2 mb-3">
          <Server size={14} className="text-prime-blue" />
          <span className="text-xs font-semibold text-prime-subtext uppercase tracking-wider">
            Select Streaming Server
          </span>
          <span className="ml-auto text-xs text-prime-subtext">
            {currentServer.name} active
          </span>
          <button
            onClick={reload}
            id="reload-player-btn"
            title="Reload current server"
            className="flex items-center gap-1 text-xs text-prime-subtext hover:text-prime-blue transition-colors ml-2"
          >
            <RefreshCw size={12} />
            Reload
          </button>
        </div>

        {/* Known Issues Warning */}
        <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 sm:p-4 flex gap-3 items-start">
          <AlertCircle className="shrink-0 text-amber-500 mt-0.5" size={18} />
          <div>
            <p className="text-amber-500 text-sm font-semibold mb-1">Network Route Updated</p>
            <p className="text-amber-500/80 text-xs sm:text-sm leading-relaxed">
              We have permanently promoted our most stable backup APIs to <strong>Server 1</strong> and <strong>Server 2</strong> to bypass recent Geo-blocks. If these encounter heavy traffic, please select an alternative server from the grid.
            </p>
          </div>
        </div>

        {/* 4×2 server grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SERVERS.map((server, idx) => {
            const isActive = activeServer === idx;
            return (
              <button
                key={server.id}
                id={`server-btn-${server.id}`}
                onClick={() => switchServer(idx)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-prime-blue text-white shadow-lg'
                    : 'bg-prime-bg border border-white/10 text-prime-subtext hover:border-prime-blue hover:text-white'
                }`}
              >
                {/* Active dot */}
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-white animate-pulse' : 'bg-white/20'
                  }`}
                />
                <span className="flex flex-col leading-tight min-w-0">
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white'}`}>
                    {server.name}
                  </span>
                  <span className={`text-xs truncate ${isActive ? 'text-blue-200' : 'text-prime-subtext'}`}>
                    {server.label}
                  </span>
                </span>

                {/* Badges */}
                <div className="ml-auto flex flex-col items-end gap-0.5">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      server.badge === '4K'
                        ? isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        : isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-prime-blue/10 text-prime-blue border border-prime-blue/20'
                    }`}
                  >
                    {server.badge}
                  </span>
                  {server.recommended && (
                    <span className={`text-[9px] font-semibold px-1 rounded ${isActive ? 'text-green-200' : 'text-green-400'}`}>
                      ✓ Best
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Player ── */}
      <div
        className="player-wrapper"
        style={{ boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
      >
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 gap-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-prime-blue border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-prime-blue/30 animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-medium">{currentServer.name}</p>
              <p className="text-prime-subtext text-xs mt-0.5">Connecting to {currentServer.label}…</p>
            </div>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={src}
          title={`Velora Player — ${currentServer.name} (${currentServer.label})`}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer"
          onLoad={() => setLoading(false)}
          className="w-full h-full"
        />
      </div>

      {/* ── Hint ── */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-prime-surface border border-white/10 text-xs text-prime-subtext">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-yellow-400" />
        <span>
          <strong className="text-white">Ad-Blocker Recommended:</strong> Third-party stream APIs often trigger popup ads. We highly recommend using an ad-blocker like <strong>uBlock Origin</strong>. If a server fails, simply try the next one.
        </span>
        <button
          onClick={tryNext}
          id="try-next-server-btn"
          className="ml-auto flex-shrink-0 text-prime-blue hover:text-white text-xs font-semibold whitespace-nowrap transition-colors"
        >
          Try next →
        </button>
      </div>
    </div>
  );
}
