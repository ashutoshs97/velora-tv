import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { initNavigation } from '@noriginmedia/norigin-spatial-navigation';
import './index.css';
import App from './App.jsx';

// If running in Android Capacitor wrapper, enable TV Navigation
if (window.navigator.userAgent.includes('Android') && window.innerWidth > 800) {
  initNavigation({
    debug: false,
    visualDebug: false,
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SettingsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </SettingsProvider>
  </StrictMode>
);
