import {createRoot} from 'react-dom/client';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import App from './App.tsx';
import './index.css';

// Aplikasi bertema gelap: ikon status bar dan navigasi dibuat terang agar terbaca
if (Capacitor.isNativePlatform()) {
  try {
    SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
  } catch {
    // abaikan jika tidak tersedia
  }
}

createRoot(document.getElementById('root')!).render(<App />);
