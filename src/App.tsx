import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { BeatsPage } from './pages/BeatsPage';
import { LicensingLegalPage } from './pages/LicensingLegalPage';
import { BottomPlayer } from './components/BottomPlayer';
import { InquireModal } from './components/InquireModal';
import { Footer } from './components/Footer';
import { useAudioStore } from './store/useAudioStore';

import beatsData from './data/beats.json';
import { Beat } from './types/beat';

// Scroll to top automatically when route changes
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  const { setPlaylist } = useAudioStore();
  const beats: Beat[] = beatsData as Beat[];

  useEffect(() => {
    // Load generated beats manifest into Zustand store
    setPlaylist(beats);
  }, [setPlaylist, beats]);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
        {/* Header */}
        <Header />

        {/* Multi-Page Routes */}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage beats={beats} />} />
            <Route path="/beats" element={<BeatsPage beats={beats} />} />
            <Route path="/licensing" element={<LicensingLegalPage />} />
            <Route path="*" element={<HomePage beats={beats} />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />

        {/* Persistent Bottom Audio Player & Lead Modal across all pages */}
        <BottomPlayer />
        <InquireModal />
      </div>
    </Router>
  );
};

export default App;
