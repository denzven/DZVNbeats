import React, { useState, useEffect, useRef } from "react";
import { Beat } from "../types/beat";
import { useAudioStore } from "../store/useAudioStore";
import {
  Youtube,
  Video,
  Copy,
  Check,
  Play,
  Pause,
  ExternalLink,
  Sparkles,
  Send,
  Radio,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileText,
  Plus,
  Download,
  UploadCloud,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { InteractiveVideoStudio } from "../components/studio/InteractiveVideoStudio";

interface DistributionAdminPageProps {
  beats: Beat[];
}

export const DistributionAdminPage: React.FC<DistributionAdminPageProps> = ({
  beats,
}) => {
  const [localBeats, setLocalBeats] = useState<Beat[]>(beats);

  useEffect(() => {
    setLocalBeats(beats);
  }, [beats]);

  // DEFAULT UX: Starts in clean "New Beat" drop mode
  const [isBlankMode, setIsBlankMode] = useState<boolean>(true);
  const [selectedBeatId, setSelectedBeatId] = useState<string>(
    beats.length > 0 ? beats[0].id : "",
  );
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [activePlatformTab, setActivePlatformTab] = useState<
    "youtube" | "discord" | "telegram" | "tiktok"
  >("youtube");

  // Metadata State
  const [artistVibe, setArtistVibe] = useState<string>("Central Cee x Dave");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [customDescription, setCustomDescription] = useState<string>("");
  const [tagsList, setTagsList] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showMetadataEditor, setShowMetadataEditor] = useState<boolean>(false);

  // Audio Playback in Simulator
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<"video" | "distribution">(
    "video",
  );

  // Drag & Drop Ingest State
  const [isCanvasDragOver, setIsCanvasDragOver] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [ingestMessage, setIngestMessage] = useState<string | null>(null);
  const canvasFileInputRef = useRef<HTMLInputElement | null>(null);

  // Release Pipeline State
  const [isReleasing, setIsReleasing] = useState<boolean>(false);
  const [releaseStep, setReleaseStep] = useState<string | null>(null);
  const [uploadSuccessUrl, setUploadSuccessUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Local environment detection
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0");

  const [videoStatus, setVideoStatus] = useState<{
    hasClientSecrets: boolean;
    hasToken: boolean;
    video: { exists: boolean; sizeMb: string | null; url: string | null };
    shorts: { exists: boolean; sizeMb: string | null; url: string | null };
  }>({
    hasClientSecrets: isLocal,
    hasToken: false,
    video: { exists: false, sizeMb: null, url: null },
    shorts: { exists: false, sizeMb: null, url: null },
  });

  const selectedBeat =
    localBeats.find((b) => b.id === selectedBeatId) ||
    localBeats[0] ||
    beats[0];

  const year = new Date().getFullYear();
  const purchaseUrl = selectedBeat
    ? `https://denzven.github.io/DZVNbeats/beat/${encodeURIComponent(selectedBeat.id)}/`
    : "https://denzven.github.io/DZVNbeats/";
  const storeUrl = "https://denzven.github.io/DZVNbeats/";

  // Tag generator helper
  const getDefaultTags = (
    title: string,
    artist: string,
    bpm: number,
    key: string,
  ) => [
    `${title.toLowerCase()} type beat`,
    `${artist.toLowerCase()} type beat`,
    `free ${artist.toLowerCase()} type beat`,
    `${artist.toLowerCase()} type beat ${year}`,
    title.toLowerCase(),
    `${bpm || 120} bpm type beat`,
    `${(key || "c minor").toLowerCase()} type beat`,
    "type beat",
    `type beat ${year}`,
    "free type beat",
    `free type beat ${year}`,
    "trap beat",
    "rap beat",
    "hard trap beat",
    "rap instrumental",
    `instrumental ${year}`,
    "DZVNbeats",
    "dzvn",
    "prod by dzvn",
  ];

  // Description builder helper
  const buildDefaultDescription = (
    title: string,
    currentTags: string[],
    bpm: number,
    key: string,
  ) => `${title}

🛒 Leases & Downloads: ${purchaseUrl}
🌐 Full Catalog: ${storeUrl}

⚡ BEAT DETAILS:
• BPM: ${bpm || 120}
• Key: ${key || "C minor"}
• Producer: DZVN (@DZVNbeats)

⚠️ USAGE TERMS:
* Free version is for non-profit audition & evaluation only.
* Non-monetized streaming only. Credit: (Prod. DZVNbeats).
* For commercial release on Spotify/Apple Music, purchase a lease above.
* Licensing terms: ${storeUrl}#/licensing

👇 CONNECT:
Instagram: https://www.instagram.com/dzvn_editsss
YouTube: https://www.youtube.com/@dzvnbeats?sub_confirmation=1

© DZVNbeats. All rights reserved.

---
[Tags]
${Array.from(new Set(currentTags)).join(", ")}`;

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Smart Filename Parser (Zero manual entry)
  const parseAudioFilename = (filename: string) => {
    let base = filename.substring(0, filename.lastIndexOf(".")) || filename;

    let detectedBpm = 120;
    const bpmMatch = base.match(/(\d{2,3})\s*(?:bpm|BPM)/i);
    if (bpmMatch) detectedBpm = parseInt(bpmMatch[1], 10);

    let detectedKey = "C Minor";
    const keyMatch = base.match(
      /([A-G](?:sharp|flat|[#b])?(?:min|minor|maj|major|mjr|mim))/i,
    );
    if (keyMatch) {
      let rawKey = keyMatch[1]
        .toLowerCase()
        .replace(/sharp/g, "#")
        .replace(/flat/g, "b");
      const noteMatch = rawKey.match(/^[a-g][#b]?/);
      if (noteMatch) {
        const note = noteMatch[0].toUpperCase();
        const scale =
          rawKey.includes("maj") || rawKey.includes("mjr") ? "Major" : "Minor";
        detectedKey = `${note} ${scale}`;
      }
    }

    let cleanedTitle = base
      .replace(/^DZVN_/i, "")
      .replace(/_\d+BPM.*/i, "")
      .replace(/_(?:ava|sold)_(?:free|std|ex)_(?:tagged|untagged)/i, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanedTitle) cleanedTitle = base;

    cleanedTitle = cleanedTitle
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    return { title: cleanedTitle, bpm: detectedBpm, key: detectedKey };
  };

  // Automated Ingestion Engine
  const autoIngestDroppedTrack = async (
    audio: File,
    cover: File | null = null,
  ) => {
    setIsIngesting(true);
    setUploadError(null);
    setUploadSuccessUrl(null);
    setIngestMessage(`Analyzing ${audio.name}...`);

    try {
      const parsed = parseAudioFilename(audio.name);
      setIngestMessage("Auto-tagging ID3 & updating catalog...");

      const audioBase64 = await fileToBase64(audio);
      let coverBase64 = "";
      if (cover) {
        coverBase64 = await fileToBase64(cover);
      }

      const res = await fetch("/api/studio/upload-new-beat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsed.title,
          bpm: parsed.bpm,
          key: parsed.key,
          tier: "Free",
          isTagged: true,
          tags: ["Trap", "Dark", "Hip-Hop", "808"],
          audioBase64,
          audioFilename: audio.name,
          coverBase64,
          coverFilename: cover ? cover.name : "cover.jpg",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process audio");
      }

      if (data.beat) {
        const updatedList = [
          data.beat,
          ...localBeats.filter((b) => b.id !== data.beat.id),
        ];
        setLocalBeats(updatedList);
        setSelectedBeatId(data.beat.id);
        useAudioStore.getState().setPlaylist(updatedList);
      }

      setIsBlankMode(false);
    } catch (err: any) {
      console.error("Auto ingest error:", err);
      setUploadError(err.message || "Failed to auto-ingest beat");
    } finally {
      setIsIngesting(false);
      setIngestMessage(null);
    }
  };

  // Canvas Drag & Drop Listener
  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsCanvasDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const audioExtensions = [".mp3", ".wav", ".m4a", ".flac", ".ogg"];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    const audioFile = files.find((f) =>
      audioExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
    );
    const coverFile = files.find((f) =>
      imageExtensions.some((ext) => f.name.toLowerCase().endsWith(ext)),
    );

    if (audioFile) {
      await autoIngestDroppedTrack(audioFile, coverFile || null);
    } else if (coverFile && selectedBeat) {
      await autoIngestDroppedTrack(
        new File([], selectedBeat.filename),
        coverFile,
      );
    }
  };

  // Status check API
  const checkStatus = async (id: string) => {
    if (!isLocal) return;
    try {
      const res = await fetch(
        `/api/studio/status?id=${encodeURIComponent(id)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setVideoStatus(data);
      }
    } catch {}
  };

  useEffect(() => {
    if (selectedBeat && !isBlankMode) {
      const defaultArtist =
        selectedBeat.tags && selectedBeat.tags.length > 0
          ? selectedBeat.tags.join(" x ")
          : "Central Cee x Dave";
      setArtistVibe(defaultArtist);

      const freePrefix =
        selectedBeat.beatType === "Exclusive" ? "[EXCLUSIVE]" : "[FREE]";
      const initialTitle = `${freePrefix} "${selectedBeat.title}" | ${defaultArtist} Type Beat | DZVNbeats`;
      setCustomTitle(initialTitle);

      const initialTags = Array.from(
        new Set(
          getDefaultTags(
            selectedBeat.title,
            defaultArtist,
            selectedBeat.bpm || 120,
            selectedBeat.key || "C minor",
          ),
        ),
      );
      setTagsList(initialTags);

      setCustomDescription(
        buildDefaultDescription(
          initialTitle,
          initialTags,
          selectedBeat.bpm || 120,
          selectedBeat.key || "C minor",
        ),
      );

      setUploadSuccessUrl(null);
      setUploadError(null);
      checkStatus(selectedBeat.id);
    }
  }, [selectedBeatId, isBlankMode]);

  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [selectedBeatId, isBlankMode]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Publish Visual Studio Rendered Video to YouTube
  const handlePublishToYouTube = async () => {
    if (!selectedBeat) return;

    const isShorts = aspectRatio === "9:16";
    const currentRender = isShorts ? videoStatus.shorts : videoStatus.video;

    if (!currentRender.exists) {
      setActiveMainTab("video");
      setUploadError(
        `Please export your ${isShorts ? "9:16 Shorts" : "16:9"} video in the Visual Studio first, then return here to publish.`,
      );
      return;
    }

    setIsReleasing(true);
    setUploadError(null);
    setUploadSuccessUrl(null);

    try {
      setReleaseStep("Publishing to YouTube Studio...");
      const uploadRes = await fetch("/api/studio/upload-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedBeat.id,
          artist: artistVibe,
          privacy: "unlisted",
          shorts: isShorts,
          customMetadata: {
            title: resolvedTitle,
            description: customDescription,
            tags: tagsList,
          },
        }),
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || "YouTube upload failed");
      }

      setUploadSuccessUrl(uploadData.url || "https://studio.youtube.com");
      setReleaseStep("Published to YouTube!");
    } catch (err: any) {
      console.error("Release error:", err);
      setUploadError(err.message || "Release failed");
    } finally {
      setIsReleasing(false);
      checkStatus(selectedBeat.id);
    }
  };

  const freePrefix =
    selectedBeat?.beatType === "Exclusive" ? "[EXCLUSIVE]" : "[FREE]";
  const defaultTitle = `${freePrefix} "${selectedBeat?.title || "Beat"}" | ${artistVibe} Type Beat | DZVNbeats`;
  const resolvedTitle = customTitle || defaultTitle;

  const tagsString = tagsList.join(", ");
  const tagsLength = tagsString.length;

  const coverUrl = selectedBeat?.coverArt
    ? `${import.meta.env.BASE_URL}${selectedBeat.coverArt.replace(/^\.\//, "")}`
    : `${import.meta.env.BASE_URL}banner.png`;

  const audioUrl = selectedBeat
    ? `${import.meta.env.BASE_URL}beats/${encodeURIComponent(selectedBeat.filename)}`
    : "";

  const isCurrentVideoRendered =
    aspectRatio === "16:9"
      ? videoStatus.video.exists
      : videoStatus.shorts.exists;

  const currentVideoUrl =
    aspectRatio === "16:9"
      ? videoStatus.video.url
      : videoStatus.shorts.url;

  const currentVideoSize =
    aspectRatio === "16:9"
      ? videoStatus.video.sizeMb
      : videoStatus.shorts.sizeMb;

  return (
    <div className="pt-28 pb-20 min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Sleek Minimal Command Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xl shadow-lg">
          {/* Left: Studio Brand & Track Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                <Sliders className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-sm font-extrabold text-white tracking-tight hidden md:inline">
                Studio
              </span>
            </div>

            {/* Track Selector Pill */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <div className="relative">
                <select
                  aria-label="Select track from catalog"
                  value={isBlankMode ? "" : selectedBeatId}
                  onChange={(e) => {
                    if (e.target.value) {
                      setIsBlankMode(false);
                      setSelectedBeatId(e.target.value);
                    }
                  }}
                  className="appearance-none bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-white focus:outline-none transition-all cursor-pointer max-w-[200px] sm:max-w-[300px] truncate"
                >
                  <option value="" disabled={!isBlankMode}>
                    {isBlankMode ? "Select Track..." : "Catalog Tracks"}
                  </option>
                  {localBeats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.bpm || 120} BPM)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400 text-[10px]">
                  ▼
                </div>
              </div>

              <button
                onClick={() => setIsBlankMode(true)}
                title="Create or drop custom audio"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  isBlankMode
                    ? "bg-amber-400 text-zinc-950 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>

          {/* Right: Clean Workflow Tabs */}
          {!isBlankMode && (
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-inner">
              <button
                onClick={() => setActiveMainTab("video")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMainTab === "video"
                    ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/25 font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Visual Studio</span>
              </button>

              <button
                onClick={() => setActiveMainTab("distribution")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMainTab === "distribution"
                    ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/25 font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>Distribution Studio</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =========================================================================
            STATE A: DEFAULT BLANK MODE (Dedicated Clean Intake Studio)
            ========================================================================= */}
        {isBlankMode ? (
          <div className="max-w-2xl mx-auto py-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsCanvasDragOver(true);
              }}
              onDragLeave={() => setIsCanvasDragOver(false)}
              onDrop={handleCanvasDrop}
              onClick={() => canvasFileInputRef.current?.click()}
              className={`rounded-3xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 bg-zinc-900/30 backdrop-blur-xl relative overflow-hidden flex flex-col items-center justify-center min-h-[380px] shadow-2xl ${
                isCanvasDragOver
                  ? "border-amber-400 bg-amber-400/10 scale-[1.01] shadow-amber-400/20"
                  : "border-zinc-700/80 hover:border-amber-400/60 hover:bg-zinc-900/50"
              }`}
            >
              <input
                ref={canvasFileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.flac,.ogg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    autoIngestDroppedTrack(e.target.files[0], null);
                  }
                }}
              />

              {isIngesting ? (
                <div className="space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 className="w-7 h-7 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Setting Up Beat...
                    </h3>
                    <p className="text-xs text-amber-400 font-mono mt-1 animate-pulse">
                      {ingestMessage}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 text-amber-400 flex items-center justify-center mx-auto shadow-lg transition-transform">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      Drop Audio to Distribute
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      WAV or MP3 • Artwork optional
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-block px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20">
                      Choose Audio File
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Catalog Bar below dropzone */}
            {localBeats.length > 0 && (
              <div className="mt-8 text-center">
                <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider block mb-3">
                  Or manage existing beat
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {localBeats.slice(0, 5).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBeatId(b.id);
                        setIsBlankMode(false);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
                    >
                      {b.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
              STATE B: ACTIVE BEAT WORKFLOW (Cohesive Tabs: Video Studio vs Distribution)
              ========================================================================= */
          <>
            {/* TAB 1: VIDEO & FX STUDIO */}
            {activeMainTab === "video" && selectedBeat && (
              <div className="space-y-4">
                <InteractiveVideoStudio
                  beat={selectedBeat}
                  aspectRatio={aspectRatio}
                  onAspectRatioChange={setAspectRatio}
                  onRenderComplete={() => {
                    checkStatus(selectedBeat.id);
                  }}
                  onNavigateToDistribution={() => setActiveMainTab("distribution")}
                />
              </div>
            )}

            {/* TAB 2: DISTRIBUTION & MULTI-PLATFORM RELEASE */}
            {activeMainTab === "distribution" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: VIDEO PREVIEW & ACTIONS (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-xl shadow-xl space-y-3">
                    {/* Format Toggle & FX Studio trigger */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                          Preview
                        </span>
                        <button
                          onClick={() => setActiveMainTab("video")}
                          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-[11px] font-bold transition-all cursor-pointer shadow-sm shadow-amber-400/10"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span>Visual Studio</span>
                        </button>
                      </div>
                  <div className="flex items-center p-1 bg-zinc-950 rounded-lg border border-zinc-800 text-xs font-mono">
                    <button
                      onClick={() => setAspectRatio("16:9")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        aspectRatio === "16:9"
                          ? "bg-zinc-800 text-amber-400 font-bold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      16:9
                    </button>
                    <button
                      onClick={() => setAspectRatio("9:16")}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        aspectRatio === "9:16"
                          ? "bg-zinc-800 text-amber-400 font-bold"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      9:16 Shorts
                    </button>
                  </div>
                </div>

                {/* Video / Simulator Canvas (Accepts drops anytime) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsCanvasDragOver(true);
                  }}
                  onDragLeave={() => setIsCanvasDragOver(false)}
                  onDrop={handleCanvasDrop}
                  className="relative flex justify-center bg-zinc-950/90 rounded-xl p-2 border border-zinc-800/80 overflow-hidden min-h-[290px] items-center"
                >
                  {isCanvasDragOver && (
                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                      <UploadCloud className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
                      <p className="text-xs font-extrabold text-white">
                        Drop to Replace Audio
                      </p>
                    </div>
                  )}

                  {isIngesting && (
                    <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                      <p className="text-xs text-amber-400 font-mono animate-pulse">
                        {ingestMessage}
                      </p>
                    </div>
                  )}

                  {isCurrentVideoRendered && currentVideoUrl ? (
                    <div
                      className={`flex flex-col items-center justify-center w-full ${
                        aspectRatio === "9:16" ? "max-w-[240px]" : "w-full"
                      }`}
                    >
                      <video
                        key={`${selectedBeat.id}-${aspectRatio}-${currentVideoSize}`}
                        src={`${currentVideoUrl}?v=${currentVideoSize || Date.now()}`}
                        controls
                        playsInline
                        preload="metadata"
                        className={`rounded-lg shadow-xl border border-zinc-700 bg-black ${
                          aspectRatio === "16:9"
                            ? "w-full aspect-video"
                            : "w-[240px] aspect-[9/16]"
                        }`}
                      />
                    </div>
                  ) : (
                    /* Simulator with Waveform */
                    <div
                      className={`relative overflow-hidden rounded-lg border border-zinc-800 shadow-xl flex items-center justify-center transition-all ${
                        aspectRatio === "16:9"
                          ? "w-full aspect-video"
                          : "w-[220px] aspect-[9/16]"
                      }`}
                    >
                      <div
                        className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 brightness-75"
                        style={{ backgroundImage: `url(${coverUrl})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                      <div className="relative z-10 flex flex-col items-center text-center p-3">
                        <div
                          className={`relative rounded-xl overflow-hidden shadow-2xl border border-amber-400/30 transition-transform ${
                            aspectRatio === "16:9" ? "w-28 h-28" : "w-24 h-24"
                          } ${isPlaying ? "scale-105" : "scale-100"}`}
                        >
                          <img
                            src={coverUrl}
                            alt={selectedBeat.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="mt-2.5">
                          <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                            {selectedBeat.bpm || 120} BPM • {selectedBeat.key || "C min"}
                          </span>
                          <h3 className="text-sm font-extrabold text-white truncate max-w-[200px]">
                            {selectedBeat.title}
                          </h3>
                        </div>

                        {/* Waveform */}
                        <div className="flex items-center gap-1 mt-2 h-4">
                          {[12, 20, 10, 24, 16, 10, 22, 14, 8, 18].map((h, i) => (
                            <span
                              key={i}
                              className={`w-1 rounded-full bg-amber-400 transition-all ${
                                isPlaying ? "animate-pulse" : "opacity-30 h-1.5"
                              }`}
                              style={{ height: isPlaying ? `${h}px` : "3px" }}
                            />
                          ))}
                        </div>

                        <button
                          onClick={() => setActiveMainTab("video")}
                          className="mt-3.5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-[11px] font-extrabold shadow-md shadow-amber-400/20 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-current" />
                          <span>Open Visual Studio</span>
                        </button>
                      </div>

                      <button
                        onClick={togglePlay}
                        aria-label={isPlaying ? "Pause preview" : "Play preview"}
                        className="absolute bottom-2.5 right-2.5 z-20 w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center shadow-md cursor-pointer"
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                />

                {/* UNIFIED ACTION ENGINE (Punchy, Unwordy Buttons) */}
                <div className="space-y-2 pt-1">
                  {isCurrentVideoRendered ? (
                    <>
                      {/* Video Ready Status Badge */}
                      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono">
                        <span className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Visual Studio MP4 Ready</span>
                        </span>
                        <span>{currentVideoSize} MB • 1080p</span>
                      </div>

                      {/* Primary 1-Click Action: Publish to YouTube */}
                      <button
                        onClick={handlePublishToYouTube}
                        disabled={isReleasing}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/25 active:scale-[0.99] cursor-pointer"
                      >
                        {isReleasing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            <span>{releaseStep || "Publishing..."}</span>
                          </>
                        ) : (
                          <>
                            <Youtube className="w-4 h-4 fill-white" />
                            <span>Publish to YouTube</span>
                          </>
                        )}
                      </button>

                      {/* Secondary Actions */}
                      <div className="flex items-center gap-2">
                        {currentVideoUrl && (
                          <a
                            href={currentVideoUrl}
                            download={`${selectedBeat.id}${aspectRatio === "9:16" ? "-shorts" : ""}.mp4`}
                            className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>Download MP4</span>
                          </a>
                        )}

                        <button
                          onClick={() => setActiveMainTab("video")}
                          className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit in Studio</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Video Not Rendered State */}
                      <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 text-xs flex flex-col gap-1">
                        <span className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>No {aspectRatio === "9:16" ? "9:16 Shorts" : "16:9"} Video Rendered Yet</span>
                        </span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Design your scene with audio-reactive visuals in the Visual Studio and export before publishing.
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveMainTab("video")}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-[0.99] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        <span>Open Visual Studio to Render Video</span>
                      </button>
                    </>
                  )}

                  {/* Status / Output alerts */}
                  {uploadError && (
                    <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-xs text-red-300">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span className="truncate">{uploadError}</span>
                    </div>
                  )}

                  {uploadSuccessUrl && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Published!</span>
                      </div>
                      <a
                        href={uploadSuccessUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-bold text-emerald-300 hover:text-white flex items-center gap-1"
                      >
                        View
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: DISTRIBUTION METADATA & REACH (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Platform Switcher Tabs */}
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2.5">
                <button
                  onClick={() => setActivePlatformTab("youtube")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    activePlatformTab === "youtube"
                      ? "bg-red-500/10 text-red-400 border border-red-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  YouTube
                </button>

                <button
                  onClick={() => setActivePlatformTab("discord")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    activePlatformTab === "discord"
                      ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  Discord
                </button>

                <button
                  onClick={() => setActivePlatformTab("telegram")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    activePlatformTab === "telegram"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  Telegram
                </button>

                <button
                  onClick={() => setActivePlatformTab("tiktok")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                    activePlatformTab === "tiktok"
                      ? "bg-pink-500/10 text-pink-400 border border-pink-500/30"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  Shorts / TikTok
                </button>
              </div>

              {/* YOUTUBE METADATA */}
              {activePlatformTab === "youtube" && (
                <div className="space-y-3">
                  {/* Title Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="font-bold flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-400" />
                        Title
                      </span>
                      <span>{resolvedTitle.length} / 100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-white font-bold truncate">
                        {resolvedTitle}
                      </div>
                      <button
                        onClick={() => copyToClipboard(resolvedTitle, "title")}
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all cursor-pointer shrink-0"
                        aria-label="Copy title"
                      >
                        {copiedKey === "title" ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Tags Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="font-bold flex items-center gap-1">
                        <Hash className="w-3 h-3 text-amber-400" />
                        Discovery Tags
                      </span>
                      <span>{tagsLength} / 500</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      {tagsList.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => copyToClipboard(tagsString, "tags")}
                        className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === "tags" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Copy Tags
                      </button>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span className="font-bold flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-400" />
                        Description &amp; Links
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(customDescription, "description")
                        }
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === "description" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        Copy
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {customDescription}
                    </pre>
                  </div>

                  {/* Collapsible Edit Drawer */}
                  <div className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/30">
                    <button
                      onClick={() => setShowMetadataEditor(!showMetadataEditor)}
                      className="w-full flex items-center justify-between p-3 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-amber-400" />
                        Customize Vibe / Title
                      </span>
                      {showMetadataEditor ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {showMetadataEditor && (
                      <div className="p-3 border-t border-zinc-800/80 space-y-3 bg-zinc-950/40">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Artist Vibe
                          </label>
                          <input
                            type="text"
                            value={artistVibe}
                            onChange={(e) => setArtistVibe(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold text-white outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Custom Title
                          </label>
                          <input
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-bold text-white outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DISCORD TAB */}
              {activePlatformTab === "discord" && (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                    {`🚨 **NEW BEAT** 🚨\n\n🎶 **"${selectedBeat.title}"** [${selectedBeat.bpm || 120} BPM • ${selectedBeat.key || "C minor"}]\n🛒 Listen & Lease: ${purchaseUrl}\n\nProd. by @DZVN`}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `🚨 **NEW BEAT** 🚨\n\n🎶 **"${selectedBeat.title}"** [${selectedBeat.bpm || 120} BPM • ${selectedBeat.key || "C minor"}]\n🛒 Listen & Lease: ${purchaseUrl}\n\nProd. by @DZVN`,
                        "discordMsg",
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === "discordMsg" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Discord Post
                  </button>
                </div>
              )}

              {/* TELEGRAM TAB */}
              {activePlatformTab === "telegram" && (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300 whitespace-pre-wrap">
                    {`🔥 New Release: ${selectedBeat.title}\n🎹 Key: ${selectedBeat.key || "C minor"} | Tempo: ${selectedBeat.bpm || 120} BPM\n🔗 ${purchaseUrl}`}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `🔥 New Release: ${selectedBeat.title}\n🎹 Key: ${selectedBeat.key || "C minor"} | Tempo: ${selectedBeat.bpm || 120} BPM\n🔗 ${purchaseUrl}`,
                        "telegramMsg",
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === "telegramMsg" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Telegram Post
                  </button>
                </div>
              )}

              {/* TIKTOK / SHORTS TAB */}
              {activePlatformTab === "tiktok" && (
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
                    {`🔥 "${selectedBeat.title}" • ${selectedBeat.bpm || 120} BPM ${selectedBeat.key || "C minor"}. Free link in bio! #typebeat #trapbeat #producer #beatmaker #dzvnbeats`}
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `🔥 "${selectedBeat.title}" • ${selectedBeat.bpm || 120} BPM ${selectedBeat.key || "C minor"}. Free link in bio! #typebeat #trapbeat #producer #beatmaker #dzvnbeats`,
                        "shortsCaption",
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === "shortsCaption" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy Caption
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )}
  </div>
</div>
);
};

export default DistributionAdminPage;
