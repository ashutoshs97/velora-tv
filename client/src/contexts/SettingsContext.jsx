import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchHistory, clearHistory as apiClearHistory } from '../api';

const SettingsContext = createContext();

function usePersisted(key, defaultValue) {
  return useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage full */ }
}

export function SettingsProvider({ children }) {
  const [reducedMotion, setReducedMotion] = usePersisted('velora_reduced_motion', false);
  const [theme, setTheme] = usePersisted('velora_theme', 'blue');
  const [fontSize, setFontSize] = usePersisted('velora_font_size', 'md');
  const [heroAutoplay, setHeroAutoplay] = usePersisted('velora_hero_autoplay', true);
  const [trailerAutoplay, setTrailerAutoplay] = usePersisted('velora_trailer_autoplay', true);
  const [hideAdult, setHideAdult] = usePersisted('velora_hide_adult', false);
  const [minRating, setMinRating] = usePersisted('velora_min_rating', 0);
  const [hideWatched, setHideWatched] = usePersisted('velora_hide_watched', false);
  const [defaultServer, setDefaultServer] = usePersisted('velora_default_server', 1);
  const [autoplayNext, setAutoplayNext] = usePersisted('velora_autoplay_next', true);
  const [subtitleLang, setSubtitleLang] = usePersisted('velora_subtitle_lang', 'en');
  const [showSplash, setShowSplash] = usePersisted('velora_show_splash', true);
  const [searchSuggestions, setSearchSuggestions] = usePersisted('velora_search_suggestions', true);
  const [searchHistoryEnabled, setSearchHistoryEnabled] = usePersisted('velora_search_history', true);
  const [ratingSystem, setRatingSystem] = usePersisted('velora_rating_system', 'tmdb');

  // persist on change
  useEffect(() => { persist('velora_reduced_motion', reducedMotion); }, [reducedMotion]);
  useEffect(() => { persist('velora_font_size', fontSize); document.documentElement.setAttribute('data-font', fontSize); }, [fontSize]);
  useEffect(() => { persist('velora_hero_autoplay', heroAutoplay); }, [heroAutoplay]);
  useEffect(() => { persist('velora_trailer_autoplay', trailerAutoplay); }, [trailerAutoplay]);
  useEffect(() => { persist('velora_hide_adult', hideAdult); }, [hideAdult]);
  useEffect(() => { persist('velora_min_rating', minRating); }, [minRating]);
  useEffect(() => { persist('velora_hide_watched', hideWatched); }, [hideWatched]);
  useEffect(() => { persist('velora_default_server', defaultServer); }, [defaultServer]);
  useEffect(() => { persist('velora_autoplay_next', autoplayNext); }, [autoplayNext]);
  useEffect(() => { persist('velora_subtitle_lang', subtitleLang); }, [subtitleLang]);
  useEffect(() => { persist('velora_show_splash', showSplash); }, [showSplash]);
  useEffect(() => { persist('velora_search_suggestions', searchSuggestions); }, [searchSuggestions]);
  useEffect(() => { persist('velora_search_history', searchHistoryEnabled); }, [searchHistoryEnabled]);
  useEffect(() => { persist('velora_rating_system', ratingSystem); }, [ratingSystem]);

  // theme needs DOM side effect
  useEffect(() => {
    persist('velora_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // apply on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font', fontSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearWatchHistory = useCallback(async () => {
    await apiClearHistory();
    window.dispatchEvent(new CustomEvent('velora:history-cleared'));
  }, []);

  const exportWatchHistory = useCallback(async () => {
    try {
      const res = await fetchHistory();
      const data = res.data || [];
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velora-history-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  }, []);

  return (
    <SettingsContext.Provider value={{
      reducedMotion, setReducedMotion,
      theme, setTheme,
      fontSize, setFontSize,
      heroAutoplay, setHeroAutoplay,
      trailerAutoplay, setTrailerAutoplay,
      hideAdult, setHideAdult,
      minRating, setMinRating,
      hideWatched, setHideWatched,
      defaultServer, setDefaultServer,
      autoplayNext, setAutoplayNext,
      subtitleLang, setSubtitleLang,
      showSplash, setShowSplash,
      searchSuggestions, setSearchSuggestions,
      searchHistoryEnabled, setSearchHistoryEnabled,
      ratingSystem, setRatingSystem,
      clearWatchHistory,
      exportWatchHistory,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}