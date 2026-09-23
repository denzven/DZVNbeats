import React, { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Play,
  Search,
  Music,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Disc,
  Download,
  Share2,
  Sparkles,
} from "lucide-react";
import { Beat } from "../types/beat";
import { useAudioStore } from "../store/useAudioStore";
import { MagneticButton } from "../components/MagneticButton";
import { useCursorStore } from "../store/useCursorStore";
import { resolveUrl } from "../utils/url";

interface BeatsPageProps {
  beats: Beat[];
}

/**
 * BeatsPage is the main catalog view. It displays all the beats pulled from the `beats.json` manifest.
 */
export const BeatsPage: React.FC<BeatsPageProps> = ({ beats }) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    openInquireModal,
    openShareModal,
    autoplayBlocked,
  } = useAudioStore();
  const { setIsHovering, setText } = useCursorStore();
  const location = useLocation();
  const navigate = useNavigate();
  const hasPlayedUrl = React.useRef(false);

  const [sharedBeatId, setSharedBeatId] = useState<string | null>(null);
  const [highlightBanner, setHighlightBanner] = useState<{
    title: string;
  } | null>(null);

  const handleShare = (beat: Beat) => {
    openShareModal(beat);
  };

  useEffect(() => {
    // Check location.state
    let targetBeatId: string | null = null;
    if (location.state && (location.state as any).playBeatId) {
      targetBeatId = (location.state as any).playBeatId;
      navigate(".", { replace: true, state: {} });
    } else {
      // Check router params, window.location.search, and hash queries
      const routerParams = new URLSearchParams(location.search);
      const windowParams = new URLSearchParams(window.location.search);
      let hashQuery = "";
      if (window.location.hash.includes("?")) {
        hashQuery = window.location.hash.split("?")[1];
      }
      const hashParams = new URLSearchParams(hashQuery);

      targetBeatId =
        routerParams.get("play") ||
        routerParams.get("beat") ||
        windowParams.get("play") ||
        windowParams.get("beat") ||
        hashParams.get("play") ||
        hashParams.get("beat");
    }

    if (targetBeatId && !hasPlayedUrl.current) {
      const beatToPlay = beats.find(
        (b) =>
          b.id === targetBeatId ||
          b.id.toLowerCase() === targetBeatId.toLowerCase() ||
          b.legacyIds?.includes(targetBeatId) ||
          b.legacyIds?.some(
            (l) => l.toLowerCase() === targetBeatId.toLowerCase(),
          ) ||
          b.filename.toLowerCase().includes(targetBeatId.toLowerCase()) ||
          b.title.toLowerCase() === targetBeatId.toLowerCase(),
      );

      if (beatToPlay) {
        hasPlayedUrl.current = true;
        setSharedBeatId(beatToPlay.id);
        setHighlightBanner({ title: beatToPlay.title });

        const beatIdx = beats.findIndex((b) => b.id === beatToPlay.id);
        if (beatIdx >= 0) {
          setVisibleCount((prev) => Math.max(prev, beatIdx + 12));
        }

        // Force playback immediately so it never toggles off
        playTrack(beatToPlay, { forcePlay: true });

        // Frame-aligned retry scroll to guarantee centering even across animations
        let attempts = 0;
        const scrollInterval = setInterval(() => {
          attempts++;
          const el = document.getElementById(beatToPlay.id);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            clearInterval(scrollInterval);
          } else if (attempts >= 10) {
            clearInterval(scrollInterval);
          }
        }, 100);

        return () => {
          clearInterval(scrollInterval);
        };
      }
    }
  }, [location.state, location.search, beats, playTrack, navigate]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"default" | "bpm-asc" | "bpm-desc" | "title-asc">(
    "default",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Pagination State
  const [visibleCount, setVisibleCount] = useState(24);
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Reset visibleCount when filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [searchTerm, selectedTag, sortBy]);

  // Intersection Observer for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 24);
        }
      },
      { rootMargin: "200px" }, // Load slightly before reaching the very bottom
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tagSet.add("All");
    beats.forEach((beat) => {
      beat.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet);
  }, [beats]);

  // Filter and sort beats
  const filteredBeats = useMemo(() => {
    return beats
      .filter((beat) => {
        const matchesSearch =
          beat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          beat.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (beat.key &&
            beat.key.toLowerCase().includes(searchTerm.toLowerCase())) ||
          beat.bpm.toString().includes(searchTerm);

        const matchesTag =
          selectedTag === "All" ||
          (beat.tags && beat.tags.includes(selectedTag));

        return matchesSearch && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === "bpm-asc") return a.bpm - b.bpm;
        if (sortBy === "bpm-desc") return b.bpm - a.bpm;
        if (sortBy === "title-asc") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [beats, searchTerm, selectedTag, sortBy]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
      className="pt-28 pb-32 bg-zinc-950 text-zinc-100 min-h-screen"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-wider mb-2">
              <Music className="w-4 h-4 text-zinc-500" />
              <span>Full Catalog</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Type Beat Store &amp; Stems
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Browse through our collection of free, tagged type beats and rap
              instrumentals. Click cover art to play audio previews.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative min-w-[220px] sm:min-w-[260px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search beats, BPM, key..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>

            {/* BPM Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 px-3 py-2 pr-8 rounded-xl focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                <option value="default">Sort: Newest First</option>
                <option value="title-asc">Title: A → Z</option>
                <option value="bpm-asc">BPM: Low → High</option>
                <option value="bpm-desc">BPM: High → Low</option>
              </select>
              <SlidersHorizontal className="w-3 h-3 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Layout Toggle (Grid vs List) */}
            <div className="flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-white text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tag Pill Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedTag === tag
                  ? "bg-white text-zinc-950 font-semibold shadow-md"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Highlight notification banner if user arrived via share link */}
        {highlightBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-300 shadow-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
              </span>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  Loaded shared beat: "{highlightBanner.title}"
                </p>
                <p className="text-[11px] text-emerald-400/90 font-mono">
                  {autoplayBlocked
                    ? "Tap the track below to start listening (browser gesture required)"
                    : "Now playing in the studio player"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setHighlightBanner(null)}
              className="text-xs font-mono text-emerald-400 hover:text-white px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex-shrink-0"
            >
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Beats Content Display */}
        {filteredBeats.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/30 border border-zinc-900 rounded-2xl">
            <Music className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-zinc-300">
              No matching beats found
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Try clearing your search query or filters.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW FORMAT WITH COVER IMAGES */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
          >
            {filteredBeats.slice(0, visibleCount).map((beat) => {
              const isShared = sharedBeatId === beat.id;
              const isCurrent = currentTrack?.id === beat.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <motion.div
                  key={beat.id}
                  id={beat.id}
                  variants={itemVariants}
                  className="h-full relative"
                >
                  {/* Floating Top Badge for Shared Beat */}
                  {isShared && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                      <span className="px-3 py-1 rounded-full bg-emerald-400 text-zinc-950 font-mono font-bold text-[10px] uppercase tracking-wider shadow-xl flex items-center gap-1.5 animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 fill-zinc-950" />
                        Shared Beat
                      </span>
                    </div>
                  )}

                  <div
                    className={`group h-full relative z-10 hover:!z-40 flex flex-col justify-between p-5 rounded-3xl border transition-all duration-300 ${
                      isShared
                        ? "bg-zinc-900/95 border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.35)] ring-2 ring-emerald-400/90 z-30"
                        : isCurrent
                          ? "bg-zinc-900/90 border-zinc-400 shadow-2xl ring-1 ring-zinc-400/40 z-30"
                          : "bg-zinc-900/30 hover:bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:shadow-2xl"
                    }`}
                  >
                    <div>
                      {/* Cover Art Frame with Vinyl & Floating Glass Badges */}
                      <div className="relative aspect-square w-full rounded-2xl bg-zinc-950 mb-5 group-hover:shadow-2xl transition-all">
                        {/* Blurred Background Glow */}
                        {beat.coverArt && (
                          <div
                            className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-2xl pointer-events-none"
                            style={{
                              backgroundImage: `url(${resolveUrl(beat.coverArt)})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              filter: "blur(20px) saturate(1.5)",
                            }}
                          />
                        )}

                        {/* Vinyl Disk Slide-out */}
                        <div
                          className={`absolute right-0 top-1/2 -translate-y-1/2 w-[88%] h-[88%] shadow-2xl z-10 transition-all duration-500 ease-out pointer-events-none ${
                            isCurrentPlaying
                              ? "translate-x-[38%]"
                              : "group-hover:translate-x-[38%]"
                          }`}
                        >
                          <div
                            className={`w-full h-full rounded-full bg-zinc-900 border border-zinc-800 relative overflow-hidden flex items-center justify-center ${
                              isCurrentPlaying
                                ? "animate-[spin_4s_linear_infinite]"
                                : "transition-all duration-500 group-hover:rotate-[45deg]"
                            }`}
                          >
                            <div className="absolute inset-1 rounded-full border border-zinc-700/30" />
                            <div className="absolute inset-[15%] rounded-full border border-zinc-700/30" />
                            <div className="absolute inset-[30%] rounded-full border border-zinc-700/30" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                            <div className="relative w-[34%] h-[34%] rounded-full border-2 border-zinc-950 overflow-hidden flex items-center justify-center">
                              {beat.coverArt ? (
                                <img
                                  src={resolveUrl(beat.coverArt)}
                                  alt="label"
                                  className="absolute inset-0 w-full h-full object-cover saturate-50"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-zinc-800" />
                              )}
                              <div className="relative w-2 h-2 rounded-full bg-zinc-950 ring-1 ring-zinc-700/50" />
                            </div>
                          </div>
                        </div>

                        {/* Cover Art Image */}
                        <div
                          className="absolute inset-0 z-20 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/60 cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
                          onMouseEnter={() => {
                            setIsHovering(true);
                            setText("PLAY");
                          }}
                          onMouseLeave={() => {
                            setIsHovering(false);
                            setText("");
                          }}
                          onClick={() => playTrack(beat)}
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
                                    : `$${beat.price || 29}`}
                            </span>
                          </div>

                          {/* Play Button Overlay */}
                          <div
                            className={`absolute inset-0 transition-opacity flex items-center justify-center bg-zinc-950/30 backdrop-blur-[2px] ${
                              isCurrentPlaying
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <button
                              aria-label={`Play ${beat.title}`}
                              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-95 ${
                                isCurrentPlaying
                                  ? "bg-white text-zinc-950 scale-105"
                                  : "bg-white text-zinc-950 hover:scale-110"
                              }`}
                            >
                              {isCurrentPlaying ? (
                                <div className="flex items-end gap-1 h-5 px-1">
                                  <span
                                    className="w-1 bg-zinc-950 rounded-full animate-wave-bar"
                                    style={{ animationDelay: "0s" }}
                                  />
                                  <span
                                    className="w-1 bg-zinc-950 rounded-full animate-wave-bar"
                                    style={{ animationDelay: "0.2s" }}
                                  />
                                  <span
                                    className="w-1 bg-zinc-950 rounded-full animate-wave-bar"
                                    style={{ animationDelay: "0.4s" }}
                                  />
                                </div>
                              ) : (
                                <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                              )}
                            </button>
                          </div>
                          {/* Autoplay blocked banner right on the card for instant unblocking */}
                          {autoplayBlocked && (isShared || isCurrent) && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                playTrack(beat, { forcePlay: true });
                              }}
                              className="absolute inset-x-3 bottom-3 z-30 py-2.5 px-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-2xl animate-pulse cursor-pointer transition-all"
                            >
                              <Play className="w-4 h-4 fill-zinc-950" />
                              <span>Tap to Start Audio</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Beat Metadata */}
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
                    <div className="pt-3.5 border-t border-zinc-800/60 flex items-center justify-between relative z-20">
                      {/* Quick Play Trigger */}
                      <button
                        onClick={() => playTrack(beat)}
                        className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors group/play"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isCurrentPlaying
                              ? "bg-white text-zinc-950 shadow"
                              : "bg-zinc-800/80 group-hover/play:bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {isCurrentPlaying ? (
                            <div className="flex items-end gap-0.5 h-2.5 px-0.5">
                              <span
                                className="w-0.5 bg-zinc-950 rounded-full animate-wave-bar"
                                style={{ animationDelay: "0s" }}
                              />
                              <span
                                className="w-0.5 bg-zinc-950 rounded-full animate-wave-bar"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <span
                                className="w-0.5 bg-zinc-950 rounded-full animate-wave-bar"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </div>
                          ) : (
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          )}
                        </div>
                        <span className="font-mono text-xs">
                          {isCurrentPlaying ? "Playing" : "Preview"}
                        </span>
                      </button>

                      {/* Action Buttons */}
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
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* LIST VIEW FALLBACK */
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            {filteredBeats.slice(0, visibleCount).map((beat) => {
              const isShared = sharedBeatId === beat.id;
              const isCurrent = currentTrack?.id === beat.id;

              return (
                <div
                  key={beat.id}
                  id={beat.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border transition-all ${
                    isShared
                      ? "bg-zinc-900/95 border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400"
                      : isCurrent
                        ? "bg-zinc-800/80 border-zinc-400 shadow-lg ring-1 ring-zinc-400/50"
                        : "bg-zinc-900/40 border-zinc-900 hover:bg-zinc-800/60 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0">
                      {beat.coverArt && (
                        <img
                          src={resolveUrl(beat.coverArt)}
                          alt={beat.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <button
                        onClick={() => playTrack(beat, { forcePlay: true })}
                        className="absolute inset-0 transition-opacity flex items-center justify-center text-white opacity-0 hover:opacity-100"
                      >
                        <Play className="w-5 h-5 fill-white" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">
                          {beat.title}
                        </h3>
                        {isShared && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-zinc-950 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow">
                            <Sparkles className="w-3 h-3 fill-zinc-950" />
                            Shared
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                        <span>{beat.bpm} BPM</span>
                        {beat.key && <span>• {beat.key}</span>}
                        {beat.duration && <span>• {beat.duration}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 sm:mt-0">
                    <span className="font-mono text-sm text-white font-bold">
                      {beat.status === "Sold"
                        ? "SOLD OUT"
                        : beat.beatType === "Exclusive"
                          ? "EXCLUSIVE"
                          : beat.price === 0
                            ? "FREE"
                            : `$${beat.price || 29}`}
                    </span>
                    <button
                      onClick={() => handleShare(beat)}
                      className="p-2 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center justify-center"
                      title="Share beat (Includes cover art & auto-play link)"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        beat.status !== "Sold" && openInquireModal(beat)
                      }
                      className={`px-4 py-2.5 sm:py-2 font-bold text-xs rounded-xl flex items-center gap-1 transition-all ${
                        beat.status === "Sold"
                          ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                          : "bg-white text-zinc-950 hover:bg-zinc-200"
                      }`}
                    >
                      <Download
                        className={`w-3.5 h-3.5 ${beat.status === "Sold" ? "text-zinc-500" : ""}`}
                      />
                      {beat.status === "Sold"
                        ? "Unavailable"
                        : beat.beatType === "Exclusive"
                          ? "Purchase"
                          : "Download"}
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Intersection Observer Sentinel */}
      {visibleCount < filteredBeats.length && (
        <div
          ref={loadMoreRef}
          className="h-10 w-full flex items-center justify-center mt-8"
        >
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin"></div>
        </div>
      )}
    </motion.div>
  );
};
