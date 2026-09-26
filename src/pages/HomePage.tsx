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
  ChevronDown,
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
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

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
            poster={resolveUrl("/banner.png")}
            preload="metadata"
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
          {/* Business Social Proof & Ratings Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 mb-6 backdrop-blur-md shadow-lg"
          >
            <div className="flex text-amber-400 text-xs tracking-tighter">
              ★★★★★
            </div>
            <span className="font-bold text-white">4.9 / 5.0</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">140+ Artist Leases</span>
            <span className="text-zinc-600">•</span>
            <span className="text-emerald-400 font-semibold">Verified Beat Store</span>
          </motion.div>

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

      {/* Popular Artist Type Beats & Styles Pill Directory */}
      <section className="py-16 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
              Trending Sounds &amp; Styles
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              Popular Artist Type Beats
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
              Explore hard-hitting trap beats, UK drill instrumentals, and melodic R&amp;B productions tailored for recording artists. Click any style to filter our catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-5xl mx-auto">
            {[
              "Drake",
              "Travis Scott",
              "Future",
              "Metro Boomin",
              "Playboi Carti",
              "Lil Uzi Vert",
              "21 Savage",
              "J. Cole",
              "Kendrick Lamar",
              "Gunna",
              "Lil Baby",
              "Young Thug",
              "Don Toliver",
              "The Weeknd",
              "Bryson Tiller",
              "Partynextdoor",
              "Brent Faiyaz",
              "Pop Smoke",
              "Central Cee",
              "Chief Keef",
              "Yeat",
              "Ken Carson",
              "Destroy Lonely",
              "Lil Tecca",
              "Juice WRLD",
              "XXXTentacion",
              "Polo G",
              "Roddy Ricch",
              "NBA Youngboy",
            ].map((artist) => (
              <Link
                key={artist}
                to={`/beats?search=${encodeURIComponent(artist)}`}
                className="px-3.5 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-mono transition-all flex items-center gap-1.5 group active:scale-95"
              >
                <span>{artist} type beat</span>
                <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>

          {/* Business Rating & Verified Artist Reviews */}
          <div className="mt-12 pt-10 border-t border-zinc-900/80 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900">
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                <span>★★★★★</span>
                <span className="text-xs font-mono text-zinc-400">5.0 / 5.0 • Verified Buyer</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic mb-3">
                &quot;Hardest 808s and mix quality. Leased the Ransom beat for my single and the WAV stems were crystal clear for vocal mixing.&quot;
              </p>
              <span className="text-[11px] font-mono text-zinc-500 block">
                — Kavish M. • Spotify &amp; Apple Music Artist
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-900">
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                <span>★★★★★</span>
                <span className="text-xs font-mono text-zinc-400">5.0 / 5.0 • Verified Buyer</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic mb-3">
                &quot;Crazy drill type beats. Instant stems delivery and clean licensing agreement ready for digital distributor upload.&quot;
              </p>
              <span className="text-[11px] font-mono text-zinc-500 block">
                — Marcus Reid • Independent Creator
              </span>
            </div>
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
      {/* Studio Highlights */}
      <section className="py-20 bg-zinc-950 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <Cpu className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Analog &amp; Digital Hybrid
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Crafted with premium synthesizer hardware and modern digital mixing chains for maximum impact on club systems and streaming platforms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <Sliders className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Separated Track Stems
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Exclusive licenses include fully organized, dry 24-bit WAV track stems for custom arrangement, leveling, and vocal mixing control.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/30 border border-zinc-900 hover:border-zinc-800 transition-colors">
              <ShieldCheck className="w-8 h-8 text-zinc-300 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">
                Instant Direct Delivery
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No middleman markup. Direct producer inquiries deliver untagged WAV audio files, stems, and signed license agreements to your email.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Artist FAQ */}
      <section className="py-20 bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              Quick answers about licensing, files, and distribution.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Can I release my song on Spotify and Apple Music?",
                a: "Yes! The Basic Lease (₹200) allows commercial streaming on Spotify, Apple Music, and all DSPs up to 50,000 streams. Exclusive licenses include unlimited streams.",
              },
              {
                q: "What files will I receive after purchasing?",
                a: "You'll receive a high-definition, untagged 24-bit master WAV file. Exclusive purchases also include the complete separated multi-track stem ZIP archive.",
              },
              {
                q: "Can I download and audition beats for free?",
                a: "Yes, you can download free tagged MP3 evaluation versions directly from the catalog for demo writing, auditions, and non-commercial streaming.",
              },
            ].map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/30 border border-zinc-900 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-white" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </motion.div>
  );
};
