import { createContext, useContext, useEffect, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('velora_theme') || 'blue';
  });
  
  const [reducedMotion, setReducedMotion] = useState(() => {
    const saved = localStorage.getItem('velora_reduced_motion');
    if (saved !== null) return saved === 'true';
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('velora_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('velora_reduced_motion', String(reducedMotion));
  }, [reducedMotion]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, reducedMotion, setReducedMotion }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
