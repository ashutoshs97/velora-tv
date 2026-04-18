import { useState, useCallback, useEffect, useRef } from 'react';
import { Server, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { getEnabledMovieProviders } from '../config/movieProviders';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getSafeType(raw) {
  return raw === 'tv' ? 'tv' : 'movie';
}

function getProviderUrls(provider, id, type, season, episode) {
  if (!provider || typeof provider.getUrls !== 'function') return [];

  try {
    const urls = provider.getUrls(id, type, season, episode);
    if (!Array.isArray(urls)) return [];
    return urls.filter((url) => typeof url === 'string' && url.trim().length > 0);
  } catch {
    return [];
  }
}

export default function MultiSourceAggregator({
  tmdbId,
  type = 'movie',
  season = 1,
  episode = 1,
}) {
  const providers = getEnabledMovieProviders();
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
  const providerCount = providers.length;
  const safeType = getSafeType(type);
  const safeSeason = Math.max(1, Number(season) || 1);
  const safeEpisode = Math.max(1, Number(episode) || 1);

  const maxRetries = providers.reduce((count, provider) => (
    count + Math.max(getProviderUrls(provider, tmdbId, safeType, safeSeason, safeEpisode).length, 1)
  ), 0);

  const currentServer = providers[activeServer] || providers[0] || null;
  const urls = tmdbId && currentServer
    ? getProviderUrls(currentServer, tmdbId, safeType, safeSeason, safeEpisode)
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

    if (providerCount === 0) {
      setLoading(false);
      setAllFailed(true);
      return;
    }

    if (!tmdbId || !currentServer) return;

    if (!loading) return;

    if (retryCount >= maxRetries) {
      setLoading(false);
      setAllFailed(true);
      return;
    }

    const currentUrls = getProviderUrls(
      currentServer,
      tmdbId,
      safeType,
      safeSeason,
      safeEpisode,
    );

    if (currentUrls.length === 0) {
      setRetryCount(c => c + 1);
      const next = (activeServer + 1) % providerCount;
      setActiveServer(next);
      setMirrorIndex(0);
      setIframeKey(k => k + 1);
      setLoading(true);
      setAutoSwitched(true);
      setUsingMirror(false);
      return;
    }

    loadTimerRef.current = setTimeout(() => {
      setRetryCount(c => c + 1);

      if (mirrorIndex < currentUrls.length - 1) {
        // Try mirror
        setMirrorIndex(m => m + 1);
        setIframeKey(k => k + 1);
        setLoading(true);
        setUsingMirror(true);
      } else {
        // All mirrors tried — next server
        const next = (activeServer + 1) % providerCount;
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
    currentServer, tmdbId, safeType, safeSeason, safeEpisode, maxRetries, providerCount]);

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
    const next = (activeServer + 1) % providerCount;
    setActiveServer(next);
    setMirrorIndex(0);
    setIframeKey(k => k + 1);
    setLoading(true);
    setAutoSwitched(true);
    setUsingMirror(false);
    setRetryCount(0);
    setAllFailed(false);
  }, [activeServer, providerCount]);

  if (!tmdbId) {
    return (
      <div className="rounded-xl border border-white/10 bg-prime-surface p-8 text-center">
        <p className="text-prime-subtext text-sm">No content ID provided</p>
      </div>
    );
  }

  if (!providerCount) {
    return (
      <div className="rounded-xl border border-white/10 bg-prime-surface p-8 text-center">
        <p className="text-prime-subtext text-sm">No enabled movie providers configured</p>
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
            onError={() => {
              setLoading(true);
            }}
            className="w-full h-full"
            style={{ border: 'none' }}
          />
        )}
      </div>

      {/* ── Server Toolbar ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden">
        {/* Subtle glass sheen edge */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-60" />
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



        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {providers.map((server, idx) => {
            const isActive = activeServer === idx;
            return (
              <button
                key={server.id}
                onClick={() => switchServer(idx)}
                className={`relative flex flex-col px-3.5 py-3 rounded-xl text-left transition-all duration-300 ease-out border ${
                  isActive
                    ? 'bg-gradient-to-br from-[#0ea5e9] to-[#2563eb] border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.4)] text-white scale-[1.02] z-10'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/25 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,1)] animate-pulse' : 'bg-white/20'
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
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Hint ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-prime-surface/80 to-transparent border border-white/10 text-xs text-white/75 backdrop-blur-md shadow-lg relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400/80 rounded-l-xl" />
        <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-yellow-400 ml-1" />
        <span className="leading-relaxed">
          <strong className="text-white tracking-wide">Ad-Blocker Recommended:</strong>{' '}
          Third-party servers may show ads. We recommend{' '}
          <strong className="text-white">uBlock Origin</strong>. Servers auto-switch through all
          available routes before stopping.
        </span>
        <button
          onClick={tryNext}
          disabled={providerCount < 2}
          className="ml-auto flex-shrink-0 text-prime-blue hover:text-white text-xs font-semibold whitespace-nowrap transition-colors"
        >
          Try next →
        </button>
      </div>
    </div>
  );
}