import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchByGenre, fetchAnimeGenre } from '../api';
import Navbar from '../components/Navbar';
import { Loader2, Play, ChevronRight } from 'lucide-react';

// ── TMDB Genre definitions ────────────────────────────────────────────────────
const MOVIE_GENRES = [
  { id: 28,    label: 'Action',      emoji: '💥', color: 'from-red-600 to-orange-500' },
  { id: 35,    label: 'Comedy',      emoji: '😂', color: 'from-yellow-500 to-amber-400' },
  { id: 18,    label: 'Drama',       emoji: '🎭', color: 'from-indigo-500 to-blue-400' },
  { id: 27,    label: 'Horror',      emoji: '👻', color: 'from-gray-800 to-gray-600' },
  { id: 878,   label: 'Sci-Fi',      emoji: '🚀', color: 'from-cyan-600 to-blue-500' },
  { id: 10749, label: 'Romance',     emoji: '❤️',  color: 'from-pink-500 to-rose-400' },
  { id: 53,    label: 'Thriller',    emoji: '🔪', color: 'from-slate-700 to-slate-500' },
  { id: 99,    label: 'Documentary', emoji: '🎥', color: 'from-emerald-600 to-teal-500' },
  { id: 10751, label: 'Family',      emoji: '👨‍👩‍👧', color: 'from-lime-500 to-green-400' },
  { id: 14,    label: 'Fantasy',     emoji: '✨', color: 'from-purple-600 to-violet-500' },
  { id: 80,    label: 'Crime',       emoji: '🔫', color: 'from-zinc-700 to-zinc-500' },
  { id: 12,    label: 'Adventure',   emoji: '🏔️', color: 'from-amber-600 to-yellow-500' },
];

const TV_GENRES = [
  { id: 10759, label: 'Action & Adventure', emoji: '⚔️',  color: 'from-red-600 to-orange-500' },
  { id: 35,    label: 'Comedy',             emoji: '😂', color: 'from-yellow-500 to-amber-400' },
  { id: 18,    label: 'Drama',              emoji: '🎭', color: 'from-indigo-500 to-blue-400' },
  { id: 9648,  label: 'Mystery',            emoji: '🔍', color: 'from-violet-700 to-purple-500' },
  { id: 10765, label: 'Sci-Fi & Fantasy',   emoji: '🚀', color: 'from-cyan-600 to-blue-500' },
  { id: 10768, label: 'War & Politics',     emoji: '🏛️', color: 'from-slate-700 to-slate-500' },
  { id: 80,    label: 'Crime',              emoji: '🔫', color: 'from-zinc-700 to-zinc-500' },
  { id: 10762, label: 'Kids',               emoji: '🧸', color: 'from-lime-500 to-green-400' },
  { id: 10763, label: 'News',               emoji: '📰', color: 'from-gray-600 to-gray-400' },
  { id: 10764, label: 'Reality',            emoji: '📺', color: 'from-pink-500 to-rose-400' },
  { id: 10766, label: 'Soap',               emoji: '💬', color: 'from-emerald-600 to-teal-500' },
  { id: 10767, label: 'Talk',               emoji: '🎙️', color: 'from-amber-600 to-yellow-500' },
];

// Top 12 curated anime genres from Jikan
const ANIME_GENRES = [
  { id: 1,   label: 'Action',        emoji: '💥', color: 'from-red-600 to-orange-500' },
  { id: 4,   label: 'Comedy',        emoji: '😂', color: 'from-yellow-500 to-amber-400' },
  { id: 8,   label: 'Drama',         emoji: '🎭', color: 'from-indigo-500 to-blue-400' },
  { id: 14,  label: 'Horror',        emoji: '👻', color: 'from-gray-800 to-gray-600' },
  { id: 24,  label: 'Sci-Fi',        emoji: '🤖', color: 'from-cyan-600 to-blue-500' },
  { id: 22,  label: 'Romance',       emoji: '❤️',  color: 'from-pink-500 to-rose-400' },
  { id: 10,  label: 'Fantasy',       emoji: '✨', color: 'from-purple-600 to-violet-500' },
  { id: 37,  label: 'Supernatural',  emoji: '👁️', color: 'from-slate-700 to-violet-600' },
  { id: 40,  label: 'Psychological', emoji: '🧠', color: 'from-fuchsia-700 to-purple-500' },
  { id: 27,  label: 'Shounen',       emoji: '⚡', color: 'from-amber-600 to-orange-400' },
  { id: 36,  label: 'Slice of Life', emoji: '🌸', color: 'from-emerald-500 to-teal-400' },
  { id: 62,  label: 'Isekai',        emoji: '🌀', color: 'from-blue-700 to-cyan-500' },
];

const TYPES = [
  { key: 'movie', label: 'Movies',    genres: MOVIE_GENRES },
  { key: 'tv',    label: 'TV Shows',  genres: TV_GENRES },
  { key: 'anime', label: 'Anime',     genres: ANIME_GENRES },
];

const POSTER_BASE = 'https://image.tmdb.org/t/p/w300';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w500';

function getSafeLink(item, type) {
  if (type === 'anime') return `/anime/${item.mal_id}`;
  return `/watch/${item.id}?type=${type}`;
}

function getImg(item, type) {
  if (type === 'anime') {
    return item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
  }
  const path = item.poster_path || item.backdrop_path;
  return path ? `${POSTER_BASE}${path}` : null;
}

function getTitle(item, type) {
  if (type === 'anime') return item.title_english || item.title;
  return item.title || item.name || 'Untitled';
}

function getRating(item, type) {
  if (type === 'anime') return item.score ? Number(item.score).toFixed(1) : null;
  return item.vote_average > 0 ? Number(item.vote_average).toFixed(1) : null;
}

const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%231A242F'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%238197A4'%3EVelora%3C/text%3E%3C/svg%3E`;

function ContentGrid({ items, type }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-4"
    >
      {items.map((item, idx) => {
        const link = getSafeLink(item, type);
        const img = getImg(item, type);
        const title = getTitle(item, type);
        const rating = getRating(item, type);

        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(idx * 0.025, 0.5) }}
          >
            <Link to={link} className="group block relative rounded-xl overflow-hidden aspect-[2/3] bg-white/5 border border-white/10 hover:border-prime-blue/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.25)] transition-all duration-300">
              <img
                src={img || PLACEHOLDER}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/30">
                    <Play size={20} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </div>
              {/* Title footer */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{title}</p>
                {rating && (
                  <p className="text-yellow-400 text-[10px] font-bold mt-0.5">★ {rating}</p>
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default function Genres() {
  const [activeType, setActiveType] = useState('movie');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef(null);

  const currentTypeData = TYPES.find(t => t.key === activeType);

  const handleTypeChange = (typeKey) => {
    setActiveType(typeKey);
    setSelectedGenre(null);
    setItems([]);
  };

  const handleGenreClick = async (genre) => {
    setSelectedGenre(genre);
    setLoading(true);
    setItems([]);
    // Scroll down to content
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    try {
      let result;
      if (activeType === 'anime') {
        const res = await fetchAnimeGenre(genre.id);
        result = res.data?.data || [];
      } else {
        const res = await fetchByGenre(genre.id, activeType);
        result = res.data?.results || [];
      }
      setItems(result);
    } catch (err) {
      console.error('Failed to fetch genre content:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060A0F] text-white overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 pb-24 mt-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-display mb-2">
            Browse by Genre
          </h1>
          <p className="text-white/50 text-lg">
            Discover your next obsession.
          </p>
        </div>

        {/* Type tabs */}
        <div className="flex gap-2 mb-10 bg-white/5 border border-white/10 p-1.5 rounded-2xl w-fit">
          {TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => handleTypeChange(t.key)}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                activeType === t.key
                  ? 'bg-prime-blue text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Genre Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeType}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12"
          >
            {currentTypeData.genres.map(genre => {
              const isSelected = selectedGenre?.id === genre.id;
              return (
                <motion.button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre)}
                  className={`relative group overflow-hidden rounded-2xl p-5 text-left border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'border-white/40 scale-[1.02] shadow-2xl'
                      : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${genre.color} ${isSelected ? 'opacity-90' : 'opacity-30 group-hover:opacity-60'} transition-opacity duration-300`} />
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
                  {/* Ring indicator */}
                  {isSelected && (
                    <motion.div
                      layoutId="genre-indicator"
                      className="absolute inset-0 rounded-2xl ring-2 ring-white/60"
                    />
                  )}
                  {/* Content */}
                  <div className="relative z-10">
                    <span className="text-3xl mb-3 block">{genre.emoji}</span>
                    <h3 className="text-white font-bold text-[15px] leading-tight">{genre.label}</h3>
                    {isSelected && (
                      <ChevronRight size={16} className="mt-2 text-white/70 animate-bounce-x" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Content section — appears after selecting a genre */}
        <div ref={contentRef}>
          {selectedGenre && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{selectedGenre.emoji}</span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {selectedGenre.label}
                  <span className="ml-3 text-lg font-normal text-white/40">
                    {currentTypeData.label}
                  </span>
                </h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-white/40">
                  <Loader2 className="w-8 h-8 animate-spin text-prime-blue mb-3" />
                  <p className="text-sm font-medium">Loading {selectedGenre.label} {currentTypeData.label}...</p>
                </div>
              ) : items.length > 0 ? (
                <ContentGrid items={items} type={activeType} />
              ) : (
                <div className="text-center py-20 text-white/40">
                  <p>No results found for this genre.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
