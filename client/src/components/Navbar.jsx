import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Film, X, Menu, Play } from 'lucide-react';

export default function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-colors duration-300 ${
        scrolled ? 'bg-[#0F171E] backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-tight text-white flex items-center">
                Vel{/* Custom play icon embedded in logo text */}
                <div className="inline-flex w-5 h-5 mx-[2px] rounded-sm bg-prime-blue items-center justify-center -translate-y-0.5">
                  <Play size={12} fill="#FFF" className="text-white ml-0.5" />
                </div>
                ra
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8 h-full">
              <Link
                to="/"
                className={`py-6 text-base font-bold transition-all ${
                  isActive('/') 
                  ? 'text-white border-b-2 border-prime-blue' 
                  : 'text-prime-subtext hover:text-white border-b-2 border-transparent hover:border-white/50'
                }`}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`py-6 text-base font-bold transition-all ${
                  isActive('/search') 
                  ? 'text-white border-b-2 border-prime-blue' 
                  : 'text-prime-subtext hover:text-white border-b-2 border-transparent hover:border-white/50'
                }`}
              >
                Find
              </Link>
            </div>
          </div>

          {/* Search Bar & Profile */}
          <div className="hidden md:flex items-center gap-6">
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-prime-subtext group-hover:text-white transition-colors"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search documentaries, movies..."
                  className="w-72 bg-[#1A242F] border border-transparent text-white text-sm font-medium
                             placeholder:text-prime-subtext placeholder:font-normal rounded px-10 py-2 outline-none
                             focus:border-white/30 focus:bg-[#252E39] focus:ring-4 focus:ring-white/10 transition-all shadow-inner"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-prime-subtext hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>

            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-prime-blue to-purple-500 border-2 border-transparent hover:border-white transition-all cursor-pointer shadow-lg" />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-6 bg-[#0F171E] animate-fade-in">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-prime-subtext" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search movies..."
                  className="w-full bg-[#1A242F] border border-transparent text-white text-base
                             placeholder:text-prime-subtext rounded px-10 py-3 outline-none"
                />
              </div>
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMenuOpen(false)} className={`p-3 rounded font-bold ${isActive('/') ? 'bg-prime-surface text-white border-l-4 border-prime-blue' : 'text-prime-subtext hover:text-white'}`}>Home</Link>
              <Link to="/search" onClick={() => setMenuOpen(false)} className={`p-3 rounded font-bold ${isActive('/search') ? 'bg-prime-surface text-white border-l-4 border-prime-blue' : 'text-prime-subtext hover:text-white'}`}>Find</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
