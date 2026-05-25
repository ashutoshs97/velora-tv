import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useState, useCallback, Suspense, lazy } from 'react';
import { useSettings } from './contexts/SettingsContext';
import { init } from '@noriginmedia/norigin-spatial-navigation';

init({
  debug: false,
  visualDebug: false
});
import Layout from './components/Layout';
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
      <Layout>
        <AnimatePresence mode="popLayout">
          <Suspense fallback={<div className="min-h-screen bg-prime-bg" />}>
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
      </Layout>
    </MotionConfig>
  );
}
