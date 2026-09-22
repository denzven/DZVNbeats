import React from "react";
import { motion } from "framer-motion";
import { Play, ShieldCheck, Sparkles, ArrowDown } from "lucide-react";
import { useAudioStore } from "../store/useAudioStore";

export const Hero: React.FC = () => {
  const { playlist, playTrack } = useAudioStore();
  const videoUrl = import.meta.env.BASE_URL + "banner.mp4";

  const handlePlayClick = () => {
    if (playlist.length > 0) {
      playTrack(playlist[0]);
    }
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-zinc-950 border-b border-zinc-900">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      {/* Dark overlay to ensure text remains readable */}
      <div className="absolute inset-0 bg-zinc-950/40 pointer-events-none z-10" />

      {/* Dark gradient overlay at the bottom to transition smoothly */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="text-center max-w-3xl mx-auto">
          {/* Studio Badge */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-mono text-zinc-300 mb-8 shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>PREMIUM PRODUCTION &amp; BEAT CATALOG</span>
            <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
            <span className="text-zinc-500">2026 EDITION</span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            HIGH-QUALITY SOUNDS FOR <br />
            <span className="bg-gradient-to-r from-zinc-100 via-zinc-400 to-zinc-600 bg-clip-text text-transparent italic font-serif">
              CREATIVE ARTISTS
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed font-normal max-w-2xl mx-auto"
          >
            Studio-grade Trap, Synthwave, RnB &amp; Drill instrumentals produced
            by <strong className="text-white font-semibold">DZVN</strong>.
            Instant untagged WAV downloads, stems, and direct royalty-free
            licensing.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <button
              onClick={handlePlayClick}
              className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-sm rounded-xl transition-all shadow-lg flex items-center gap-2.5 group active:scale-95"
            >
              <Play className="w-4 h-4 fill-zinc-950 group-hover:scale-110 transition-transform" />
              Play Featured Beat
            </button>

            <a
              href="#licensing"
              className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm rounded-xl border border-zinc-800 transition-all flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-zinc-400" />
              View License Tiers
            </a>
          </motion.div>

          {/* Studio Metrics Pill Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-12 pt-8 border-t border-zinc-900/80 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left"
          >
            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-900">
              <p className="text-xs font-mono text-zinc-500 uppercase">
                Tempo Range
              </p>
              <p className="text-sm font-bold text-zinc-200 mt-0.5">
                110 – 165 BPM
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-900">
              <p className="text-xs font-mono text-zinc-500 uppercase">
                Mastering
              </p>
              <p className="text-sm font-bold text-zinc-200 mt-0.5">
                24-bit / 48kHz WAV
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-900">
              <p className="text-xs font-mono text-zinc-500 uppercase">
                Licensing
              </p>
              <p className="text-sm font-bold text-zinc-200 mt-0.5">
                Instant Direct Lease
              </p>
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-900">
              <p className="text-xs font-mono text-zinc-500 uppercase">
                Delivery
              </p>
              <p className="text-sm font-bold text-zinc-200 mt-0.5">
                Automated Stems
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subtle Scroll Down Anchor */}
      <div className="mt-12 text-center">
        <a
          href="#beats"
          className="inline-flex flex-col items-center text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-mono gap-1"
        >
          <span>BROWSE CATALOG</span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce mt-1" />
        </a>
      </div>
    </section>
  );
};
