import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { BeatsPage } from "./pages/BeatsPage";
import { LicensingLegalPage } from "./pages/LicensingLegalPage";
import { BottomPlayer } from "./components/BottomPlayer";
import { InquireModal } from "./components/InquireModal";
import { Footer } from "./components/Footer";
import { UpdatePopup } from "./components/UpdatePopup";
import { useAudioStore } from "./store/useAudioStore";
import { CustomCursor } from "./components/CustomCursor";
import { AnimatePresence } from "framer-motion";

import beatsData from "./data/beats.json";
import { Beat } from "./types/beat";

const AppContent: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <CustomCursor />
      {/* Header */}
      <Header />

      {/* Multi-Page Routes */}
      <main className="flex-1">
        <AnimatePresence
          mode="wait"
          onExitComplete={() => window.scrollTo(0, 0)}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage beats={beats} />} />
            <Route path="/beats" element={<BeatsPage beats={beats} />} />
            <Route path="/licensing" element={<LicensingLegalPage />} />
            <Route path="*" element={<HomePage beats={beats} />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Persistent Bottom Audio Player & Lead Modal across all pages */}
      <BottomPlayer />
      <InquireModal />
      <UpdatePopup />
    </div>
  );
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
      <AppContent beats={beats} />
    </Router>
  );
};

export default App;
