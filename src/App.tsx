import React, { useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { BeatsPage } from "./pages/BeatsPage";
import { LicensingLegalPage } from "./pages/LicensingLegalPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/TermsOfServicePage";
import { RefundPolicyPage } from "./pages/RefundPolicyPage";
import { DistributionAdminPage } from "./pages/DistributionAdminPage";
import { BottomPlayer } from "./components/BottomPlayer";
import { InquireModal } from "./components/InquireModal";
import { Footer } from "./components/Footer";
import { UpdatePopup } from "./components/UpdatePopup";
import { useAudioStore } from "./store/useAudioStore";
import { CustomCursor } from "./components/CustomCursor";
import { AnimatePresence } from "framer-motion";

import { ShareModal } from "./components/ShareModal";

import beatsData from "./data/beats.json";
import { Beat } from "./types/beat";

const AppContent: React.FC<{ beats: Beat[] }> = ({ beats }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasInitializedDeepLink = React.useRef(false);

  useEffect(() => {
    if (!beats.length || hasInitializedDeepLink.current) return;

    // Check window.location.search (before hash)
    const windowParams = new URLSearchParams(window.location.search);
    // Check location.search (after hash)
    const routerParams = new URLSearchParams(location.search);
    // Check hash query if any
    let hashQuery = "";
    if (window.location.hash.includes("?")) {
      hashQuery = window.location.hash.split("?")[1];
    }
    const hashParams = new URLSearchParams(hashQuery);

    const targetBeatId =
      routerParams.get("play") ||
      routerParams.get("beat") ||
      windowParams.get("play") ||
      windowParams.get("beat") ||
      hashParams.get("play") ||
      hashParams.get("beat");

    if (targetBeatId) {
      hasInitializedDeepLink.current = true;
      if (location.pathname !== "/beats") {
        navigate(`/beats?play=${encodeURIComponent(targetBeatId)}`, {
          replace: true,
        });
      }
    }
  }, [beats, location.search, location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <CustomCursor />
      {/* Accessible Skip Navigation Link for Screen Readers & Keyboard Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-white focus:text-zinc-950 focus:font-bold focus:rounded-xl focus:shadow-2xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Header */}
      <Header />

      {/* Multi-Page Routes */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        <AnimatePresence
          mode="wait"
          onExitComplete={() => window.scrollTo(0, 0)}
        >
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomePage beats={beats} />} />
            <Route path="/beats" element={<BeatsPage beats={beats} />} />
            <Route path="/licensing" element={<LicensingLegalPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/refund" element={<RefundPolicyPage />} />
            <Route path="/admin" element={<DistributionAdminPage beats={beats} />} />
            <Route path="/distribute" element={<DistributionAdminPage beats={beats} />} />
            <Route path="*" element={<HomePage beats={beats} />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer />

      {/* Persistent Bottom Audio Player, Modals & Alerts across all pages */}
      <BottomPlayer />
      <InquireModal />
      <ShareModal />
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
