import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Menu, Play } from 'lucide-react';

// Placeholder text that cycles in the search bar
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

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Cycling placeholder
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  /* ── Scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Cycling placeholder (only when input is empty & not focused) ── */
  useEffect(() => {
    if (query || searchFocused) return;
    const interval = setInterval(() => {
      // Fade out → swap text → fade in
      setHintVisible(false);
      setTimeout(() => {
        setHintIndex((i) => (i + 1) % SEARCH_HINTS.length);
        setHintVisible(true);
      }, 350);
    }, 3000);
    return () => clearInterval(interval);
  }, [query, searchFocused]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* ── Keyframes injected inline (no CSS file change needed) ── */}
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
        .hint-fade {
          transition: opacity 0.3s ease;
        }
      `}</style>

      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'bg-[#080E14]/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-navbar'
            : 'bg-gradient-to-b from-black/70 to-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="flex items-center justify-between h-[68px]">

            {/* ── Logo + Nav links ── */}
            <div className="flex items-center gap-8">

              {/* Logo */}
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

                {/* ── Frosted Glass Beta Pill ── */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-[3px] rounded-full
                                 text-[9px] font-black tracking-[0.1em] text-amber-400 uppercase
                                 border border-amber-400/30 backdrop-blur-md beta-pill
                                 shadow-[0_0_8px_rgba(251,191,36,0.15)] mt-[1px]">
                  Beta
                </span>
              </Link>

              {/* ── Desktop nav links with hover slide-up underline ── */}
              <div className="hidden md:flex items-center gap-1 h-full">
                {NAV_LINKS.map(({ to, label }) => {
                  const active = isActive(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`nav-link relative px-3.5 py-2 text-[15px] font-semibold rounded-lg
                                  transition-colors duration-200 select-none overflow-hidden
                                  ${active ? 'text-white' : 'text-prime-subtext hover:text-white hover:bg-white/5'}`}
                    >
                      {label}

                      {/* Hover slide-up underline (always rendered, CSS toggles it) */}
                      <span className={`nav-underline absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full
                                        ${active ? 'bg-prime-blue' : 'bg-white/40'}`} />

                      {/* Active neon glow indicator */}
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

            {/* ── Search bar ── */}
            <div className="hidden md:flex items-center gap-4">
              <form onSubmit={handleSearch}>
                <div
                  className={`relative flex items-center transition-all duration-300 ${
                    searchFocused ? 'w-72' : 'w-60'
                  }`}
                >
                  <Search
                    size={15}
                    className={`absolute left-3 z-10 transition-colors duration-200 flex-shrink-0 ${
                      searchFocused ? 'text-prime-blue' : 'text-prime-subtext'
                    }`}
                  />

                  {/* Cycling placeholder rendered as an overlay (not native placeholder) */}
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
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder=""
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
                      className="absolute right-2.5 text-prime-subtext hover:text-white transition-colors z-10"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ── Mobile hamburger ── */}
            <button
              className="md:hidden text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/8 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* ── Mobile dropdown ── */}
          {menuOpen && (
            <div className="md:hidden glass-card mb-3 overflow-hidden">
              <form onSubmit={handleSearch} className="p-4 border-b border-white/6">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-prime-subtext" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search movies, shows…"
                    className="w-full bg-white/5 border border-white/8 text-white text-sm
                               placeholder:text-prime-subtext rounded-xl pl-9 pr-4 py-3 outline-none
                               focus:border-prime-blue/40 transition-colors"
                  />
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
