import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useSettings } from './contexts/SettingsContext';
import Navbar from './components/Navbar';
import SplashIntro from './components/SplashIntro';
import Home from './pages/Home';
import Search from './pages/Search';
import Watch from './pages/Watch';
import Person from './pages/Person';
import Movies from './pages/Movies';
import Shows from './pages/Shows';
import ReleaseCalendar from './pages/ReleaseCalendar';
import Genres from './pages/Genres';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const { reducedMotion } = useSettings();
  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem('velora_intro_shown')
  );
  const handleIntroDone = useCallback(() => setShowIntro(false), []);

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'user'}>
      {showIntro && <SplashIntro onDone={handleIntroDone} />}
      <div className="min-h-screen bg-prime-bg text-white flex flex-col">
        <ScrollToTop />
        <Navbar />
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/"          element={<Home />} />
              <Route path="/movies"    element={<Movies />} />
              <Route path="/shows"     element={<Shows />} />
              <Route path="/calendar"  element={<ReleaseCalendar />} />
              <Route path="/genres"    element={<Genres />} />
              <Route path="/search"    element={<Search />} />
              <Route path="/watch/:id" element={<Watch />} />
              <Route path="/person/:id" element={<Person />} />
            </Routes>
          </AnimatePresence>
        </div>

        <footer className="mt-auto border-t border-white/5 bg-[#141d26] py-6 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-prime-subtext text-[11px] sm:text-xs font-medium leading-relaxed opacity-60 hover:opacity-100 transition-opacity duration-300">
              <span className="font-bold text-white/40">Disclaimer:</span> This site hosts zero content. Filing a takedown here is equivalent to suing a phonebook for the content of a phone call. If you truly find a hosted file on our servers, please alert us; we’d be as shocked as you. Until then, stop wasting both of our time.
            </p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
