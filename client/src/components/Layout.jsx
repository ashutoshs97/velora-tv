import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-prime-bg text-white flex flex-col">
      <ScrollToTop />
      <Navbar />
      <div className="flex-1">
        {children}
      </div>
      <footer className="mt-auto border-t border-white/5 bg-[#141d26] py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-prime-subtext text-[11px] sm:text-xs font-medium leading-relaxed opacity-60 hover:opacity-100 transition-opacity duration-300">
            <span className="font-bold text-white/40">Disclaimer:</span> This site hosts zero content. Filing a takedown here is equivalent to suing a phonebook for the content of a phone call. If you truly find a hosted file on our servers, please alert us; we’d be as shocked as you. Until then, stop wasting both of our time.
          </p>
        </div>
      </footer>
    </div>
  );
}
