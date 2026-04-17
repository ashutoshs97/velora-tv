import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Menu, Play } from 'lucide-react';

const SEARCH_HINTS = [
  'Search "Inception"…',
  'Search "The Boys"…',
  'Search "Oppenheimer"…',
  'Search "Breaking Bad"…',
  'Search "Dune"…',
  'Search "Stranger Things"…',
];

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/search', label: 'Find' },
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
      `}</style>

      <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-[background-color,backdrop-filter,box-shadow] duration-500 ${
      scrolled
      ? 'bg-[#080E14]/85 backdrop-blur-2xl border-b border-white/[0.05] shadow-navbar'
      : 'bg-gradient-to-b from-black/70 to-transparent border-b-0'
      }`}
      >
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="flex items-center justify-between h-[68px]">

            {/* Logo + Nav links */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="relative flex items-center gap-[3px]">
                  <span className="text-[22px] font-black tracking-[-0.03em] text-white font-display leading-none">
                    Vel
                  </span>
                  <div className="inline-flex w-[22px] h-[22px] rounded-md bg-prime-blue items-center justify-center shadow-glow-sm group-hover:shadow-glow-blue transition-all duration-300 -translate-y-[1px] animate-pulse-blue">
                    <Play size={11} fill="#fff" className="ml-[2px]" />
                  </div>
                  <span className="text-[22px] font-black tracking-[-0.03em] text-white font-display leading-none">
                    ra
                  </span>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full
                                 text-[9px] font-black tracking-[0.1em] text-amber-400 uppercase
                                 border border-amber-400/30 backdrop-blur-md beta-pill
                                 shadow-[0_0_8px_rgba(251,191,36,0.15)] mt-[1px]">
                  Beta
                </span>
              </Link>

              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-1 h-full">
                {NAV_LINKS.map(({ to, label }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`nav-link relative px-3.5 py-2 text-[15px] font-semibold rounded-lg
                                  transition-colors duration-200 select-none overflow-hidden
                                  ${active
                                    ? 'text-white'
                                    : 'text-prime-subtext hover:text-white hover:bg-white/5'
                                  }`}
                    >
                      {label}
                      <span className={`nav-underline absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full
                                        ${active ? 'bg-prime-blue' : 'bg-white/40'}`}
                      />
                      {active && (
                        <span
                          className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-prime-blue"
                          style={{ filter: 'blur(3px)', opacity: 0.8 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop search */}
            <div className="hidden md:flex items-center gap-4">
              <form onSubmit={handleSearch}>
                <div className={`relative flex items-center transition-all duration-300 ${
                  searchFocused ? 'w-72' : 'w-60'
                }`}>
                  <Search
                    size={15}
                    className={`absolute left-3 z-10 transition-colors duration-200 flex-shrink-0 ${
                      searchFocused ? 'text-prime-blue' : 'text-prime-subtext'
                    }`}
                  />

                  {/* Cycling placeholder */}
                  {!query && !searchFocused && (
                    <span
                      className="hint-fade pointer-events-none absolute left-9 right-8 text-sm text-prime-subtext/50 truncate"
                      style={{ opacity: hintVisible ? 1 : 0 }}
                    >
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
                    className={`w-full text-white text-sm pl-9 pr-8 py-2.5 rounded-xl
                               outline-none transition-all duration-300
                               ${searchFocused
                                 ? 'bg-prime-surface border border-prime-blue/40 shadow-[0_0_0_3px_rgba(0,180,255,0.12)]'
                                 : 'bg-white/6 border border-white/8 hover:border-white/16'
                               }`}
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Clear search"
                      className="absolute right-2.5 text-prime-subtext hover:text-white transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/8 transition-all"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="md:hidden glass-card mb-3 overflow-hidden">
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
                  {/* Explicit submit button for mobile keyboards */}
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
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all ${
                      isActive(to)
                        ? 'bg-prime-blue/10 text-prime-blue border border-prime-blue/20'
                        : 'text-prime-subtext hover:text-white hover:bg-white/6'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}