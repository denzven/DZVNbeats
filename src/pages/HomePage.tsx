import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  Music,
  Sliders,
  Cpu,
  Disc,
  Youtube,
  Download,
  Share2,
} from "lucide-react";
import { useAudioStore } from "../store/useAudioStore";
import { Beat } from "../types/beat";
import { MagneticButton } from "../components/MagneticButton";
import { useCursorStore } from "../store/useCursorStore";
import { resolveUrl } from "../utils/url";

interface HomePageProps {
  beats: Beat[];
}

export const HomePage: React.FC<HomePageProps> = ({ beats }) => {
  const { openInquireModal, openShareModal, playTrack, currentTrack, isPlaying } =
    useAudioStore();
  const { setIsHovering, setText } = useCursorStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const hasAutoPlayed = React.useRef(false);

  const handleShare = (beat: Beat) => {
    openShareModal(beat);
  };

  // Deep linking support on HomePage
  useEffect(() => {
    const routerParams = new URLSearchParams(location.search);
    const windowParams = new URLSearchParams(window.location.search);
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

    if (targetBeatId && !hasAutoPlayed.current) {
      const beatToPlay = beats.find(
        (b) =>
          b.id === targetBeatId ||
          b.id.toLowerCase() === targetBeatId.toLowerCase() ||
          b.legacyIds?.includes(targetBeatId) ||
          b.legacyIds?.some((l) => l.toLowerCase() === targetBeatId.toLowerCase()) ||
          b.filename.toLowerCase().includes(targetBeatId.toLowerCase()) ||
          b.title.toLowerCase() === targetBeatId.toLowerCase(),
      );

      if (beatToPlay) {
        hasAutoPlayed.current = true;
        setTimeout(() => playTrack(beatToPlay), 200);
      }
    }
  }, [location.search, beats, playTrack]);

  const featuredBeats = beats.slice(0, 3);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = ((clientX - left) / width) * 100;
    const y = ((clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3, ease: "easeIn" } },
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="bg-zinc-950 text-zinc-100 min-h-screen"
    >
      {/* Hero Header Section */}
      <section
        onMouseMove={handleMouseMove}
        className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden border-b border-zinc-900 bg-zinc-950"
      >
        {/* Cinematic Video Background */}
        <div className="absolute inset-0 z-0 overflow-hidden bg-zinc-950">
          <video
            src={resolveUrl("/banner.mp4")}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-80 pointer-events-none scale-105"
          />
        </div>

        {/* Interactive Dark Overlay (Reveals bright video underneath cursor) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none bg-zinc-950/85 backdrop-grayscale transition-all duration-75 ease-out"
          style={{
            maskImage: `radial-gradient(circle 600px at ${mousePos.x}% ${mousePos.y}%, transparent 0%, black 100%)`,
            WebkitMaskImage: `radial-gradient(circle 600px at ${mousePos.x}% ${mousePos.y}%, transparent 0%, black 100%)`,
          }}
        />

        {/* Vignette & Transition Gradients */}
        <div className="absolute inset-0 z-10 bg-zinc-950/30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] transition-all duration-75 ease-out"
            style={{
              backgroundImage: `radial-gradient(circle 400px at ${mousePos.x}% ${mousePos.y}%, #ffffff 0%, #a1a1aa 40%, #52525b 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundSize: "100% 100%",
            }}
          >
            HIGH-QUALITY TYPE BEATS FOR <br />
            <span className="italic font-serif">CREATIVE ARTISTS</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto"
          >
            Free tagged and affordable type beats for young artists and
            creators. Get high-quality rap instrumentals instantly with untagged
            WAV downloads, track stems, and direct royalty-free licensing.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/beats"
              className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 group active:scale-95"
            >
              <Music className="w-4 h-4 text-zinc-950" />
              Explore Beats Catalog
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/licensing"
              className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-800 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              View License Terms
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Beats Spotlight Section */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                Featured Beats
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Top Selections
              </h2>
            </div>

            <Link
              to="/beats"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>VIEW ALL {beats.length} BEATS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory scrollbar-none">
            {featuredBeats.map((beat) => (
              <div
                key={beat.id}
                className={`group relative z-10 hover:!z-50 flex-none w-[80vw] sm:w-[320px] flex flex-col justify-between bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-900 hover:border-zinc-600 hover:shadow-xl rounded-2xl p-4 transition-all duration-300 snap-center ${
                  currentTrack?.id === beat.id && isPlaying ? "z-40" : ""
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${beat.status === "Sold" ? "bg-red-500" : "bg-emerald-500 animate-pulse-subtle"}`}
                      ></span>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${beat.status === "Sold" ? "text-red-400" : "text-zinc-400"}`}
                      >
                        {beat.status === "Sold"
                          ? "Sold Exclusive"
                          : "Available"}
                      </span>
                    </div>
                    <span className="bg-zinc-900 text-white font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-zinc-700 uppercase tracking-widest">
                      {beat.status === "Sold"
                        ? "SOLD OUT"
                        : beat.beatType === "Exclusive"
                          ? "EXCLUSIVE"
                          : beat.price === 0
                            ? "FREE"
                            : `$${beat.price || 29}`}
                    </span>
                  </div>

                  {/* Cover Art Frame with Vinyl */}
                  <div className="relative aspect-square w-full rounded-xl bg-zinc-950 mb-4 group-hover:shadow-2xl">
                    {/* Blurred Background Glow for Theming */}
                    {beat.coverArt && (
                      <div
                        className="absolute inset-0 z-0 opacity-30 group-hover:opacity-70 transition-opacity duration-500 rounded-xl"
                        style={{
                          backgroundImage: `url(${resolveUrl(beat.coverArt)})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          filter: "blur(25px) saturate(1.5)",
                        }}
                      />
                    )}

                    {/* Cover Art Itself */}
                    <div
                      className="absolute inset-0 z-20 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 cursor-pointer transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl"
                      onMouseEnter={() => {
                        setIsHovering(true);
                        setText("VIEW");
                      }}
                      onMouseLeave={() => {
                        setIsHovering(false);
                        setText("");
                      }}
                      onClick={() =>
                        navigate("/beats", { state: { playBeatId: beat.id } })
                      }
                    >
                      {beat.coverArt ? (
                        <img
                          src={resolveUrl(beat.coverArt)}
                          alt={beat.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                          <Disc className="w-12 h-12 text-zinc-700" />
                        </div>
                      )}

                      {/* View Button Overlay */}
                      <div className="absolute inset-0 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl transition-transform active:scale-95 hover:scale-110">
                          <ArrowRight className="w-6 h-6 text-zinc-950" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Track Details */}
                  <div className="mb-4">
                    <h3 className="font-bold text-lg text-white group-hover:text-zinc-200 truncate">
                      {beat.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1 flex-wrap">
                      {beat.bpm && (
                        <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                          {beat.bpm} BPM
                        </span>
                      )}
                      {beat.key && (
                        <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                          {beat.key}
                        </span>
                      )}
                      {beat.duration && (
                        <span className="bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                          {beat.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-3 border-t border-zinc-800/60 flex items-center justify-between relative z-20">
                  <button
                    onClick={() =>
                      navigate("/beats", { state: { playBeatId: beat.id } })
                    }
                    className="py-1.5 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    <Music className="w-3.5 h-3.5 fill-current" />
                    View Catalog
                  </button>

                  <div className="flex items-center gap-2">
                    <MagneticButton
                      onClick={() => handleShare(beat)}
                      className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center justify-center"
                      title="Share beat (Includes cover art & auto-play link)"
                    >
                      <Share2 className="w-4 h-4" />
                    </MagneticButton>

                    <MagneticButton
                      onClick={() =>
                        beat.status !== "Sold" && openInquireModal(beat)
                      }
                      className={`px-3 py-1.5 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1 ${
                        beat.status === "Sold"
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70"
                          : "bg-zinc-100 hover:bg-white text-zinc-950"
                      }`}
                    >
                      <Download
                        className={`w-3.5 h-3.5 ${beat.status === "Sold" ? "text-zinc-500" : "text-zinc-950"}`}
                      />
                      {beat.status === "Sold"
                        ? "Unavailable"
                        : beat.beatType === "Exclusive"
                          ? "Purchase"
                          : "Download"}
                    </MagneticButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* YouTube Embed Section */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
                Visuals &amp; Sessions
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-600" />
                DZVNbeats on YouTube
              </h2>
            </div>

            <a
              href="https://www.youtube.com/@DZVNbeats"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex text-xs font-mono text-zinc-400 hover:text-white items-center gap-1.5 transition-colors"
            >
              <span>SUBSCRIBE TO CHANNEL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Primary Video Embed */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl relative">
              <iframe
                className="absolute inset-0 w-full h-full"
                src="https://www.youtube.com/embed/videoseries?list=UUkfS_Y1tV8YIphaoUIoBgrA"
                title="DZVNbeats Latest YouTube Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-4">
                Watch The Process
              </h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Subscribe to the official DZVNbeats YouTube channel for the
                latest beat uploads, studio sessions, and exclusive
                behind-the-scenes content. Stay updated with all the new drops.
              </p>
              <a
                href="https://www.youtube.com/@DZVNbeats"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg w-max active:scale-95"
              >
                <Youtube className="w-4 h-4 fill-current" />
                Visit YouTube Channel
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Studio Value Proposition */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <Cpu className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                High-End Analog &amp; Digital Hybrid
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Crafted using premium synthesizer hardware, analog warmth, and
                industry-standard mixing chains for maximum impact in club sound
                systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <Sliders className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Separated Track Stems
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Premium and Exclusive leases include fully organized, dry 24-bit
                WAV track stems for custom arrangement and vocal mixing control.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <ShieldCheck className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Instant Direct Licensing
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No middleman markup. Direct producer inquiries deliver untagged
                files, contracts, and stem download keys within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
