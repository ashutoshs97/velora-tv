import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { fetchPerson } from '../api';
import CarouselRow from '../components/CarouselRow';

const POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

export default function Person() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFullBio, setShowFullBio] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError(false);
    fetchPerson(id)
      .then(res => {
        setPerson(res.data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-prime-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center">
        <User size={64} className="text-prime-subtext mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Person Not Found</h1>
        <p className="text-prime-subtext mb-6">We couldn't find the requested profile.</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  const profileImg = person.profile_path
    ? `${POSTER_BASE}${person.profile_path}`
    : null;

  // Combine and sort credits by popularity
  const allCredits = [
    ...(person.combined_credits?.cast || []),
    ...(person.combined_credits?.crew || [])
  ];

  // Remove duplicates (someone acting + producing same movie)
  const uniqueCreditsMap = new Map();
  allCredits.forEach(c => {
    if (!uniqueCreditsMap.has(c.id)) {
      uniqueCreditsMap.set(c.id, c);
    }
  });
  
  const knownFor = Array.from(uniqueCreditsMap.values())
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 20);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-24 pb-20"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-prime-subtext hover:text-white transition-colors mb-8 group w-fit"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-semibold uppercase tracking-wider">Back</span>
        </button>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 mb-16">
          {/* Left Col: Photo */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[2/3] relative shadow-2xl shadow-blue-900/20">
              {profileImg ? (
                <img
                  src={profileImg}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-prime-subtext pointer-events-none">
                  <User size={64} />
                </div>
              )}
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              {person.known_for_department && (
                <div className="flex flex-col">
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">Known For</span>
                  <span className="text-white font-medium text-sm">{person.known_for_department}</span>
                </div>
              )}
              {person.birthday && (
                <div className="flex flex-col">
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider relative flex items-center gap-1.5"><Calendar size={12}/> Born</span>
                  <span className="text-white font-medium text-sm">{person.birthday} {person.deathday && `– ${person.deathday}`}</span>
                </div>
              )}
              {person.place_of_birth && (
                <div className="flex flex-col">
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider relative flex items-center gap-1.5"><MapPin size={12}/> Place of Birth</span>
                  <span className="text-white font-medium text-sm">{person.place_of_birth}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Details */}
          <div className="flex-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight">
              {person.name}
            </h1>

            {person.biography && (
              <div className="mb-10">
                <h3 className="text-lg font-bold text-white mb-3 tracking-wide">Biography</h3>
                <div className="relative">
                  <p className={`text-prime-subtext leading-relaxed text-sm sm:text-base ${!showFullBio && 'line-clamp-6'}`}>
                    {person.biography}
                  </p>
                  {!showFullBio && person.biography.length > 500 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-prime-bg to-transparent" />
                  )}
                </div>
                {person.biography.length > 500 && (
                  <button
                    onClick={() => setShowFullBio(!showFullBio)}
                    className="text-prime-blue font-bold text-sm mt-2 hover:text-white transition-colors"
                  >
                    {showFullBio ? 'Read Less' : 'Read More'}
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Known For Section */}
        {knownFor.length > 0 && (
          <div>
            <CarouselRow
              title="Known For"
              movies={knownFor}
              usePoster
            />
          </div>
        )}

      </div>
    </motion.div>
  );
}
