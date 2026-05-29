import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchSurprise } from '../api';
import { Search, X, Menu, Home, ArrowLeft, Settings, Dices, Calendar as CalIcon, Loader2, Clock, Bookmark } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import FocusableLink from './FocusableLink';
import FocusableButton from './FocusableButton';

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
  { to: '/watchlist', label: 'Watchlist', icon: Bookmark },
];

const MAX_QUERY_LENGTH = 150;

const RollText = ({ text, active }) => (
  <div className="relative overflow-hidden h-[1.4em] flex flex-col justify-start">
    <div className="transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:-translate-y-1/2">
      <span className={`block h-[1.4em] flex items-center ${active ? 'text-white' : 'text-white/70'}`}>
        {text}
      </span>
      <span className="block h-[1.4em] flex items-center text-white">
        {text}
      </span>
    </div>
  </div>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { searchSuggestions, searchHistoryEnabled } = useSettings();

  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollDir, setScrollDir] = useState('up');
  const [searchFocused, setSearchFocused] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [surprising, setSurprising] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  
  const [, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('velora_recent_searches') || '[]'); }
    catch { return []; }
  });

  const isRootPath = ['/', '/movies', '/shows'].includes(location.pathname);

  const inputRef = useRef(null);
  const hintTimerRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const lastScrollY = useRef(0);

  // close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // throttled scroll listener
  useEffect(() => {
    const onScroll = () => {
      if (scrollTimerRef.current) return;
      scrollTimerRef.current = setTimeout(() => {
        const currentScrollY = window.scrollY;
        setScrolled(currentScrollY > 20);
        
        if (currentScrollY > lastScrollY.current + 12) {
          setScrollDir('down');
        } else if (currentScrollY < lastScrollY.current - 12 || currentScrollY <= 20) {
          setScrollDir('up');
        }
        
        lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
        scrollTimerRef.current = null;
      }, 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  // cycling placeholder
  useEffect(() => {
    if (!searchSuggestions || query || searchFocused) return;
    const interval = setInterval(() => {
      setHintVisible(false);
      hintTimerRef.current = setTimeout(() => {
        setHintIndex((i) => (i + 1) % SEARCH_HINTS.length);
        setHintVisible(true);
      }, 350);
    }, 3000);
    return () => {
      clearInterval(interval);
      clearTimeout(hintTimerRef.current);
    };
  }, [query, searchFocused, searchSuggestions]);

  // close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest('nav')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  // cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(hintTimerRef.current);
      clearTimeout(scrollTimerRef.current);
    };
  }, []);

  const handleSurprise = useCallback(async () => {
    if (surprising) return;
    setSurprising(true);
    try {
      const res = await fetchSurprise();
      const item = res.data;
      if (item?.id) {
        navigate(`/watch/${item.id}?type=${item.media_type}`);
        setMenuOpen(false);
      }
    } catch (err) {
      console.error('Surprise failed:', err);
    } finally {
      setSurprising(false);
    }
  }, [surprising, navigate]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      if (searchHistoryEnabled) {
        setRecentSearches(prev => {
          const updated = [trimmed, ...prev.filter(s => s !== trimmed)].slice(0, 8);
          localStorage.setItem('velora_recent_searches', JSON.stringify(updated));
          return updated;
        });
      }
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
      setQuery('');
      setMenuOpen(false);
      inputRef.current?.blur();
    }
  }, [query, navigate, searchHistoryEnabled]);

  const handleQueryChange = useCallback((e) => {
    const val = e.target.value;
    if (val.length <= MAX_QUERY_LENGTH) setQuery(val);
  }, []);

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  return (
    <>
      <style>{`
        .mobile-menu-panel {
          background: rgba(15,25,35,0.88);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow:
            0 18px 48px rgba(0,0,0,0.48),
            inset 0 1px 0 rgba(255,255,255,0.08);
        }
      `}</style>

      {/* desktop header */}
      <header className={`fixed top-0 left-0 right-0 z-[100] pt-6 pointer-events-none hidden md:block transition-transform duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] ${
        scrollDir === 'down' && scrolled ? '-translate-y-[150%]' : 'translate-y-0'
      }`}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          
          {/* logo - fades out when scrolled to reduce overlap */}
          <div className={`pointer-events-auto transition-all duration-700 ease-out flex items-center gap-2 ${
            scrolled ? 'opacity-0 -translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0 hover:scale-105'
          }`}>
            {!isRootPath && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
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

          {/* Center Navigation Pill */}
          <nav
            className={`pointer-events-auto flex items-center p-2 rounded-[28px] transition-all duration-500 ease-out border border-white/10 ${
              scrolled
                ? 'bg-[#0a0a0a]/90 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]'
                : 'bg-[#121212]/80 backdrop-blur-xl shadow-2xl'
            }`}
            onMouseLeave={() => setHoveredNav(null)}
          >
            {/* Center: Nav Links */}
            <div className="flex items-center gap-1 relative px-3">
              {NAV_LINKS.map(({ to, label }) => {
                const active = isActive(to);
                const showPill = hoveredNav ? hoveredNav === to : active;
                
                return (
                  <FocusableLink
                    key={to}
                    to={to}
                    className="relative group px-5 py-2.5 rounded-full text-[15px] font-semibold transition-colors z-10"
                    onMouseEnter={() => setHoveredNav(to)}
                  >
                    {showPill && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white/[0.08] rounded-full -z-10"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    )}
                    <RollText text={label} active={active} />
                  </FocusableLink>
                );
              })}
            </div>

            <div className="w-px h-6 bg-white/10 mx-3" />

            {/* Right side: Search, Settings, Surprise */}
            <div className="flex items-center gap-2 mr-1">
              <FocusableLink
                to="/search"
                className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </FocusableLink>
              <FocusableButton
                onClick={() => setSettingsOpen(true)}
                className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors mr-3"
                aria-label="Settings"
              >
                <Settings size={18} />
              </FocusableButton>

              {/* Gradient Border Surprise Button */}
              <FocusableButton
                onClick={handleSurprise}
                disabled={surprising}
                title="Surprise Me!"
                className="relative p-[2px] rounded-full group overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-shadow duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-orange-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-[#151515] px-5 py-2 rounded-full flex items-center gap-2 text-white font-semibold transition-transform group-active:scale-[0.98]">
                  {surprising ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Dices size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                  )}
                  <span>Surprise Me</span>
                </div>
              </FocusableButton>
            </div>
          </nav>
        </div>
      </header>

      {/* mobile navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex md:hidden flex-col transition-[background-color,backdrop-filter] duration-500 ${
          scrolled || menuOpen
            ? 'bg-[#080E14]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_14px_34px_rgba(0,0,0,0.35)]'
            : 'bg-gradient-to-b from-black/70 to-transparent border-b-0'
        }`}
      >
        <div className="flex items-center justify-between h-[68px] px-5">
          <div className="flex items-center gap-2">
            {!isRootPath && (
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
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
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="text-white p-2"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* mobile dropdown */}
        {menuOpen && (
          <div className="mobile-menu-panel mx-3 mb-3 max-h-[calc(100vh-80px)] overflow-y-auto rounded-2xl border border-white/10">
            {/* search form */}
            <form onSubmit={handleSearch} className="p-4 border-b border-white/5 bg-black/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={searchSuggestions && hintVisible ? SEARCH_HINTS[hintIndex] : 'Search movies & shows...'}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:border-prime-blue focus:bg-white/10 transition-colors"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  maxLength={MAX_QUERY_LENGTH}
                />
                <button
                  type="submit"
                  className="bg-prime-blue text-white px-5 rounded-xl font-bold flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  Go
                </button>
              </div>
            </form>

            {/* surprise button — outside form to avoid submit */}
            <div className="px-4 pb-2 pt-2 border-b border-white/5 bg-black/20">
              <button
                type="button"
                onClick={handleSurprise}
                disabled={surprising}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl text-white font-bold transition-all hover:from-purple-500/40 hover:to-pink-500/40 disabled:opacity-50"
              >
                {surprising ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Dices size={20} />
                )}
                Surprise Me
              </button>
            </div>

            {/* nav links */}
            <div className="p-2">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all ${
                    isActive(to)
                      ? 'bg-white/10 text-white'
                      : 'text-prime-subtext hover:text-white hover:bg-white/[0.08]'
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* settings in mobile menu */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSettingsOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all text-prime-subtext hover:text-white hover:bg-white/[0.08]"
              >
                <Settings size={16} />
                Settings
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* settings modal */}
      <AnimatePresence>
        {settingsOpen && (
          <SettingsModal onClose={() => setSettingsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
