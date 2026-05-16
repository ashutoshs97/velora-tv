import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useEffect, useState, useCallback, Suspense, lazy } from 'react';
import { useSettings } from './contexts/SettingsContext';
import { init } from '@noriginmedia/norigin-spatial-navigation';

init({
  debug: false,
  visualDebug: false
});
import Navbar from './components/Navbar';
import SplashIntro from './components/SplashIntro';

const Home = lazy(() => import('./pages/Home'));
const Search = lazy(() => import('./pages/Search'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Watch = lazy(() => import('./pages/Watch'));
const Person = lazy(() => import('./pages/Person'));
const Movies = lazy(() => import('./pages/Movies'));
const Shows = lazy(() => import('./pages/Shows'));
const ReleaseCalendar = lazy(() => import('./pages/ReleaseCalendar'));
const Genres = lazy(() => import('./pages/Genres'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const { reducedMotion, showSplash } = useSettings();
  const [showIntro, setShowIntro] = useState(
    () => showSplash && !sessionStorage.getItem('velora_intro_shown')
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
            <Suspense fallback={<div className="min-h-screen bg-prime-bg flex items-center justify-center"><div className="w-8 h-8 border-4 border-prime-blue border-t-transparent rounded-full animate-spin"></div></div>}>
              <Routes location={location} key={location.pathname}>
                <Route path="/"          element={<Home />} />
                <Route path="/movies"    element={<Movies />} />
                <Route path="/shows"     element={<Shows />} />
                <Route path="/calendar"  element={<ReleaseCalendar />} />
                <Route path="/genres"    element={<Genres />} />
                <Route path="/search"    element={<Search />} />
                <Route path="/watchlist" element={<Watchlist />} />
                <Route path="/watch/:id" element={<Watch />} />
                <Route path="/person/:id" element={<Person />} />
              </Routes>
            </Suspense>
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
