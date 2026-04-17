import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Menu, Home, ArrowLeft } from 'lucide-react';

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
];

const MAX_QUERY_LENGTH = 150; // ← prevent absurdly long queries

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const isRootPath = location.pathname === '/' || location.pathname === '/movies' || location.pathname === '/shows';

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
              const active = isActive(to) || label === 'Home'; // Fallback highlight Home for now
              
              if (active && label === 'Home') {
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

          {/* Search */}
          <div className="flex items-center">
            <form onSubmit={handleSearch} className="flex flex-row-reverse items-center justify-start gap-0">
              {/* Expandable input */}
              <div 
                className={`flex items-center overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  searchFocused || query ? 'w-48 sm:w-64 opacity-100 ml-3' : 'w-0 opacity-0 ml-0 pointer-events-none'
                }`}
              >
                <div className="relative w-full">
                  {!query && !searchFocused && (
                    <span className="hint-fade pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-white/50 truncate">
                      {SEARCH_HINTS[hintIndex]}
                    </span>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder=""
                    maxLength={MAX_QUERY_LENGTH}
                    className="w-full bg-black/40 text-white text-sm pl-4 pr-8 py-2 rounded-full outline-none border border-white/10 focus:border-white/30 transition-colors"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Icon visible independently */}
              <button
                type="button"
                onClick={() => {
                  setSearchFocused(true);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className={`p-2.5 rounded-full transition-colors flex-shrink-0
                  ${searchFocused || query ? 'bg-transparent text-white' : 'text-prime-subtext hover:text-white'}
                `}
                aria-label="Search"
              >
                <Search size={22} strokeWidth={2.5} />
              </button>
            </form>
          </div>
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
            <form onSubmit={handleSearch} className="p-4 border-b border-white/6">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-prime-subtext"
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder="Search movies, shows…"
                    maxLength={MAX_QUERY_LENGTH}
                    className="w-full bg-white/5 border border-white/8 text-white text-sm
                               placeholder:text-prime-subtext rounded-xl pl-9 pr-4 py-3
                               outline-none focus:border-prime-blue/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="flex-shrink-0 bg-prime-blue text-white px-4 py-3 rounded-xl text-sm font-semibold"
                >
                  Go
                </button>
              </div>
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
    </>
  );
}