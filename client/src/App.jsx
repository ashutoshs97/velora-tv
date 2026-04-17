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
    <div className="min-h-screen bg-prime-bg text-white flex flex-col">
      <Navbar />
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/watch/:id" element={<Watch />} />
            <Route path="/person/:id" element={<Person />} />
          </Routes>
        </AnimatePresence>
      </div>

      <footer className="mt-auto border-t border-white/5 bg-[#141d26] py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-prime-subtext text-[11px] sm:text-xs font-medium leading-relaxed opacity-60 hover:opacity-100 transition-opacity duration-300">
            <span className="font-bold text-white/40">Disclaimer:</span> This site does not store any files on our server. We only link to media which is hosted on 3rd party services.
          </p>
        </div>
      </footer>
    </div>
  );
}
