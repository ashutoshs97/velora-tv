import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, Paintbrush, Type, Moon,
  Home as HomeIcon, Play, Star, EyeOff, Filter,
  Server, SkipForward, Subtitles, Clapperboard,
  Search, History, BarChart2, Trash2, Download, Upload,
  ChevronDown, FileText, Film,
} from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { addToWatchlist, fetchHistory, searchMovies } from '../api';

const THEMES = [
  { id: 'blue',   name: 'Velora Blue',  color: '#2563eb' },
  { id: 'red',    name: 'Netflix Red',  color: '#e50914' },
  { id: 'green',  name: 'Hulu Green',   color: '#1ce783' },
  { id: 'purple', name: 'HBO Purple',   color: '#7c3aed' },
];

const TABS = [
  { id: 'appearance', label: 'Look',    icon: Paintbrush },
  { id: 'home',       label: 'Home',    icon: HomeIcon },
  { id: 'player',     label: 'Player',  icon: Play },
  { id: 'general',    label: 'General', icon: Zap },
  { id: 'data',       label: 'Data',    icon: Download },
];

const SERVERS = [
  { id: 1, label: 'VidSrc Pro' },
  { id: 2, label: 'VidSrc' },
  { id: 3, label: 'VidLink' },
  { id: 4, label: '2Embed' },
  { id: 5, label: 'Smashy' },
];

// ── Reusable primitives ──────────────────────────────────────────────────────

function Toggle({ value, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className="relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      style={{ backgroundColor: value ? 'var(--color-primary, #2563eb)' : 'rgba(255,255,255,0.18)' }}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function Row({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold flex items-center gap-2">
          {Icon && <Icon size={14} className="text-white/40 flex-shrink-0" />}
          {title}
        </p>
        {description && <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children, className = "" }) {
  return (
    <p className={`text-[10px] font-bold uppercase tracking-widest text-white/30 mb-3 mt-1 ${className}`}>{children}</p>
  );
}

// ── Tab panels ───────────────────────────────────────────────────────────────

function AppearanceTab({ s }) {
  return (
    <div>
      <SectionTitle>Font Size</SectionTitle>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[{ id: 'sm', label: 'Small' }, { id: 'md', label: 'Medium' }, { id: 'lg', label: 'Large' }].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => s.setFontSize(id)}
            className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
              s.fontSize === id
                ? 'bg-white/10 border-white/30 text-white'
                : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/8 hover:text-white/80'
            }`}
          >
            <Type size={id === 'sm' ? 10 : id === 'md' ? 13 : 16} className="mx-auto mb-1" />
            {label}
          </button>
        ))}
      </div>

      <SectionTitle>Accent Theme</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => s.setTheme(t.id)}
            aria-label={`Select ${t.name} theme`}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              s.theme === t.id
                ? 'bg-white/10 border-white/30'
                : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100 hover:bg-white/10'
            }`}
          >
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
            <span className="text-sm font-medium text-white">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeTab({ s }) {
  return (
    <div>
      <SectionTitle>Hero Billboard</SectionTitle>
      <Row icon={Play} title="Hero Autoplay" description="Auto-advance hero slides every 10 seconds.">
        <Toggle value={s.heroAutoplay} onChange={s.setHeroAutoplay} label="Toggle hero autoplay" />
      </Row>
      <Row icon={Clapperboard} title="Trailer Autoplay" description="Play trailers automatically after 6 seconds on each hero slide.">
        <Toggle value={s.trailerAutoplay} onChange={s.setTrailerAutoplay} label="Toggle trailer autoplay" />
      </Row>

      <SectionTitle className="mt-5">Content Filters</SectionTitle>
      <Row icon={EyeOff} title="Hide Adult Content" description="Filter out adult-rated titles from all lists.">
        <Toggle value={s.hideAdult} onChange={s.setHideAdult} label="Toggle hide adult content" />
      </Row>
      <Row icon={EyeOff} title="Hide Already Watched" description="Hide titles you've already watched from carousels.">
        <Toggle value={s.hideWatched} onChange={s.setHideWatched} label="Toggle hide watched" />
      </Row>

      <Row icon={Filter} title={`Min. Rating: ${s.minRating === 0 ? 'Off' : `${s.minRating}+`}`} description="Hide titles below this TMDB score.">
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40 w-4 text-right">0</span>
          <input
            type="range"
            min={0} max={9} step={1}
            value={s.minRating}
            onChange={(e) => s.setMinRating(Number(e.target.value))}
            className="w-24 accent-[var(--color-primary)] cursor-pointer"
          />
          <span className="text-xs text-white/40 w-4">9</span>
        </div>
      </Row>
    </div>
  );
}

function PlayerTab({ s }) {
  return (
    <div>
      <SectionTitle>Server</SectionTitle>
      <Row icon={Server} title="Default Server" description="Which embed server loads first when you open a watch page.">
        <div className="relative">
          <select
            value={s.defaultServer}
            onChange={(e) => s.setDefaultServer(Number(e.target.value))}
            className="appearance-none bg-white/10 border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            {SERVERS.map((srv) => (
              <option key={srv.id} value={srv.id} className="bg-[#0f172a]">{srv.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </Row>

      <SectionTitle className="mt-5">TV Shows</SectionTitle>
      <Row icon={SkipForward} title="Autoplay Next Episode" description="Automatically load the next episode when one finishes.">
        <Toggle value={s.autoplayNext} onChange={s.setAutoplayNext} label="Toggle autoplay next episode" />
      </Row>
      <Row icon={Subtitles} title="Subtitle Language" description="Preferred subtitle / caption language in the player.">
        <div className="relative">
          <select
            value={s.subtitleLang}
            onChange={(e) => s.setSubtitleLang(e.target.value)}
            className="appearance-none bg-white/10 border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="off" className="bg-[#0f172a]">Off</option>
            <option value="en" className="bg-[#0f172a]">English</option>
            <option value="hi" className="bg-[#0f172a]">Hindi</option>
            <option value="es" className="bg-[#0f172a]">Spanish</option>
            <option value="fr" className="bg-[#0f172a]">French</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </Row>
    </div>
  );
}

function GeneralTab({ s }) {
  return (
    <div>
      <SectionTitle>App Behaviour</SectionTitle>
      <Row icon={Moon} title="Reduced Motion" description="Disables heavy animations. Recommended for older devices.">
        <Toggle value={s.reducedMotion} onChange={s.setReducedMotion} label="Toggle reduced motion" />
      </Row>
      <Row icon={Play} title="Splash Intro" description="Show animated Velora logo intro on first visit per session.">
        <Toggle value={s.showSplash} onChange={s.setShowSplash} label="Toggle splash intro" />
      </Row>

      <SectionTitle className="mt-5">Search</SectionTitle>
      <Row icon={Search} title="Search Suggestions" description="Show animated placeholder hints while the search bar is empty.">
        <Toggle value={s.searchSuggestions} onChange={s.setSearchSuggestions} label="Toggle search suggestions" />
      </Row>
      <Row icon={History} title="Search History" description="Save recent searches and show them as quick suggestions.">
        <Toggle value={s.searchHistoryEnabled} onChange={s.setSearchHistoryEnabled} label="Toggle search history" />
      </Row>

      <SectionTitle className="mt-5">Display</SectionTitle>
      <Row icon={BarChart2} title="Rating Format" description="How movie scores are displayed on cards.">
        <div className="relative">
          <select
            value={s.ratingSystem}
            onChange={(e) => s.setRatingSystem(e.target.value)}
            className="appearance-none bg-white/10 border border-white/10 rounded-lg pl-3 pr-7 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="tmdb" className="bg-[#0f172a]">TMDB (7.8)</option>
            <option value="percent" className="bg-[#0f172a]">Percent (78%)</option>
            <option value="stars" className="bg-[#0f172a]">Stars (★★★★)</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </Row>
    </div>
  );
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (vals[i] ?? '').trim()]));
  }).filter(row => Object.values(row).some(v => v));
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function isLetterboxdCSV(headers) {
  return headers.includes('Letterboxd URI') || (headers.includes('Name') && headers.includes('Year') && headers.includes('Date'));
}

function historyToCSV(items) {
  const headers = ['tmdbId', 'title', 'year', 'rating', 'overview', 'posterPath', 'backdropPath'];
  const rows = items.map(item => [
    item.tmdbId || item.id || '',
    `"${(item.title || '').replace(/"/g, '""')}"`,
    item.year || '',
    item.rating || '',
    `"${(item.overview || '').replace(/"/g, '""')}"`,
    item.posterPath || '',
    item.backdropPath || '',
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

function DataTab({ s }) {
  const [importFormat, setImportFormat] = useState('json'); // 'json' | 'csv' | 'letterboxd'
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [progress, setProgress] = useState(null); // { done, total } | null
  const fileRef = useRef(null);
  const lbFileRef = useRef(null);
  const csvFileRef = useRef(null);

  const handleClear = async () => {
    if (!window.confirm('Clear your entire watch history? This cannot be undone.')) return;
    await s.clearWatchHistory();
    setImportStatus(null);
  };

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExportCSV = async () => {
    try {
      const res = await fetchHistory();
      const data = res.data || [];
      const csv = historyToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velora-history-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  // ── Import: JSON paste ───────────────────────────────────────────────────────
  const handleImportJSON = async () => {
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error('Not an array');
      setProgress({ done: 0, total: parsed.length });
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (item.tmdbId || item.id) {
          await addToWatchlist({
            tmdbId: item.tmdbId || item.id,
            title: item.title || item.name,
            posterPath: item.posterPath || item.poster_path,
            backdropPath: item.backdropPath || item.backdrop_path,
            year: item.year,
            rating: item.rating || item.vote_average,
            overview: item.overview,
          }).catch(() => {});
        }
        setProgress({ done: i + 1, total: parsed.length });
      }
      setImportStatus('success');
      setImportText('');
      setImporting(false);
      window.dispatchEvent(new CustomEvent('velora:watchlist-updated'));
    } catch {
      setImportStatus('error');
    } finally {
      setProgress(null);
    }
  };

  // ── Import: Velora CSV file ──────────────────────────────────────────────────
  const handleVeloraCSVFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        setProgress({ done: 0, total: rows.length });
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (r.tmdbId) {
            await addToWatchlist({
              tmdbId: Number(r.tmdbId),
              title: r.title,
              year: r.year,
              rating: r.rating ? Number(r.rating) : undefined,
              overview: r.overview,
              posterPath: r.posterPath,
              backdropPath: r.backdropPath,
            }).catch(() => {});
          }
          setProgress({ done: i + 1, total: rows.length });
        }
        setImportStatus('success');
        window.dispatchEvent(new CustomEvent('velora:watchlist-updated'));
      } catch {
        setImportStatus('error');
      } finally {
        setProgress(null);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // ── Import: Letterboxd CSV ───────────────────────────────────────────────────
  const handleLetterboxdFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rows = parseCSV(ev.target.result);
        const headers = Object.keys(rows[0] || {});
        if (!isLetterboxdCSV(headers)) {
          setImportStatus('errorFormat');
          return;
        }
        setProgress({ done: 0, total: rows.length });
        let matched = 0;
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          const name = r['Name'] || r['title'] || '';
          const year = r['Year'] || r['year'] || '';
          if (!name) { setProgress({ done: i + 1, total: rows.length }); continue; }
          try {
            const res = await searchMovies(name);
            const results = res.data?.results || [];
            // Best match: same year, or first result
            const match = results.find(m => {
              const y = (m.release_date || m.first_air_date || '').substring(0, 4);
              return y === String(year);
            }) || results[0];
            if (match?.id) {
              await addToWatchlist({
                tmdbId: match.id,
                title: match.title || match.name,
                year: (match.release_date || match.first_air_date || '').substring(0, 4),
                rating: match.vote_average,
                overview: match.overview,
                posterPath: match.poster_path,
                backdropPath: match.backdrop_path,
              }).catch(() => {});
              matched++;
            }
          } catch { /* skip this entry */ }
          setProgress({ done: i + 1, total: rows.length });
        }
        setImportStatus({ type: 'letterboxd', matched, total: rows.length });
        window.dispatchEvent(new CustomEvent('velora:watchlist-updated'));
      } catch {
        setImportStatus('error');
      } finally {
        setProgress(null);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const resetImport = () => { setImporting(false); setImportStatus(null); setImportText(''); setProgress(null); };

  return (
    <div>
      <SectionTitle>Watch History</SectionTitle>

      {/* Export row */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <button
          onClick={s.exportWatchHistory}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <Download size={14} />
          JSON
        </button>
        <button
          onClick={handleExportCSV}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <FileText size={14} />
          CSV
        </button>
        <button
          onClick={handleClear}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-all"
        >
          <Trash2 size={14} />
          Clear All
        </button>
      </div>

      {/* Import section */}
      <SectionTitle>Import to Watchlist</SectionTitle>

      {/* Format switcher */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-4">
        {[
          { id: 'json',       label: 'Velora JSON' },
          { id: 'csv',        label: 'Velora CSV' },
          { id: 'letterboxd', label: '📽 Letterboxd' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => { setImportFormat(id); setImportStatus(null); setImporting(false); setImportText(''); setProgress(null); }}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
              importFormat === id
                ? 'bg-white/15 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── JSON import ── */}
      {importFormat === 'json' && (
        <div>
          <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
            Paste a JSON array to import items into your watchlist.
          </p>
          {!importing ? (
            <button
              onClick={() => { setImporting(true); setImportStatus(null); }}
              className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <Upload size={14} /> Paste JSON
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='[{"tmdbId": 123, "title": "Movie Name", ...}]'
                rows={5}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/30 resize-none font-mono"
              />
              {progress && (
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={handleImportJSON} disabled={!!progress} className="flex-1 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {progress ? `${progress.done}/${progress.total}…` : 'Import'}
                </button>
                <button onClick={resetImport} className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Velora CSV import ── */}
      {importFormat === 'csv' && (
        <div>
          <p className="text-[11px] text-white/40 mb-3 leading-relaxed">
            Upload a <code className="text-white/60">.csv</code> file to import items into your watchlist.
          </p>
          <input ref={csvFileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleVeloraCSVFile} />
          <button
            onClick={() => csvFileRef.current?.click()}
            disabled={!!progress}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
          >
            <Upload size={14} /> Choose CSV file
          </button>
          {progress && (
            <div className="mt-3 space-y-1">
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
              </div>
              <p className="text-[11px] text-white/40">{progress.done} of {progress.total} entries imported…</p>
            </div>
          )}
        </div>
      )}

      {/* ── Letterboxd CSV import ── */}
      {importFormat === 'letterboxd' && (
        <div>
          <p className="text-[11px] text-white/40 mb-2 leading-relaxed">
            Upload your <strong className="text-white/60">watched.csv</strong> from Letterboxd to import into your watchlist.
          </p>
          <p className="text-[10px] text-white/30 mb-3 leading-relaxed">
            To export from Letterboxd: <em>Profile → Settings → Import &amp; Export → Export Your Data</em>
          </p>
          <input ref={lbFileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleLetterboxdFile} />
          <button
            onClick={() => { setImportStatus(null); lbFileRef.current?.click(); }}
            disabled={!!progress}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-50 transition-all"
          >
            <Film size={14} /> Choose watched.csv
          </button>
          {progress && (
            <div className="mt-3 space-y-1">
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${(progress.done / progress.total) * 100}%`, backgroundColor: 'var(--color-primary)' }} />
              </div>
              <p className="text-[11px] text-white/40">Searching TMDB… {progress.done}/{progress.total}</p>
            </div>
          )}
        </div>
      )}

      {/* Status messages */}
      {importStatus === 'success' && (
        <p className="text-xs text-green-400 mt-3">✓ Imported successfully!</p>
      )}
      {importStatus === 'error' && (
        <p className="text-xs text-red-400 mt-3">✗ Something went wrong. Check the file format and try again.</p>
      )}
      {importStatus === 'errorFormat' && (
        <p className="text-xs text-red-400 mt-3">✗ This doesn't look like a Letterboxd CSV. Make sure you're using <em>watched.csv</em>.</p>
      )}
      {importStatus?.type === 'letterboxd' && (
        <p className="text-xs text-green-400 mt-3">
          ✓ Done — matched {importStatus.matched} of {importStatus.total} titles on TMDB.
        </p>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function SettingsModal({ onClose }) {
  const s = useSettings();
  const [activeTab, setActiveTab] = useState('appearance');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const TAB_CONTENT = {
    appearance: <AppearanceTab s={s} />,
    home:       <HomeTab s={s} />,
    player:     <PlayerTab s={s} />,
    general:    <GeneralTab s={s} />,
    data:       <DataTab s={s} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0b1120] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(90vh, 680px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] bg-white/[0.03] flex-shrink-0">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Zap size={16} style={{ color: 'var(--color-primary, #2563eb)' }} />
            App Settings
          </h2>
          <button onClick={onClose} aria-label="Close settings" className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.07] flex-shrink-0 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                activeTab === id
                  ? 'text-white border-[var(--color-primary)]'
                  : 'text-white/40 border-transparent hover:text-white/70'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {TAB_CONTENT[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.05] bg-black/20 flex-shrink-0 text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-semibold">Velora UI/UX Engine</p>
        </div>
      </motion.div>
    </motion.div>
  );
}