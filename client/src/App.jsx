import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Watch from './pages/Watch';
import Person from './pages/Person';

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-prime-bg text-white">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/person/:id" element={<Person />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
