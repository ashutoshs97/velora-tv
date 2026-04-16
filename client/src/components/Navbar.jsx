import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Menu, Play } from 'lucide-react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled
          ? 'bg-[#080E14]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-navbar'
          : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Logo + Nav ── */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              {/* Logo mark */}
              <div className="relative flex items-center gap-[3px]">
                <span className="text-[22px] font-black tracking-[-0.03em] text-white font-display leading-none">
                  Vel
                </span>
                <div className="inline-flex w-[22px] h-[22px] rounded-md bg-prime-blue items-center justify-center shadow-glow-sm group-hover:shadow-glow-blue transition-all duration-300 -translate-y-[1px]">
                  <Play size={11} fill="#fff" className="ml-[2px]" />
                </div>
                <span className="text-[22px] font-black tracking-[-0.03em] text-white font-display leading-none">
                  ra
                </span>
              </div>
              {/* Beta chip */}
              <span className="hidden sm:inline-flex items-center px-[6px] py-[2px] rounded-[4px] text-[8px] font-black tracking-[0.08em] text-amber-400 bg-amber-400/10 border border-amber-400/20 uppercase mt-[1px]">
                Beta
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 h-full">
              {[{ to: '/', label: 'Home' }, { to: '/search', label: 'Find' }].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-3 py-2 text-[15px] font-semibold rounded-lg transition-all duration-200 ${
                    isActive(to)
                      ? 'text-white'
                      : 'text-prime-subtext hover:text-white hover:bg-white/5'
                  }`}
                >
                  {label}
                  {isActive(to) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-prime-blue rounded-full shadow-glow-sm" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Search bar ── */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch}>
              <div
                className={`relative flex items-center transition-all duration-300 ${
                  searchFocused ? 'w-72' : 'w-56'
                }`}
              >
                <Search
                  size={15}
                  className={`absolute left-3 transition-colors duration-200 ${
                    searchFocused ? 'text-prime-blue' : 'text-prime-subtext'
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search anything…"
                  className={`w-full text-white text-sm placeholder:text-prime-subtext/60
                             pl-9 pr-8 py-2.5 rounded-xl outline-none transition-all duration-300
                             ${searchFocused
                               ? 'bg-prime-surface border border-prime-blue/40 shadow-glow-sm ring-2 ring-prime-blue/10'
                               : 'bg-white/6 border border-white/8 hover:border-white/15'
                             }`}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 text-prime-subtext hover:text-white transition-colors"
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
              {[{ to: '/', label: 'Home' }, { to: '/search', label: 'Find' }].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
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
  );
}
