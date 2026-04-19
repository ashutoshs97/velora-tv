import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchSurprise } from '../api';
import { Search, X, Menu, Home, ArrowLeft, Settings, Dices, Calendar as CalIcon, Loader2 } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { AnimatePresence } from 'framer-motion';

const SEARCH_HINTS = [
  'Search "Inception"…',
  'Search "The Boys"…',
  'Search "Oppenheimer"…',
  'Search "Breaking Bad"…',
  'Search "Dune"…',
  'Search "Stranger Things"…',
];

const NAV_LINKS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/movies', label: 'Movies' },
  { to: '/shows', label: 'Shows' },
  { to: '/genres', label: 'Genres' },
];

const MAX_QUERY_LENGTH = 150; // ← prevent absurdly long queries

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [surprising, setSurprising] = useState(false);

  const handleSurprise = async () => {
    if (surprising) return;
    setSurprising(true);
    try {
      const res = await fetchSurprise();
      const item = res.data;
      if (item && item.id) {
        navigate(`/watch/${item.id}?type=${item.media_type}`);
        setMenuOpen(false);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSurprising(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();
  const isRootPath = ['/', '/movies', '/shows', '/anime'].includes(location.pathname);

  const inputRef = useRef(null);
  const hintTimerRef = useRef(null); // ← track setTimeout for cleanup
  const scrollTimerRef = useRef(null); // ← throttle scroll

  // ── Close menu on route change ────────────────────────────────────────
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // ── Throttled scroll listener ─────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (scrollTimerRef.current) return;
      scrollTimerRef.current = setTimeout(() => {
        setScrolled(window.scrollY > 20);
        scrollTimerRef.current = null;
      }, 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // ── Cycling placeholder ───────────────────────────────────────────────
  useEffect(() => {
    if (query || searchFocused) return;

    const interval = setInterval(() => {
      setHintVisible(false);
      hintTimerRef.current = setTimeout(() => {
        setHintIndex((i) => (i + 1) % SEARCH_HINTS.length);
        setHintVisible(true);
      }, 350);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(hintTimerRef.current); // ← clean up inner setTimeout
    };
  }, [query, searchFocused]);

  // ── Close menu on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;

    const handleOutsideClick = (e) => {
      if (!e.target.closest('nav')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // ── Cleanup all timers on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      clearTimeout(hintTimerRef.current);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setQuery('');
      setMenuOpen(false);
      inputRef.current?.blur();
    }
  }, [query, navigate]);

  const handleQueryChange = useCallback((e) => {
    // Enforce max length
    const val = e.target.value;
    if (val.length <= MAX_QUERY_LENGTH) {
      setQuery(val);
    }
  }, []);

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  return (
    <>
      <style>{`
        @keyframes betaShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .beta-pill {
          background: linear-gradient(
            90deg,
            rgba(251,191,36,0.08),
            rgba(251,191,36,0.18) 40%,
            rgba(251,191,36,0.08)
          );
          background-size: 200% auto;
          animation: betaShimmer 3s linear infinite;
        }
        .nav-underline {
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-link:hover .nav-underline { transform: scaleX(1); }
        .hint-fade { transition: opacity 0.3s ease; }
        .nav-pill-bg {
          background: rgba(40, 35, 30, 0.4);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
      `}</style>

      {/* Desktop Header Container */}
      <header className="fixed top-0 left-0 right-0 z-[100] pt-6 pointer-events-none hidden md:block transition-all duration-500">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          
          {/* Logo */}
          <div className="pointer-events-auto transition-transform duration-500 hover:scale-105 flex items-center gap-2">
            {!isRootPath && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-white/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] overflow-hidden">
                <span className="text-black font-black text-lg tracking-tighter mix-blend-difference" style={{ WebkitTextStroke: '0.5px white' }}>V</span>
              </div>
              <span className="text-lg font-bold tracking-[0.25em] text-white/90 uppercase font-display select-none">
                ELORA
              </span>
            </Link>
          </div>

          {/* Navigation Pill */}
          <nav
            className={`pointer-events-auto transition-all duration-500 ease-out max-w-fit rounded-full select-none ${
              scrolled ? 'shadow-2xl shadow-black/50 nav-pill-bg border border-white/10' : 'nav-pill-bg border border-transparent shadow-lg'
            }`}
          >
        <div className="flex items-center px-3 py-2 gap-2 sm:gap-6">
          {/* Desktop nav links */}
          <div className="flex items-center gap-1 sm:gap-2">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              
              if (active) {
                return (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-bold text-[15px] shadow-lg shadow-white/10 transition-transform hover:scale-105"
                  >
                    {Icon && <Icon size={18} strokeWidth={2.5} />}
                    <span>{label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  key={to}
                  to={to}
                  onClick={(e) => { if (to.startsWith('#')) e.preventDefault(); }}
                  className="nav-link relative px-4 py-2.5 text-[15px] font-semibold rounded-full
                             transition-colors duration-200 text-prime-subtext hover:text-white"
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Search & Settings */}
          <div className="flex items-center">
            <Link
              to="/search"
              onClick={() => setMenuOpen(false)}
              className="p-2.5 rounded-full transition-colors flex-shrink-0 text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Search"
            >
              <Search size={18} className="translate-y-[1px]" />
            </Link>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2.5 rounded-full transition-colors flex-shrink-0 text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Settings"
            >
              <Settings size={18} className="translate-y-[1px]" />
            </button>
          </div>

          <div className="w-[1px] h-6 bg-white/20 mx-1 hidden sm:block" />

          <button
            onClick={handleSurprise}
            disabled={surprising}
            title="Surprise Me!"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/40 hover:to-pink-500/40 border border-purple-500/30 rounded-full text-white font-bold transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
          >
            {surprising ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Dices size={18} />
            )}
            <span>Surprise</span>
          </button>
        </div>
      </nav>
        </div>
      </header>

      {/* Mobile Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex md:hidden flex-col transition-[background-color,backdrop-filter] duration-500 ${
          scrolled || menuOpen
            ? 'bg-[#080E14]/90 backdrop-blur-xl border-b border-white/[0.05]'
            : 'bg-gradient-to-b from-black/70 to-transparent border-b-0'
        }`}
      >
        <div className="flex items-center justify-between h-[68px] px-5">
          <div className="flex items-center gap-2">
            {!isRootPath && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 text-white/50 hover:text-white rounded-full transition-all"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-white to-white/80 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)] overflow-hidden">
                <span className="text-black font-black text-base tracking-tighter mix-blend-difference" style={{ WebkitTextStroke: '0.5px white' }}>V</span>
              </div>
              <span className="text-base font-bold tracking-[0.25em] text-white/90 uppercase font-display select-none">
                ELORA
              </span>
            </Link>
          </div>
          <button
            className="text-white p-2"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="glass-card mb-3 overflow-hidden">
            <form onSubmit={handleSearch} className="p-4 border-b border-white/5 bg-black/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search movies & shows..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-prime-blue focus:bg-white/10 transition-colors"
                  value={query}
                  onChange={handleQueryChange}
                  maxLength={MAX_QUERY_LENGTH}
                />
                <button
                  type="submit"
                  className="bg-prime-blue text-white px-5 rounded-xl font-bold flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  Go
                </button>
              </div>

              <button
                onClick={handleSurprise}
                disabled={surprising}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-3.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl text-white font-bold transition-all hover:from-purple-500/40 hover:to-pink-500/40 disabled:opacity-50"
              >
                {surprising ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Dices size={20} />
                )}
                Surprise Me (Random)
              </button>
            </form>
            <div className="p-2">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={(e) => { 
                    if (to.startsWith('#')) e.preventDefault(); 
                    else setMenuOpen(false); 
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all text-prime-subtext hover:text-white hover:bg-white/6"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}