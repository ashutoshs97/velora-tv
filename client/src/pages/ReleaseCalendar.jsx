import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAnimeSchedule } from '../api';
import Navbar from '../components/Navbar';
import AnimeCard from '../components/AnimeCard';
import { Calendar, Loader2 } from 'lucide-react';

const DAYS = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays', 'Unknown'];

export default function ReleaseCalendar() {
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadSettings = async () => {
      try {
        const res = await fetchAnimeSchedule();
        const items = res.data?.data || [];
        
        // Group by day
        const grouped = {
          Mondays: [], Tuesdays: [], Wednesdays: [],
          Thursdays: [], Fridays: [], Saturdays: [], Sundays: [],
          Unknown: []
        };

        items.forEach(anime => {
          let day = anime.broadcast?.day || 'Unknown';
          // Clean up string like "Sundays"
          day = day.split(' ')[0];
          if (!grouped[day]) day = 'Unknown';
          if (anime.images?.jpg?.image_url) {
            grouped[day].push({
              ...anime,
              animeImage: anime.images.jpg.image_url,
              animeId: anime.mal_id
            });
          }
        });

        setSchedule(grouped);
        
        // Default to current day
        const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' }) + 's';
        setActiveDay(grouped[todayStr] ? todayStr : 'Mondays');

      } catch (err) {
        console.error('Failed to load schedule', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#060A0F] text-white selection:bg-prime-blue/30 overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-28 pb-20 mt-10">
        <div className="flex items-center gap-3 mb-8">
          <Calendar className="text-prime-blue w-8 h-8" />
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight font-display">
            Release Schedule
          </h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-prime-blue mb-4" />
            <p>Loading simulcast calendar...</p>
          </div>
        ) : (
          <>
            {/* Days Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-4 mb-8" style={{ scrollbarWidth: 'none' }}>
              {DAYS.map(day => {
                if (!schedule[day] || schedule[day].length === 0) return null;
                const isActive = activeDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    className={`px-6 py-2.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                      isActive 
                      ? 'bg-prime-blue text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {day.replace('s', '')}
                  </button>
                );
              })}
            </div>

            {/* Grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeDay}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6"
              >
                {schedule[activeDay]?.map((anime, idx) => (
                  <motion.div
                    key={anime.mal_id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <AnimeCard anime={anime} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {(!schedule[activeDay] || schedule[activeDay].length === 0) && (
              <div className="text-center text-white/50 py-20">
                No airing anime found for this day.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
