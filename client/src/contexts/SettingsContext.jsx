import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('velora_reduced_motion') === 'true';
  });
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('velora_theme') || 'blue';
  });

  useEffect(() => {
    localStorage.setItem('velora_reduced_motion', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('velora_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <SettingsContext.Provider value={{ reducedMotion, setReducedMotion, theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
