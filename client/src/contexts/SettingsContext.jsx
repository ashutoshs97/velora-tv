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

export function SettingsProvider({ children }) {
  // ── Existing ──────────────────────────────────────────────────────────────
  const [reducedMotion, setReducedMotion] = usePersisted('velora_reduced_motion', false);
  const [theme, setTheme] = usePersisted('velora_theme', 'blue');

  // ── Appearance ────────────────────────────────────────────────────────────
  const [colorMode, setColorMode] = usePersisted('velora_color_mode', 'dark');   // 'dark' | 'light' | 'amoled'
  const [fontSize, setFontSize] = usePersisted('velora_font_size', 'md');         // 'sm' | 'md' | 'lg'

  // ── Home ──────────────────────────────────────────────────────────────────
  const [heroAutoplay, setHeroAutoplay] = usePersisted('velora_hero_autoplay', true);
  const [trailerAutoplay, setTrailerAutoplay] = usePersisted('velora_trailer_autoplay', true);
  const [hideAdult, setHideAdult] = usePersisted('velora_hide_adult', false);
  const [minRating, setMinRating] = usePersisted('velora_min_rating', 0);         // 0–9
  const [hideWatched, setHideWatched] = usePersisted('velora_hide_watched', false);

  // ── Player ────────────────────────────────────────────────────────────────
  const [defaultServer, setDefaultServer] = usePersisted('velora_default_server', 1); // provider id 1-5
  const [autoplayNext, setAutoplayNext] = usePersisted('velora_autoplay_next', true);
  const [subtitleLang, setSubtitleLang] = usePersisted('velora_subtitle_lang', 'en'); // 'off'|'en'|'hi'

  // ── General ───────────────────────────────────────────────────────────────
  const [showSplash, setShowSplash] = usePersisted('velora_show_splash', true);
  const [searchSuggestions, setSearchSuggestions] = usePersisted('velora_search_suggestions', true);
  const [searchHistoryEnabled, setSearchHistoryEnabled] = usePersisted('velora_search_history', true);
  const [ratingSystem, setRatingSystem] = usePersisted('velora_rating_system', 'tmdb'); // 'tmdb'|'percent'|'stars'

  // ── Apply side-effects ────────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('velora_reduced_motion', JSON.stringify(reducedMotion)); }, [reducedMotion]);
  useEffect(() => { localStorage.setItem('velora_theme', JSON.stringify(theme)); document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('velora_color_mode', JSON.stringify(colorMode)); document.documentElement.setAttribute('data-mode', colorMode); }, [colorMode]);
  useEffect(() => { localStorage.setItem('velora_font_size', JSON.stringify(fontSize)); document.documentElement.setAttribute('data-font', fontSize); }, [fontSize]);
  useEffect(() => { localStorage.setItem('velora_hero_autoplay', JSON.stringify(heroAutoplay)); }, [heroAutoplay]);
  useEffect(() => { localStorage.setItem('velora_trailer_autoplay', JSON.stringify(trailerAutoplay)); }, [trailerAutoplay]);
  useEffect(() => { localStorage.setItem('velora_hide_adult', JSON.stringify(hideAdult)); }, [hideAdult]);
  useEffect(() => { localStorage.setItem('velora_min_rating', JSON.stringify(minRating)); }, [minRating]);
  useEffect(() => { localStorage.setItem('velora_hide_watched', JSON.stringify(hideWatched)); }, [hideWatched]);
  useEffect(() => { localStorage.setItem('velora_default_server', JSON.stringify(defaultServer)); }, [defaultServer]);
  useEffect(() => { localStorage.setItem('velora_autoplay_next', JSON.stringify(autoplayNext)); }, [autoplayNext]);
  useEffect(() => { localStorage.setItem('velora_subtitle_lang', JSON.stringify(subtitleLang)); }, [subtitleLang]);
  useEffect(() => { localStorage.setItem('velora_show_splash', JSON.stringify(showSplash)); }, [showSplash]);
  useEffect(() => { localStorage.setItem('velora_search_suggestions', JSON.stringify(searchSuggestions)); }, [searchSuggestions]);
  useEffect(() => { localStorage.setItem('velora_search_history', JSON.stringify(searchHistoryEnabled)); }, [searchHistoryEnabled]);
  useEffect(() => { localStorage.setItem('velora_rating_system', JSON.stringify(ratingSystem)); }, [ratingSystem]);

  // Apply on initial mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', colorMode);
    document.documentElement.setAttribute('data-font', fontSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data actions ──────────────────────────────────────────────────────────
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
      // existing
      reducedMotion, setReducedMotion,
      theme, setTheme,
      // appearance
      colorMode, setColorMode,
      fontSize, setFontSize,
      // home
      heroAutoplay, setHeroAutoplay,
      trailerAutoplay, setTrailerAutoplay,
      hideAdult, setHideAdult,
      minRating, setMinRating,
      hideWatched, setHideWatched,
      // player
      defaultServer, setDefaultServer,
      autoplayNext, setAutoplayNext,
      subtitleLang, setSubtitleLang,
      // general
      showSplash, setShowSplash,
      searchSuggestions, setSearchSuggestions,
      searchHistoryEnabled, setSearchHistoryEnabled,
      ratingSystem, setRatingSystem,
      // data actions
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
