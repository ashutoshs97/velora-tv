import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Star, Calendar, Clock, Globe, Tag, Users, CheckCircle2, Plus, Share2, ListVideo
} from 'lucide-react';
import { fetchMovieDetail, fetchTVDetail, addToHistory } from '../api';
import MultiSourceAggregator from '../components/MultiSourceAggregator';

const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';

export default function Watch() {
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'movie';

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = type === 'tv' ? await fetchTVDetail(id) : await fetchMovieDetail(id);
        const data = res.data;
        setMovie(data);

        // Save to watch history
        const t = data.title || data.name;
        const releaseYear = (data.release_date || data.first_air_date || '').substring(0, 4);

        await addToHistory({
          tmdbId: data.id,
          title: t,
          posterPath: data.poster_path, // Fallback if no backdrop on home
          backdropPath: data.backdrop_path,
          year: releaseYear,
          rating: data.vote_average,
          overview: data.overview,
        }).catch(() => {});

        // Default to season 1, episode 1 if it has seasons
        if (type === 'tv' && data.seasons && data.seasons.length > 0) {
          const firstRealSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
          setSeason(firstRealSeason.season_number || 1);
          setEpisode(1);
        }
      } catch (err) {
        setError('Failed to load movie details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-prime-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg font-bold">{error || 'Movie not found.'}</p>
          <Link to="/" className="btn-primary inline-flex text-sm">
            <ArrowLeft size={16} className="mr-2" /> Go Home
          </Link>
        </div>
      </div>
    );
  }

  const cast = movie.credits?.cast?.slice(0, 15) || [];
  const genres = movie.genres?.map((g) => g.name).join(', ');
  const runtimeMin = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]);
  const runtime = runtimeMin
    ? `${Math.floor(runtimeMin / 60)}h ${runtimeMin % 60}m`
    : null;
  const year = (movie.release_date || movie.first_air_date)?.substring(0, 4);
  const directorName = movie.credits?.crew?.find((c) => c.job === 'Director')?.name || movie.created_by?.[0]?.name || 'Unknown';

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* ── Top Area: The Player (Pitch Black Context) ── */}
      <div className="w-full relative z-10 pt-24 pb-8 bg-black">
        
        <div className="max-w-[1600px] mx-auto w-full px-4 lg:px-8">
          {/* Back button */}
          <div className="mb-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white hover:text-white transition-colors bg-[#1A242F] hover:bg-[#252E39] px-6 py-2.5 rounded-full border border-white/20 w-max shadow-lg"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-bold tracking-wide uppercase">Back to Browse</span>
            </Link>
          </div>
          
          <MultiSourceAggregator tmdbId={id} type={type} season={season} episode={episode} />
          
          {/* TV Season/Episode Selectors */}
          {type === 'tv' && movie && movie.seasons && (
            <div className="mt-8 bg-[#1A242F] border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-prime-blue">
                <ListVideo size={20} />
                <span className="font-bold text-white tracking-wide uppercase text-sm">Episodes</span>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  className="bg-black/50 border border-white/20 text-white text-sm rounded-lg outline-none focus:border-prime-blue px-3 py-2 cursor-pointer"
                  value={season}
                  onChange={(e) => {
                    setSeason(Number(e.target.value));
                    setEpisode(1);
                  }}
                >
                  {movie.seasons.filter(s => s.season_number > 0).map(s => (
                    <option key={s.id} value={s.season_number}>Season {s.season_number}</option>
                  ))}
                </select>
                <select 
                  className="bg-black/50 border border-white/20 text-white text-sm rounded-lg outline-none focus:border-prime-blue px-3 py-2 cursor-pointer"
                  value={episode}
                  onChange={(e) => setEpisode(Number(e.target.value))}
                >
                  {Array.from(
                    { length: movie.seasons.find(s => s.season_number === season)?.episode_count || 24 },
                    (_, i) => (
                      <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                    )
                  )}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Area: X-Ray Tabbed Interface ── */}
      <div className="flex-1 bg-prime-bg relative z-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
          
          {/* Movie core header info */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-3">
                {movie.title || movie.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="flex items-center gap-1 text-[13px] font-bold text-prime-blue">
                  <CheckCircle2 size={14} /> Included with Velora
                </span>
                <span className="text-[14px] font-bold text-prime-subtext border-l border-white/20 pl-4">{year}</span>
                {runtime && <span className="text-[14px] font-bold text-prime-subtext border-l border-white/20 pl-4">{runtime}</span>}
                {type === 'tv' && movie.number_of_seasons && (
                   <span className="text-[14px] font-bold text-prime-subtext border-l border-white/20 pl-4">{movie.number_of_seasons} Seasons</span>
                )}
                <span className="text-[12px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded opacity-90">4K UHD</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button title="Watchlist" className="btn-secondary !p-4"><Plus size={20} /></button>
              <button title="Share" className="btn-secondary !p-4"><Share2 size={20} className="-ml-0.5" /></button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-8 border-b border-white/10 mb-8">
            {['details', 'cast'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-prime-subtext hover:text-white'
                }`}
              >
                {tab === 'details' ? 'Details' : 'Cast & Crew'}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-prime-blue rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'details' && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10 animate-fade-in">
                <div className="lg:col-span-2">
                  {movie.tagline && <p className="text-white/60 italic mb-4 font-medium">"{movie.tagline}"</p>}
                  <p className="text-lg text-white/90 leading-relaxed font-medium">
                    {movie.overview}
                  </p>
                </div>
                <div className="space-y-4 border-l border-white/10 pl-6 lg:pl-10">
                  <div>
                    <span className="text-sm text-prime-subtext block mb-1">{type === 'tv' ? 'Creator' : 'Director'}</span>
                    <span className="text-white font-medium">{directorName}</span>
                  </div>
                  <div>
                    <span className="text-sm text-prime-subtext block mb-1">Genres</span>
                    <span className="text-white font-medium">{genres}</span>
                  </div>
                  <div>
                    <span className="text-sm text-prime-subtext block mb-1">Original Language</span>
                    <span className="text-white font-medium uppercase">{movie.original_language}</span>
                  </div>
                  {movie.vote_average > 0 && (
                    <div>
                      <span className="text-sm text-prime-subtext block mb-1">TMDB Rating</span>
                      <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                        <Star size={16} fill="currentColor" />
                        <span>{movie.vote_average.toFixed(1)} / 10</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'cast' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-fade-in">
                {cast.map((person) => (
                  <div key={person.id} className="flex flex-col items-center text-center group cursor-pointer">
                    <div className="w-28 h-28 rounded-full overflow-hidden mb-3 bg-prime-surface border-[3px] border-transparent group-hover:border-prime-blue transition-colors shadow-xl">
                      {person.profile_path ? (
                        <img
                          src={`${PROFILE_BASE}${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-prime-subtext text-2xl font-bold bg-[#252E39]">
                          {person.name[0]}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white leading-tight mb-1">{person.name}</span>
                    <span className="text-xs text-prime-subtext">{person.character}</span>
                  </div>
                ))}
                {cast.length === 0 && <p className="text-prime-subtext">No cast information available.</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
