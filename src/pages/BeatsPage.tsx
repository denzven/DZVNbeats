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
  Check,
} from "lucide-react";
import { Beat } from "../types/beat";
import { useAudioStore } from "../store/useAudioStore";
import { MagneticButton } from "../components/MagneticButton";
import { useCursorStore } from "../store/useCursorStore";

interface BeatsPageProps {
  beats: Beat[];
}

const resolveUrl = (path?: string) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const clean = path.replace(/^\.\//, "").replace(/^\//, "");
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? `${base}${clean}` : `${base}/${clean}`;
};

/**
 * BeatsPage is the main catalog view. It displays all the beats pulled from the `beats.json` manifest.
 * 
 * Key Features:
 * - List and Grid view toggles.
 * - Search, Filter by Tag, and BPM Sorting.
 * - **Infinite Scrolling**: Instead of rendering 300+ beats at once, it initializes with 24 beats and uses
 *   an `IntersectionObserver` to progressively load more as the user scrolls down, ensuring optimal performance.
 * - Direct deep linking via URL params (`?play=beatId`).
 */
export const BeatsPage: React.FC<BeatsPageProps> = ({ beats }) => {
  const { currentTrack, isPlaying, playTrack, openInquireModal } =
    useAudioStore();
  const { setIsHovering, setText } = useCursorStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const hasPlayedUrl = React.useRef(false);

  const handleShare = (beatId: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/beats?play=${beatId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(beatId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (location.state && (location.state as any).playBeatId) {
      const playBeatId = (location.state as any).playBeatId;
      const beatToPlay = beats.find((b) => b.id === playBeatId);
      if (beatToPlay) {
        timeoutId = setTimeout(() => playTrack(beatToPlay), 300);
      }
      navigate(".", { replace: true, state: {} });
    } else {
      const params = new URLSearchParams(location.search);
      const playId = params.get("play");
      if (playId && !hasPlayedUrl.current) {
        const beatToPlay = beats.find((b) => b.id === playId);
        if (beatToPlay) {
          timeoutId = setTimeout(() => playTrack(beatToPlay), 300);
          hasPlayedUrl.current = true;
        }
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [location.state, location.search, beats, playTrack, navigate]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"default" | "bpm-asc" | "bpm-desc">(
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
                <option value="default">Sort: Standard</option>
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
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6"
          >
            {filteredBeats.slice(0, visibleCount).map((beat) => {
              const isCurrent = currentTrack?.id === beat.id;
              const isCurrentPlaying = isCurrent && isPlaying;

              return (
                <motion.div
                  key={beat.id}
                  variants={itemVariants}
                  className="h-full"
                >
                  <div
                    className={`group h-full relative z-10 hover:!z-50 flex flex-col justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      isCurrent
                        ? "bg-zinc-900/90 border-zinc-400 shadow-2xl ring-1 ring-zinc-400/50 z-40"
                        : "bg-zinc-900/40 hover:bg-zinc-800/60 border-zinc-900 hover:border-zinc-600 hover:shadow-xl"
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

                        {/* Vinyl Disk */}
                        <div
                          className={`absolute right-0 top-1/2 -translate-y-1/2 w-[90%] h-[90%] shadow-2xl z-10 transition-all duration-500 ease-out ${
                            isCurrentPlaying
                              ? "translate-x-[45%]"
                              : "group-hover:translate-x-[55%]"
                          }`}
                        >
                          <div
                            className={`w-full h-full rounded-full bg-zinc-900 border border-zinc-800 relative overflow-hidden flex items-center justify-center ${
                              isCurrentPlaying
                                ? "animate-[spin_4s_linear_infinite]"
                                : "transition-all duration-500 group-hover:rotate-[60deg]"
                            }`}
                          >
                            {/* Grooves */}
                            <div className="absolute inset-1 rounded-full border border-zinc-700/30" />
                            <div className="absolute inset-[10%] rounded-full border border-zinc-700/30" />
                            <div className="absolute inset-[20%] rounded-full border border-zinc-700/30" />
                            <div className="absolute inset-[30%] rounded-full border border-zinc-700/30" />

                            {/* Shine */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-white/10 to-transparent" />

                            {/* Center Label (Cover Art) */}
                            <div className="relative w-[35%] h-[35%] rounded-full border-[3px] border-zinc-950 overflow-hidden flex items-center justify-center">
                              {beat.coverArt ? (
                                <img
                                  src={resolveUrl(beat.coverArt)}
                                  alt="label"
                                  className="absolute inset-0 w-full h-full object-cover saturate-50"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-zinc-800" />
                              )}
                              <div className="relative w-2.5 h-2.5 rounded-full bg-zinc-950 ring-1 ring-zinc-700/50" />
                            </div>
                          </div>
                        </div>

                        {/* Cover Art Itself */}
                        <div
                          className="absolute inset-0 z-20 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/50 transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl"
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

                          {/* Play Button Overlay */}
                          <div
                            className={`absolute inset-0 transition-opacity flex items-center justify-center ${
                              isCurrentPlaying
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <button
                              aria-label={`Play ${beat.title}`}
                              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform active:scale-95 ${
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
                                  ></span>
                                  <span
                                    className="w-1 bg-zinc-950 rounded-full animate-wave-bar"
                                    style={{ animationDelay: "0.2s" }}
                                  ></span>
                                  <span
                                    className="w-1 bg-zinc-950 rounded-full animate-wave-bar"
                                    style={{ animationDelay: "0.4s" }}
                                  ></span>
                                </div>
                              ) : (
                                <Play className="w-6 h-6 fill-zinc-950 ml-0.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Beat Metadata */}
                      <div className="mb-4">
                        <h3 className="font-bold text-base text-white group-hover:text-zinc-200 truncate">
                          {beat.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 font-mono text-xs text-zinc-400">
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
                        </div>

                        {/* Genre Tags */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {beat.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] text-zinc-500 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between relative z-20">
                      <button
                        onClick={() => playTrack(beat)}
                        className="py-1.5 sm:py-0 text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Play
                      </button>

                      <div className="flex items-center gap-2">
                        <MagneticButton
                          onClick={() => handleShare(beat.id)}
                          className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center justify-center"
                          title="Share link"
                        >
                          {copiedId === beat.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </MagneticButton>

                        <MagneticButton
                          onClick={() =>
                            beat.status !== "Sold" && openInquireModal(beat)
                          }
                          className={`px-3 py-2 sm:py-1.5 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1 ${
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
              const isCurrent = currentTrack?.id === beat.id;

              return (
                <div
                  key={beat.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? "bg-zinc-800/80 border-zinc-400 shadow-lg"
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
                        onClick={() => playTrack(beat)}
                        className="absolute inset-0 transition-opacity flex items-center justify-center text-white opacity-0 hover:opacity-100"
                      >
                        <Play className="w-5 h-5 fill-white" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {beat.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-0.5">
                        <span>{beat.bpm} BPM</span>
                        {beat.key && <span>• {beat.key}</span>}
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
                      onClick={() => handleShare(beat.id)}
                      className="p-2 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-all flex items-center justify-center"
                      title="Share link"
                    >
                      {copiedId === beat.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
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
