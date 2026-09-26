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
  CheckCircle2,
  HelpCircle,
  MapPin,
  Mail,
  FileText,
  Sparkles,
  Check,
  Copy,
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
  const { openInquireModal, openShareModal, currentTrack, isPlaying } =
    useAudioStore();
  const { setIsHovering, setText } = useCursorStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [copiedLink, setCopiedLink] = useState(false);

  const copyPageLink = () => {
    navigator.clipboard.writeText("https://denzven.github.io/DZVNbeats/");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = (beat: Beat) => {
    openShareModal(beat);
  };

  // Deep linking redirect to catalog
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

    if (targetBeatId) {
      navigate(`/beats?play=${encodeURIComponent(targetBeatId)}`, { replace: true });
    }
  }, [location.search, navigate]);

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
            aria-hidden="true"
            className="w-full h-full object-cover opacity-80 pointer-events-none scale-105"
          >
            <track
              kind="captions"
              src="data:text/vtt,WEBVTT"
              label="No speech"
              default
            />
          </video>
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
                className={`group relative z-10 hover:!z-40 flex-none w-[85vw] sm:w-[340px] flex flex-col justify-between bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:shadow-2xl rounded-3xl p-5 transition-all duration-300 snap-center ${
                  currentTrack?.id === beat.id && isPlaying ? "z-30 ring-1 ring-zinc-400/40" : ""
                }`}
              >
                <div>
                  {/* Cover Art Frame with Floating Glass Badges */}
                  <div className="relative aspect-square w-full rounded-2xl bg-zinc-950 mb-5 group-hover:shadow-2xl transition-all overflow-hidden">
                    {/* Ambient Glow (Replaces inline background-image) */}
                    {beat.coverArt && (
                      <img
                        src={resolveUrl(beat.coverArt)}
                        alt=""
                        aria-hidden="true"
                        width={340}
                        height={340}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover z-0 opacity-25 group-hover:opacity-45 transition-opacity duration-500 rounded-2xl pointer-events-none filter blur-xl scale-110"
                      />
                    )}

                    {/* Cover Art Image */}
                    <div
                      className="absolute inset-0 z-20 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/60 cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
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
                          alt={`${beat.title} Type Beat Artwork`}
                          width={340}
                          height={340}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                          <Disc className="w-12 h-12 text-zinc-700" />
                        </div>
                      )}

                      {/* Floating Glass Status Badge (Top-Left) */}
                      <div className="absolute top-3 left-3 z-30 pointer-events-none">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/75 backdrop-blur-md border border-zinc-800/80 text-[10px] font-mono uppercase tracking-wider shadow-sm">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              beat.status === "Sold"
                                ? "bg-red-500"
                                : "bg-emerald-400 animate-pulse-subtle"
                            }`}
                          />
                          <span
                            className={
                              beat.status === "Sold"
                                ? "text-red-400 font-semibold"
                                : "text-zinc-300"
                            }
                          >
                            {beat.status === "Sold" ? "Sold" : "Available"}
                          </span>
                        </div>
                      </div>

                      {/* Floating Glass Price Badge (Top-Right) */}
                      <div className="absolute top-3 right-3 z-30 pointer-events-none">
                        <span className="px-2.5 py-1 rounded-full bg-zinc-950/75 backdrop-blur-md border border-zinc-800/80 text-[11px] font-mono font-bold text-white shadow-sm tracking-wide">
                          {beat.status === "Sold"
                            ? "SOLD"
                            : beat.beatType === "Exclusive"
                              ? "EXCLUSIVE"
                              : beat.price === 0
                                ? "FREE"
                                : `₹${beat.price || 200}`}
                        </span>
                      </div>

                      {/* View Button Overlay */}
                      <div className="absolute inset-0 transition-opacity flex items-center justify-center bg-zinc-950/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100">
                        <button
                          aria-label={`View ${beat.title} in beat store`}
                          className="w-14 h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl transition-transform active:scale-95 hover:scale-110"
                        >
                          <ArrowRight className="w-6 h-6 text-zinc-950" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Track Details */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-zinc-200 truncate leading-snug">
                        {beat.title}
                      </h3>
                      {beat.tags && beat.tags[0] && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 flex-shrink-0">
                          {beat.tags[0]}
                        </span>
                      )}
                    </div>
                    {/* Streamlined Single-Line Metadata Row */}
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      {beat.bpm && (
                        <span className="text-zinc-300 font-medium">
                          {beat.bpm} BPM
                        </span>
                      )}
                      {beat.key && <span>• {beat.key}</span>}
                      {beat.duration && <span>• {beat.duration}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-auto pt-3.5 border-t border-zinc-800/60 flex items-center justify-between relative z-20">
                  <button
                    onClick={() =>
                      navigate("/beats", { state: { playBeatId: beat.id } })
                    }
                    className="py-1.5 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Music className="w-3.5 h-3.5 fill-current" />
                    <span>Catalog</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <MagneticButton
                      onClick={() => handleShare(beat)}
                      className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center justify-center"
                      title="Share beat"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </MagneticButton>

                    <MagneticButton
                      onClick={() =>
                        beat.status !== "Sold" && openInquireModal(beat)
                      }
                      className={`px-3.5 py-1.5 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5 ${
                        beat.status === "Sold"
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70"
                          : "bg-white hover:bg-zinc-200 text-zinc-950 active:scale-95"
                      }`}
                    >
                      <Download
                        className={`w-3.5 h-3.5 ${beat.status === "Sold" ? "text-zinc-500" : "text-zinc-950"}`}
                      />
                      <span>
                        {beat.status === "Sold"
                          ? "Sold"
                          : beat.beatType === "Exclusive"
                            ? "License"
                            : "Download"}
                      </span>
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

      {/* Studio Value Proposition & Trust Badges */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
              Studio Guarantees &amp; Quality
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Production Standard
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Every instrumental is engineered to commercial broadcast standards, delivering clean headroom, heavy low-end impact, and pristine stereo imaging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <Cpu className="w-7 h-7 text-zinc-300 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">
                Analog &amp; Digital Hybrid
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Crafted using premium synthesizer hardware, analog tape warmth, and industry-grade mixing chains for maximum impact in club sound systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <Sliders className="w-7 h-7 text-zinc-300 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">
                Separated Track Stems
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Exclusive and premium licenses provide complete, dry 24-bit WAV stem archives for precise vocal integration and custom song arrangements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <ShieldCheck className="w-7 h-7 text-zinc-300 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">
                Instant Direct Licensing
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Legally binding contracts governed by the Indian Copyright Act, 1957. Direct producer delivery ensures zero middleman fees and instant downloads.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <Sparkles className="w-7 h-7 text-zinc-300 mb-3" />
              <h3 className="text-base font-bold text-white mb-2">
                100% Royalty Retention
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Artists keep 100% of all streaming royalties and music video revenue within their licensed tier limits. No hidden publishing cuts.
              </p>
            </div>
          </div>

          {/* Social Share Buttons Bar */}
          <div className="mt-12 p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider block">
                Share With Fellow Artists
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Share DZVNbeats Portfolio
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://twitter.com/intent/tweet?text=Check%20out%20high-quality%20type%20beats%20and%20rap%20instrumentals%20on%20DZVNbeats&url=https%3A%2F%2Fdenzven.github.io%2FDZVNbeats%2F"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on X / Twitter"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <span>Share on X</span>
              </a>
              <a
                href="https://api.whatsapp.com/send?text=Check%20out%20DZVNbeats%20for%20trap%2C%20drill%2C%20and%20rap%20type%20beats%3A%20https%3A%2F%2Fdenzven.github.io%2FDZVNbeats%2F"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition-colors flex items-center gap-2"
              >
                <span>Share on WhatsApp</span>
              </a>
              <button
                onClick={copyPageLink}
                aria-label="Copy website link"
                className="px-4 py-2 bg-white text-zinc-950 text-xs font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About The Producer & Studio (E-E-A-T Section) */}
      <section id="about" className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <span className="text-xs font-mono uppercase text-emerald-400 tracking-wider">
                About The Producer • E-E-A-T Authority
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                Denzven Vadakkan (DZVN)
              </h2>
              <p className="text-xs font-mono text-zinc-400 mt-1">
                Music Producer, Composer &amp; Audio Engineer • Mumbai, India
              </p>

              <div className="mt-6 space-y-4 text-sm text-zinc-400 leading-relaxed">
                <p>
                  <strong>DZVNbeats</strong> is the creative output of independent music producer and sound designer Denzven Vadakkan. Specializing in hard-hitting trap beats, dark UK/NY drill instrumentals, and atmospheric R&amp;B progressions, every composition is crafted from scratch with dedicated synthesizer sound design and bespoke drum layering.
                </p>
                <p>
                  With extensive background in mixing engineering, each instrumental is mixed with precise stereo imaging, controlled low-end dynamics, and optimal vocal headroom (-14 to -9 LUFS), ensuring seamless vocal recording and commercial streaming release.
                </p>
              </div>

              {/* Physical Studio Address & Contact Signals */}
              <div className="mt-6 pt-6 border-t border-zinc-900 space-y-2.5">
                <address className="not-italic text-xs font-mono text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span>Physical Studio: Mumbai, Maharashtra 400001, India</span>
                </address>
                <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <a href="mailto:dzvn.beats@gmail.com" className="hover:text-white transition-colors underline">
                    Inquiries &amp; Direct Support: dzvn.beats@gmail.com
                  </a>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/licensing"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Licensing Terms &amp; Guarantees
                </Link>
                <Link
                  to="/beats"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                >
                  <Music className="w-3.5 h-3.5" />
                  Audition Catalog
                </Link>
              </div>
            </div>

            {/* Studio Capabilities / Stats Card */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-200 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  100% Original Audio
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Zero uncleared sample loops. All melodies, synth leads, and basslines are original musical compositions, preventing copyright takedowns.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-200 mb-4">
                  <Sliders className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  Mastered 24-bit Audio
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Delivered in uncompressed 24-bit 44.1kHz WAV resolution, preserving transient dynamics and warmth for major-label audio quality.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-200 mb-4">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  Legally Binding Contracts
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Every license includes an official signed PDF contract compliant with the Indian Copyright Act, 1957 and Indian Contract Act, 1872.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-200 mb-4">
                  <Download className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  Instant File Delivery
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Receive your untagged high-definition audio files and stem archives directly via secure cloud download upon license confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section id="faq" className="py-20 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
              Artist Assistance &amp; Clarifications
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-400 mt-2">
              Everything you need to know about auditioning, leasing, stem delivery, and commercial distribution.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <h3 className="text-base font-bold text-white mb-2">
                Can I download and use DZVNbeats instrumentals for free?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Yes! You can download free tagged MP3 evaluation versions directly from our beat catalog. Free downloads are intended for auditioning, demo recording, and non-commercial streaming on SoundCloud or YouTube with credit specified as <em>(Prod. DZVN)</em>.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <h3 className="text-base font-bold text-white mb-2">
                What is included with a Basic Commercial Beat Lease (₹200)?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Our Basic Lease includes the untagged high-definition 24-bit master WAV audio file, permission for up to 50,000 commercial streams across Spotify, Apple Music, and Amazon Music, 1 monetized music video, and 100% retention of streaming royalties within the limit.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <h3 className="text-base font-bold text-white mb-2">
                What are track stems and when do I need them?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Track stems are individual, isolated audio files for every instrument in the beat (such as kick, snare, 808 bass, melody synths, and FX). Stems are included with Exclusive licenses and allow audio mixing engineers complete control over leveling, EQ, and vocal blending.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <h3 className="text-base font-bold text-white mb-2">
                Can I register my song with YouTube Content ID?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Under Free and non-exclusive Basic Leases, registering songs with automated audio fingerprinting systems (such as YouTube Content ID or TuneCore Content ID) is prohibited because multiple artists may license the same instrumental. Only Exclusive rights holders may submit to Content ID.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900">
              <h3 className="text-base font-bold text-white mb-2">
                How do I receive my purchased files and signed agreement?
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Following payment verification, we generate an official PDF agreement signed by Denzven Vadakkan and provide secure cloud links containing the untagged 24-bit WAV file and stem archives directly to your email address within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};
