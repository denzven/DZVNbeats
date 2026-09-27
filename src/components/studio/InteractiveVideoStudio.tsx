import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Sparkles,
  Download,
  Disc,
  Smartphone,
  Settings2,
  Check,
  RotateCcw,
  Zap,
  Grid,
  Activity,
  LayoutGrid,
  ChevronRight,
  SlidersVertical,
  Volume2,
  VolumeX,
  Palette,
  Square,
  Radio,
} from "lucide-react";
import { VideoEngine } from "../../video-engine/VideoEngine";
import { VideoExporter, RenderProgress } from "../../video-engine/VideoExporter";
import { ColorExtractor, ExtractedPalette } from "../../video-engine/ColorExtractor";
import { VIDEO_PRESETS } from "../../video-engine/presets";
import {
  AspectRatio,
  BeatMetadata,
  VideoEffect,
  VideoPreset,
} from "../../video-engine/types";

interface InteractiveVideoStudioProps {
  beat: BeatMetadata;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onRenderComplete?: (videoUrl: string) => void;
  onNavigateToDistribution?: () => void;
}

const drawSpectrumGraph = (
  canvas: HTMLCanvasElement,
  audio: any
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, w, h);

  // Logarithmic frequency grid markers (20Hz - 20,000Hz)
  const markers = [
    { hz: 20, label: "20Hz" },
    { hz: 60, label: "60Hz" },
    { hz: 250, label: "250Hz" },
    { hz: 1000, label: "1kHz" },
    { hz: 4000, label: "4kHz" },
    { hz: 10000, label: "10kHz" },
    { hz: 20000, label: "20kHz" },
  ];

  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.fillStyle = "rgba(161, 161, 170, 0.75)";
  ctx.font = "8px 'Space Mono', monospace";
  ctx.textAlign = "center";

  for (const m of markers) {
    const logFrac =
      (Math.log10(m.hz) - Math.log10(20)) /
      (Math.log10(20000) - Math.log10(20));
    const x = Math.min(w - 1, Math.max(0, logFrac * w));
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h - 14);
    ctx.stroke();
    ctx.fillText(m.label, x, h - 3);
  }

  // Draw spectrum curve
  const freq = audio.frequencyData;
  const adaptiveFft = audio.adaptiveFft;
  if (!freq || freq.length === 0) return;

  const points: { x: number; y: number }[] = [];
  const numSteps = 72;

  for (let i = 0; i <= numSteps; i++) {
    const frac = i / numSteps;
    const x = frac * w;
    const hz = Math.pow(
      10,
      Math.log10(20) + frac * (Math.log10(20000) - Math.log10(20))
    );
    const bin = Math.min(
      freq.length - 1,
      Math.max(0, Math.round((hz / 44100) * (freq.length * 2)))
    );

    let amp = 0;
    if (adaptiveFft && adaptiveFft[bin] !== undefined) {
      amp = adaptiveFft[bin];
    } else {
      amp = (freq[bin] || 0) / 255;
    }

    const y = h - 16 - amp * (h - 22);
    points.push({ x, y: Math.max(4, y) });
  }

  // Gradient under curve
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, "rgba(245, 158, 11, 0.45)");   // Sub (Amber)
  grad.addColorStop(0.18, "rgba(234, 179, 8, 0.45)");  // Bass (Yellow)
  grad.addColorStop(0.42, "rgba(244, 63, 94, 0.45)");  // Drum/Snare (Rose)
  grad.addColorStop(0.65, "rgba(16, 185, 129, 0.45)"); // Vocal (Emerald)
  grad.addColorStop(0.85, "rgba(6, 182, 212, 0.45)");  // Hats (Cyan)
  grad.addColorStop(1, "rgba(56, 189, 248, 0.45)");    // Air (Sky)

  ctx.beginPath();
  ctx.moveTo(points[0].x, h - 14);
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      ctx.lineTo(points[i].x, points[i].y);
    } else {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
    }
  }
  ctx.lineTo(w, h - 14);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Glowing stroke curve
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) ctx.moveTo(points[i].x, points[i].y);
    else {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      const cy = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
    }
  }
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "#38bdf8";
  ctx.shadowBlur = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;
};

export const InteractiveVideoStudio: React.FC<InteractiveVideoStudioProps> = ({
  beat,
  aspectRatio,
  onAspectRatioChange,
  onRenderComplete,
  onNavigateToDistribution,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const engineRef = useRef<VideoEngine | null>(null);
  const exporterRef = useRef<VideoExporter | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMeterUpdateRef = useRef<number>(0);
  const latestAnalysisRef = useRef<any>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [isMuted, setIsMuted] = useState(false);

  // Studio Side Panel State
  const [activeTab, setActiveTab] = useState<"presets" | "effects" | "alignment">("presets");
  const [showAllRatios, setShowAllRatios] = useState(false);
  const [activePreset, setActivePreset] = useState<string>(
    aspectRatio === "16:9" ? "blank-transparent" : "blank-transparent-shorts"
  );
  const [effects, setEffects] = useState<VideoEffect[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedEffectId, setExpandedEffectId] = useState<string | null>(null);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [showSidePanel] = useState(true);

  // Live Audio Variable Graphs state (20Hz - 20kHz, drums, snares, vocal melody, hi-hats, bass, sub-bass)
  const [audioMeters, setAudioMeters] = useState({
    subBass: 0.1,
    bass: 0.1,
    drums: 0.1,
    snare: 0.1,
    vocalMelody: 0.1,
    hihats: 0.1,
    mids: 0.1,
    highs: 0.1,
    spectralTilt: 0,
    overallEnergy: 0.1,
    isKick: false,
    isSnare: false,
    isHihat: false,
  });

  // Selected preset tracking ref to prevent ratio change effect from bouncing back to blank preset
  const selectedPresetTargetRef = useRef<VideoPreset | null>(null);

  // Cover Art Palette matching state (ColorThief Quantization)
  const [coverPalette, setCoverPalette] = useState<ExtractedPalette | null>(null);
  const [autoColorMatch, setAutoColorMatch] = useState<boolean>(true);
  const [activeAccentColor, setActiveAccentColor] = useState<string>("#fbbf24");

  // Export State
  const [exportFps, setExportFps] = useState<30 | 60>(30);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<RenderProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const audioUrl = beat.filename
    ? `${import.meta.env.BASE_URL}beats/${encodeURIComponent(beat.filename)}`
    : "";

  const coverUrl = beat.coverArt
    ? `${import.meta.env.BASE_URL}${beat.coverArt.replace(/^\.\//, "")}`
    : `${import.meta.env.BASE_URL}DZVNbeats_pfp.jpeg`;

  // 1. Initialize VideoEngine
  useEffect(() => {
    if (!canvasRef.current || !audioRef.current) return;

    const engine = new VideoEngine({
      canvas: canvasRef.current,
      aspectRatio,
      beat: {
        ...beat,
        coverArt: coverUrl,
      },
      audioElement: audioRef.current,
    });

    engine.onTimeUpdate = (curr, dur) => {
      setCurrentTime(curr);
      if (dur > 0) setDuration(dur);
    };

    engine.onPlayStateChange = (playing) => {
      setIsPlaying(playing);
    };

    engine.onAudioAnalysis = (analysis) => {
      latestAnalysisRef.current = analysis;

      if (spectrumCanvasRef.current) {
        drawSpectrumGraph(spectrumCanvasRef.current, analysis);
      }

      const now = performance.now();
      if (now - lastMeterUpdateRef.current > 40) {
        lastMeterUpdateRef.current = now;
        setAudioMeters({
          subBass: analysis.calibrated?.subBass ?? analysis.subBass ?? 0,
          bass: analysis.calibrated?.bass ?? analysis.bass ?? 0,
          drums: analysis.calibrated?.drums ?? analysis.drums ?? 0,
          snare: analysis.calibrated?.snare ?? analysis.snare ?? 0,
          vocalMelody: analysis.calibrated?.vocalMelody ?? analysis.vocalMelody ?? 0,
          hihats: analysis.calibrated?.hihats ?? analysis.hihats ?? 0,
          mids: analysis.calibrated?.mids ?? analysis.mids ?? 0,
          highs: analysis.calibrated?.highs ?? analysis.highs ?? 0,
          spectralTilt: analysis.calibrated?.spectralTilt ?? 0,
          overallEnergy: analysis.overallEnergy ?? 0,
          isKick: analysis.isKick,
          isSnare: analysis.isSnare,
          isHihat: analysis.isHihat,
        });
      }
    };

    engine.onPaletteExtracted = (pal) => {
      setCoverPalette(pal);
      setActiveAccentColor(pal.accent);
    };

    if (engine.extractedPalette) {
      setCoverPalette(engine.extractedPalette);
      setActiveAccentColor(engine.extractedPalette.accent);
    }

    engineRef.current = engine;
    setEffects([...engine.getEffects()]);

    // Start from blank transparent screen by default
    const initialPreset =
      VIDEO_PRESETS.find(
        (p) =>
          p.id ===
          (aspectRatio === "16:9"
            ? "blank-transparent"
            : "blank-transparent-shorts")
      ) || VIDEO_PRESETS.find((p) => p.aspectRatio === aspectRatio);

    if (initialPreset) {
      engine.applyPreset(initialPreset);
      setActivePreset(initialPreset.id);
      setEffects([...engine.getEffects()]);
    }

    // Ensure custom Google Fonts (Outfit, Space Mono) render immediately once loaded
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        engine.renderFrame();
      });
    }

    return () => {
      engine.destroy();
    };
  }, [beat.id, coverUrl]);

  // Redraw live spectrum graph when switching to Variable Graphs tab
  useEffect(() => {
    if (activeTab === "alignment" && spectrumCanvasRef.current) {
      const audio =
        latestAnalysisRef.current || engineRef.current?.getAudioAnalysis();
      if (audio) {
        drawSpectrumGraph(spectrumCanvasRef.current, audio);
      }
    }
  }, [activeTab]);

  // Extract cover palette immediately when coverUrl changes
  useEffect(() => {
    if (!coverUrl) return;
    ColorExtractor.extract(coverUrl).then((palette) => {
      setCoverPalette(palette);
      setActiveAccentColor(palette.accent);
      if (engineRef.current && autoColorMatch) {
        engineRef.current.applyCoverPalette(palette);
        setEffects([...engineRef.current.getEffects()]);
      }
    });
  }, [coverUrl]);

  // 2. Handle Aspect Ratio change (with protection against blank preset bounce)
  useEffect(() => {
    if (!engineRef.current) return;

    // Check if aspect ratio change was triggered by clicking a preset in the gallery
    if (selectedPresetTargetRef.current) {
      const preset = selectedPresetTargetRef.current;
      selectedPresetTargetRef.current = null;
      engineRef.current.setAspectRatio(aspectRatio, false);
      engineRef.current.applyPreset(preset);
      setActivePreset(preset.id);
      setShowGridOverlay(engineRef.current.showDebugGrid);
      setEffects([...engineRef.current.getEffects()]);
      return;
    }

    // Switched via format buttons (e.g. 16:9 or 9:16 toggle pills)
    engineRef.current.setAspectRatio(aspectRatio, false);
    const isBlank = activePreset.startsWith("blank-transparent");

    let matchingPreset: VideoPreset | undefined;
    if (isBlank) {
      matchingPreset = VIDEO_PRESETS.find(
        (p) => p.id === (aspectRatio === "16:9" ? "blank-transparent" : "blank-transparent-shorts")
      );
    } else {
      // Find a styled (non-blank) preset for this aspect ratio
      matchingPreset = VIDEO_PRESETS.find(
        (p) => p.aspectRatio === aspectRatio && !p.id.startsWith("blank-")
      );
    }

    if (matchingPreset) {
      engineRef.current.applyPreset(matchingPreset);
      setActivePreset(matchingPreset.id);
    }
    setShowGridOverlay(engineRef.current.showDebugGrid);
    setEffects([...engineRef.current.getEffects()]);
  }, [aspectRatio]);

  // 3. Audio Calibration meter live ticker
  useEffect(() => {
    if (!isPlaying || activeTab !== "alignment") return;
    let animId: number;

    const tick = () => {
      if (engineRef.current) {
        const analyzer = engineRef.current.getAudioAnalyzer();
        const analysis = analyzer.getAnalysis(currentTime);
        if (spectrumCanvasRef.current) {
          drawSpectrumGraph(spectrumCanvasRef.current, analysis);
        }
        setAudioMeters({
          subBass: analysis.calibrated?.subBass ?? analysis.subBass ?? 0,
          bass: analysis.calibrated?.bass ?? analysis.bass ?? 0,
          drums: analysis.calibrated?.drums ?? analysis.drums ?? 0,
          snare: analysis.calibrated?.snare ?? analysis.snare ?? 0,
          vocalMelody: analysis.calibrated?.vocalMelody ?? analysis.vocalMelody ?? 0,
          hihats: analysis.calibrated?.hihats ?? analysis.hihats ?? 0,
          mids: analysis.calibrated?.mids ?? analysis.mids ?? 0,
          highs: analysis.calibrated?.highs ?? analysis.highs ?? 0,
          spectralTilt: analysis.calibrated?.spectralTilt ?? 0,
          overallEnergy: analysis.overallEnergy ?? 0,
          isKick: analysis.isKick,
          isSnare: analysis.isSnare,
          isHihat: analysis.isHihat,
        });
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, activeTab]);

  const togglePlay = () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.pause();
    } else {
      engineRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (engineRef.current) {
      engineRef.current.seek(val);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handlePresetSelect = (preset: VideoPreset) => {
    selectedPresetTargetRef.current = preset;
    setActivePreset(preset.id);
    if (preset.aspectRatio !== aspectRatio) {
      onAspectRatioChange(preset.aspectRatio);
    } else {
      selectedPresetTargetRef.current = null;
    }
    if (engineRef.current) {
      if (engineRef.current.getAspectRatio() !== preset.aspectRatio) {
        engineRef.current.setAspectRatio(preset.aspectRatio, false);
      }
      engineRef.current.applyPreset(preset);
      setShowGridOverlay(engineRef.current.showDebugGrid);
      setEffects([...engineRef.current.getEffects()]);
    }
  };

  const handleToggleAutoColorMatch = (enabled: boolean) => {
    setAutoColorMatch(enabled);
    if (engineRef.current) {
      engineRef.current.setAutoColorMatch(enabled);
      if (enabled && coverPalette) {
        engineRef.current.applyCoverPalette(coverPalette);
      }
      setEffects([...engineRef.current.getEffects()]);
    }
  };

  const handleApplyPalette = () => {
    if (!coverPalette || !engineRef.current) return;
    engineRef.current.applyCoverPalette(coverPalette);
    setActiveAccentColor(coverPalette.accent);
    setEffects([...engineRef.current.getEffects()]);
  };

  const handleSelectAccentSwatch = (hex: string) => {
    setActiveAccentColor(hex);
    if (engineRef.current) {
      engineRef.current.applyAccentColor(hex);
      setEffects([...engineRef.current.getEffects()]);
    }
  };

  const handleToggleEffect = (id: string) => {
    if (!engineRef.current) return;
    engineRef.current.toggleEffect(id);
    if (id === "debug-grid-guides") {
      setShowGridOverlay(engineRef.current.showDebugGrid);
    }
    setEffects([...engineRef.current.getEffects()]);
  };

  const handleUpdateOption = (id: string, key: string, val: any) => {
    if (!engineRef.current) return;
    engineRef.current.updateEffectOption(id, key, val);
    setEffects([...engineRef.current.getEffects()]);
  };

  const handleToggleGrid = () => {
    if (!engineRef.current) return;
    engineRef.current.toggleDebugGrid();
    setShowGridOverlay(engineRef.current.showDebugGrid);
    setEffects([...engineRef.current.getEffects()]);
  };

  const handleDeselectAll = () => {
    if (!engineRef.current) return;
    engineRef.current.deselectAllEffects();
    setShowGridOverlay(false);
    setActivePreset(
      aspectRatio === "16:9" ? "blank-transparent" : "blank-transparent-shorts"
    );
    setEffects([...engineRef.current.getEffects()]);
  };

  const handleSelectAll = () => {
    if (!engineRef.current) return;
    engineRef.current.selectAllEffects();
    setEffects([...engineRef.current.getEffects()]);
  };

  const handleReplayIntro = () => {
    if (!engineRef.current) return;
    engineRef.current.replayIntro();
  };

  // 4. Export Action (GPU WebCodecs + mp4-muxer + Direct Server Sync)
  const handleExportMP4 = async () => {
    if (!engineRef.current || isExporting) return;

    try {
      setIsExporting(true);
      setExportError(null);
      setExportSuccess(null);
      setExportProgress(null);

      // Pause live preview
      engineRef.current.pause();

      const exporter = new VideoExporter();
      exporterRef.current = exporter;

      // Preload image object
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = coverUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const blob = await exporter.exportMP4({
        beat: {
          ...beat,
          coverArt: coverUrl,
        },
        aspectRatio,
        effects: engineRef.current.getEffects(),
        audioUrl,
        coverImage: img,
        fps: exportFps,
        bitrate: exportFps === 60 ? 14_000_000 : 9_000_000,
        onProgress: (p) => {
          setExportProgress(p);
        },
      });

      // Upload rendered MP4 blob to backend server `/api/studio/save-video`
      const isShorts = aspectRatio === "9:16";
      const saveRes = await fetch("/api/studio/save-video", {
        method: "POST",
        headers: {
          "x-beat-id": beat.id,
          "x-shorts": isShorts ? "1" : "0",
          "Content-Type": "video/mp4",
        },
        body: blob,
      });

      const saveData = await saveRes.json();
      if (!saveData.success) {
        throw new Error(saveData.error || "Failed to save video to studio storage");
      }

      setExportSuccess(
        `Video exported and saved successfully! (${(blob.size / (1024 * 1024)).toFixed(1)} MB)`
      );

      // Trigger download for creator
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = isShorts ? `${beat.id}-shorts-1080p.mp4` : `${beat.id}-1080p.mp4`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      onRenderComplete?.(saveData.url || `/api/video/${beat.id}${isShorts ? "-shorts" : ""}.mp4`);
    } catch (err: any) {
      console.error("Export error:", err);
      setExportError(err.message || "Failed to render video");
    } finally {
      setIsExporting(false);
      exporterRef.current = null;
    }
  };

  const cancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
      setIsExporting(false);
    }
  };

  const categories = [
    { id: "all", label: "All Layers" },
    { id: "background", label: "Background" },
    { id: "hero", label: "Hero Stage" },
    { id: "visualizer", label: "Visualizers" },
    { id: "particles", label: "Particles" },
    { id: "hud", label: "HUD & Info" },
    { id: "post", label: "Post FX" },
  ];

  const getCategoryCount = (catId: string) => {
    if (catId === "all") return effects.length;
    return effects.filter((e) => e.category === catId).length;
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "background":
        return "bg-indigo-950/70 text-indigo-300 border border-indigo-700/50";
      case "hero":
        return "bg-amber-950/70 text-amber-300 border border-amber-600/50";
      case "visualizer":
        return "bg-emerald-950/70 text-emerald-300 border border-emerald-600/50";
      case "particles":
        return "bg-orange-950/70 text-orange-300 border border-orange-600/50";
      case "hud":
        return "bg-blue-950/70 text-blue-300 border border-blue-600/50";
      case "post":
      default:
        return "bg-purple-950/70 text-purple-300 border border-purple-700/50";
    }
  };

  const filteredEffects =
    selectedCategory === "all"
      ? effects
      : effects.filter((e) => e.category === selectedCategory);

  const filteredPresets = VIDEO_PRESETS.filter((p) => {
    if (showAllRatios) return true;
    return p.aspectRatio === aspectRatio;
  });

  const getPresetIcon = (presetId: string) => {
    if (presetId.startsWith("blank-transparent")) return Square;
    if (presetId.includes("vinyl-lounge") || presetId.includes("vinyl-studio")) return Disc;
    if (presetId.includes("studio-console")) return SlidersVertical;
    if (presetId.includes("dark-trap") || presetId.includes("drill-trap")) return Zap;
    if (presetId.includes("lofi-tape")) return Radio;
    if (presetId.includes("synthwave")) return Sparkles;
    if (presetId.includes("ambient") || presetId.includes("mesh")) return Palette;
    if (presetId.includes("billboard") || presetId.includes("glass-spectrum")) return LayoutGrid;
    if (presetId.includes("bass-thump")) return Activity;
    return LayoutGrid;
  };

  const getPresetSubtag = (presetId: string) => {
    if (presetId.startsWith("blank-transparent")) return "Transparent Canvas • Build from Scratch";
    if (presetId === "vinyl-lounge")           return "Spinning Vinyl • Donut Ring • Classic HUD";
    if (presetId === "studio-console")         return "Spotlight • LED VU Meters • CRT Scope";
    if (presetId === "dark-trap-reactor")      return "808 Bounce • Fire Embers • RGB Glitch";
    if (presetId === "lofi-tape-chill")        return "Cassette Deck • CRT Oscilloscope • Spotify Pill";
    if (presetId === "synthwave-outrun")       return "Cyber Grid • Circular Donut • Tech HUD";
    if (presetId === "ambient-fluid-mesh")     return "Mesh Gradient • Fluid Wave • Minimal Dock";
    if (presetId === "billboard-cinematic")    return "Cover Art Card • Donut Ring • Centered Poster";
    if (presetId === "bass-thump-shorts")      return "Kick Bounce • Donut Ring • Fire Embers";
    if (presetId === "lofi-tape-shorts")       return "Cassette Deck • Fluid Wave • Spotify Pill";
    if (presetId === "drill-trap-shorts")      return "808 Bounce • Simple Bars • RGB Glitch";
    if (presetId === "synthwave-neon-shorts")  return "Cyber Grid • Solo Vinyl • Neon Scope";
    if (presetId === "ambient-mesh-shorts")    return "Mesh Gradient • Tri-Band EQ • Minimal Dock";
    if (presetId === "glass-spectrum-shorts")  return "Cover Art Card • Glass Spectrum Dock";
    if (presetId === "vinyl-studio-shorts")    return "Spotlight • Solo Vinyl • LED VU Meters";
    return "Curated Video Preset";
  };

  const activePresetObj = VIDEO_PRESETS.find((p) => p.id === activePreset);
  const activePresetTitle = activePresetObj ? activePresetObj.name : "Custom Studio Setup";

  const getPresetVisualClass = (presetId: string) => {
    if (presetId.startsWith("blank-transparent"))
      return "from-zinc-900 to-zinc-950 border-zinc-800";
    if (presetId === "vinyl-lounge" || presetId === "vinyl-studio-shorts")
      return "from-amber-950/50 via-zinc-900 to-zinc-950 border-amber-500/30";
    if (presetId === "studio-console")
      return "from-yellow-950/50 via-zinc-900 to-zinc-950 border-yellow-600/30";
    if (presetId === "dark-trap-reactor" || presetId === "drill-trap-shorts")
      return "from-red-950/60 via-zinc-900 to-zinc-950 border-red-600/40";
    if (presetId === "lofi-tape-chill" || presetId === "lofi-tape-shorts")
      return "from-emerald-950/50 via-zinc-900 to-zinc-950 border-emerald-600/30";
    if (presetId === "synthwave-outrun" || presetId === "synthwave-neon-shorts")
      return "from-fuchsia-950/60 via-zinc-900 to-zinc-950 border-fuchsia-500/40";
    if (presetId === "ambient-fluid-mesh" || presetId === "ambient-mesh-shorts")
      return "from-indigo-950/50 via-zinc-900 to-zinc-950 border-indigo-500/30";
    if (presetId === "billboard-cinematic" || presetId === "glass-spectrum-shorts")
      return "from-slate-900/80 via-zinc-900 to-zinc-950 border-slate-600/30";
    if (presetId === "bass-thump-shorts")
      return "from-orange-950/50 via-zinc-900 to-zinc-950 border-orange-500/30";
    return "from-zinc-900 to-zinc-950 border-zinc-800";
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const activeEffectCount = effects.filter((e) => e.enabled).length;

  return (
    <div className="flex flex-col w-full bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Hidden live audio element connected to Web Audio analyzer */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* ============================================================ */}
      {/* 1. CLEAN STUDIO HEADER BAR (Zero Clutter, Clear Actions)     */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80 backdrop-blur-md">
        {/* Left: Format Switcher & Resolution */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-inner">
            <button
              onClick={() => onAspectRatioChange("16:9")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === "16:9"
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>16:9 Landscape</span>
            </button>
            <button
              onClick={() => onAspectRatioChange("9:16")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                aspectRatio === "9:16"
                  ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/25"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 Shorts</span>
            </button>
          </div>

          <span className="hidden sm:inline px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 font-semibold">
            {aspectRatio === "16:9" ? "1920 × 1080" : "1080 × 1920"}
          </span>
        </div>

        {/* Center: Active Style Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800/90 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-zinc-400">Active Style:</span>
          <span className="font-bold text-zinc-200">{activePresetTitle}</span>
        </div>

        {/* Right: Studio Utility Controls & Primary Export */}
        <div className="flex items-center gap-2">
          {/* Framerate Selector (30 FPS Fast / 60 FPS Ultra) */}
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs shadow-inner">
            <button
              onClick={() => setExportFps(30)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportFps === 30
                  ? "bg-amber-400 text-zinc-950 font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="30 FPS (Fast & High Quality, recommended for social media)"
            >
              30 FPS (Fast)
            </button>
            <button
              onClick={() => setExportFps(60)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                exportFps === 60
                  ? "bg-amber-400 text-zinc-950 font-extrabold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="60 FPS (Ultra Smooth)"
            >
              60 FPS
            </button>
          </div>

          {/* Safe-Zones Overlay Guide Toggle */}
          <button
            onClick={handleToggleGrid}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              showGridOverlay
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-sm shadow-cyan-500/10"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
            title="Toggle Safe-Zone Layout Guidelines"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Safe-Zones</span>
          </button>

          {/* Primary Render & Export Button */}
          <button
            onClick={handleExportMP4}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-extrabold text-xs shadow-lg shadow-amber-400/25 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting ? "Rendering..." : `Export ${exportFps}FPS MP4`}</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. MAIN STUDIO WORKSPACE (Center Stage + Right Inspector)   */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row w-full relative min-h-[640px]">
        {/* LEFT / CENTER: Live Canvas Viewport & Transport Hub */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-zinc-950 relative overflow-hidden">
          {/* Canvas Container with Transparency Checkerboard */}
          <div
            className={`relative flex items-center justify-center rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl transition-all duration-300 ${
              aspectRatio === "16:9"
                ? "w-full max-w-[840px] aspect-video"
                : "w-full max-w-[360px] aspect-[9/16]"
            }`}
            style={{
              backgroundImage: `
                linear-gradient(45deg, #121214 25%, transparent 25%),
                linear-gradient(-45deg, #121214 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #121214 75%),
                linear-gradient(-45deg, transparent 75%, #121214 75%)
              `,
              backgroundSize: "24px 24px",
              backgroundPosition: "0 0, 0 12px, 12px -12px, -12px 0px",
              backgroundColor: "#070709",
            }}
          >
            {/* The 60FPS Video Canvas */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain cursor-pointer"
              onClick={togglePlay}
            />

            {/* Center Play Icon Overlay When Paused */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                aria-label="Play canvas video"
                className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/15 transition-all cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-2xl shadow-amber-400/40 group-hover:scale-110 transition-all">
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </div>
              </button>
            )}

            {/* Minimal Blank Canvas Helper (Only visible if 0 layers active) */}
            {activeEffectCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono text-zinc-400 shadow-xl">
                  Blank Transparent Canvas • Select a Preset or Add FX
                </div>
              </div>
            )}
          </div>

          {/* Timeline & Scrubber Transport Bar */}
          <div className="w-full max-w-[840px] mt-5 flex items-center gap-3 px-3 py-2.5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl backdrop-blur-md shadow-xl">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-10 h-10 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center shadow-md shadow-amber-400/20 transition-all cursor-pointer shrink-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Replay Intro Opening Sequence */}
            <button
              onClick={handleReplayIntro}
              title="Replay Vinyl Sleeve Opening Animation"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300 hover:text-amber-400 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Intro</span>
            </button>

            {/* Current Timestamp */}
            <span className="text-xs font-mono text-zinc-300 w-12 text-right">
              {formatTime(currentTime)}
            </span>

            {/* Scrubber Seek Bar */}
            <input
              type="range"
              min={0}
              max={duration || 120}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />

            {/* Total Duration */}
            <span className="text-xs font-mono text-zinc-400 w-12">
              {formatTime(duration)}
            </span>

            {/* Audio Mute Toggle */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer shrink-0"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Notifications */}
          {exportSuccess && (
            <div className="w-full max-w-[840px] mt-3 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{exportSuccess}</span>
              </div>
              {onNavigateToDistribution && (
                <button
                  onClick={onNavigateToDistribution}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-md shadow-emerald-400/20"
                >
                  <span>Proceed to YouTube Release</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {exportError && (
            <div className="w-full max-w-[840px] mt-3 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
              {exportError}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* RIGHT: DEDICATED STUDIO INSPECTOR & GALLERY PANEL            */}
        {/* ============================================================ */}
        {showSidePanel && (
          <div className="w-full lg:w-[420px] xl:w-[440px] bg-zinc-900/95 border-t lg:border-t-0 lg:border-l border-zinc-800 flex flex-col max-h-[720px] lg:max-h-[780px] overflow-hidden">
            {/* Studio Navigation Tabs */}
            <div className="flex items-center p-2 bg-zinc-950/80 border-b border-zinc-800">
              <button
                onClick={() => setActiveTab("presets")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeTab === "presets"
                    ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Presets</span>
              </button>

              <button
                onClick={() => setActiveTab("effects")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "effects"
                    ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <SlidersVertical className="w-3.5 h-3.5" />
                <span>Layers ({activeEffectCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("alignment")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "alignment"
                    ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Variable Graphs</span>
              </button>
            </div>

            {/* ============================================================ */}
            {/* TAB 1: STREAMLINED PRESETS GALLERY                          */}
            {/* ============================================================ */}
            {activeTab === "presets" && (
              <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3">
                {/* 1-Row Cover Palette Quick Match */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-zinc-200">
                      Cover Palette
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {coverPalette ? (
                      coverPalette.palette.map((color, idx) => {
                        const isSelected = activeAccentColor.toLowerCase() === color.toLowerCase();
                        return (
                          <button
                            key={`${color}-${idx}`}
                            onClick={() => handleSelectAccentSwatch(color)}
                            title={`Set ${color} as scene accent`}
                            className={`w-5 h-5 rounded-full border transition-all cursor-pointer hover:scale-110 flex items-center justify-center ${
                              isSelected
                                ? "border-white ring-2 ring-amber-400/60 scale-110 shadow-sm"
                                : "border-black/50 hover:border-white/80"
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5 text-white drop-shadow" />}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-zinc-500">Syncing...</span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggleAutoColorMatch(!autoColorMatch)}
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition-all cursor-pointer ${
                      autoColorMatch
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {autoColorMatch ? "Auto" : "Manual"}
                  </button>
                </div>

                {/* Ratio Filter Header */}
                <div className="flex items-center justify-between px-1 text-[11px] font-bold text-zinc-400">
                  <span>
                    {aspectRatio === "16:9" ? "16:9 Landscape Presets" : "9:16 Shorts Presets"}
                  </span>
                  <button
                    onClick={() => setShowAllRatios(!showAllRatios)}
                    className="text-[10px] text-zinc-500 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {showAllRatios ? "Show Matching Ratio" : "Show All Ratios"}
                  </button>
                </div>

                {/* Tactile Preset Tiles */}
                <div className="flex flex-col gap-2">
                  {filteredPresets.map((preset) => {
                    const isActive = activePreset === preset.id;
                    const visualBorder = getPresetVisualClass(preset.id);
                    const PresetIcon = getPresetIcon(preset.id);
                    const subtag = getPresetSubtag(preset.id);

                    return (
                      <button
                        key={preset.id}
                        onClick={() => handlePresetSelect(preset)}
                        className={`w-full text-left p-2.5 rounded-xl border bg-gradient-to-r transition-all cursor-pointer flex items-center justify-between gap-3 group ${visualBorder} ${
                          isActive
                            ? "ring-2 ring-amber-400 border-amber-400 bg-amber-400/5 shadow-md shadow-amber-400/10"
                            : "hover:border-zinc-700 hover:bg-zinc-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                              isActive
                                ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/30"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 group-hover:text-amber-400 group-hover:border-zinc-700"
                            }`}
                          >
                            <PresetIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-xs font-bold truncate transition-colors ${
                                  isActive
                                    ? "text-amber-300"
                                    : "text-white group-hover:text-amber-200"
                                }`}
                              >
                                {preset.name}
                              </h4>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                  preset.aspectRatio === "16:9"
                                    ? "bg-amber-400/15 text-amber-400"
                                    : "bg-purple-400/15 text-purple-400"
                                }`}
                              >
                                {preset.aspectRatio}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {subtag}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center shrink-0">
                          {isActive ? (
                            <div className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: FX LAYERS STACK & CUSTOMIZER                          */}
            {/* ============================================================ */}
            {activeTab === "effects" && (
              <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3">
                {/* Layer Stack Quick Actions Bar */}
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-300">
                      Active Layers:
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-800 text-amber-400 font-bold">
                      {activeEffectCount} / {effects.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Turn off all effects for a transparent canvas"
                    >
                      Turn Off All
                    </button>
                    <button
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Turn on all effects"
                    >
                      Turn On All
                    </button>
                    <button
                      onClick={() => {
                        engineRef.current?.initDefaultPipeline();
                        setEffects([...(engineRef.current?.getEffects() || [])]);
                      }}
                      className="p-1 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-all cursor-pointer"
                      title="Reset Pipeline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category Filter Tabs (Spacious, tactile, wrapped & never squashed) */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 py-1">
                  {categories.map((cat) => {
                    const count = getCategoryCount(cat.id);
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none shrink-0 min-h-[32px] ${
                          isSelected
                            ? "bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-400/20"
                            : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:border-zinc-700 hover:bg-zinc-800"
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                            isSelected
                              ? "bg-zinc-950/20 text-zinc-950 font-extrabold"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Layer Cards List */}
                <div className="flex flex-col gap-2.5">
                  {filteredEffects.map((effect) => {
                    const isExpanded = expandedEffectId === effect.id;
                    const hasOptions = effect.schema && effect.schema.length > 0;

                    return (
                      <div
                        key={effect.id}
                        className={`rounded-xl border transition-all ${
                          effect.enabled
                            ? "bg-zinc-950/80 border-zinc-700/80 shadow-md"
                            : "bg-zinc-950/40 border-zinc-800/60 opacity-60"
                        }`}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3">
                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => handleToggleEffect(effect.id)}
                              className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                                effect.enabled ? "bg-amber-400" : "bg-zinc-800"
                              }`}
                            >
                              <div
                                className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                  effect.enabled ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {effect.name}
                                </span>
                                <span
                                  className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${getCategoryBadgeClass(
                                    effect.category
                                  )}`}
                                >
                                  {effect.category}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">
                                {effect.description}
                              </p>
                            </div>
                          </div>

                          {hasOptions && (
                            <button
                              onClick={() =>
                                setExpandedEffectId(isExpanded ? null : effect.id)
                              }
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isExpanded
                                  ? "bg-zinc-800 text-amber-400"
                                  : "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                              }`}
                              title="Configure Effect Parameters"
                            >
                              <Settings2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Expandable Knobs / Controls */}
                        {isExpanded && hasOptions && effect.schema && (
                          <div className="p-3 bg-zinc-900/60 border-t border-zinc-800/80 flex flex-col gap-3 rounded-b-xl">
                            {effect.schema.map((param) => {
                              const val =
                                effect.options[param.key] !== undefined
                                  ? effect.options[param.key]
                                  : param.default;

                              return (
                                <div
                                  key={param.key}
                                  className="flex flex-col gap-1 text-[11px]"
                                >
                                  <div className="flex items-center justify-between text-zinc-300">
                                    <label className="font-semibold text-zinc-300">
                                      {param.label}
                                    </label>
                                    <span className="font-mono text-[10px] text-amber-400 font-bold">
                                      {String(val)}
                                    </span>
                                  </div>

                                  {param.type === "number" && (
                                    <input
                                      type="range"
                                      min={param.min ?? 0}
                                      max={param.max ?? 100}
                                      step={param.step ?? 1}
                                      value={val}
                                      onChange={(e) =>
                                        handleUpdateOption(
                                          effect.id,
                                          param.key,
                                          parseFloat(e.target.value)
                                        )
                                      }
                                      className="h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                                    />
                                  )}

                                  {param.type === "boolean" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateOption(
                                          effect.id,
                                          param.key,
                                          !val
                                        )
                                      }
                                      className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                                        val ? "bg-amber-400" : "bg-zinc-800"
                                      }`}
                                    >
                                      <div
                                        className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                                          val ? "translate-x-5" : "translate-x-0"
                                        }`}
                                      />
                                    </button>
                                  )}

                                  {param.type === "color" && (
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="color"
                                        value={val}
                                        onChange={(e) =>
                                          handleUpdateOption(
                                            effect.id,
                                            param.key,
                                            e.target.value
                                          )
                                        }
                                        className="w-7 h-7 rounded border-none cursor-pointer bg-transparent"
                                      />
                                      <span className="font-mono text-[11px] text-zinc-400">
                                        {val}
                                      </span>
                                    </div>
                                  )}

                                  {param.type === "select" && param.options && (
                                    <select
                                      value={val}
                                      onChange={(e) =>
                                        handleUpdateOption(
                                          effect.id,
                                          param.key,
                                          e.target.value
                                        )
                                      }
                                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 cursor-pointer"
                                    >
                                      {param.options.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: GRID & AUDIO CALIBRATION ENGINE                       */}
            {/* ============================================================ */}
            {activeTab === "alignment" && (
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {/* 1. Live 20Hz - 20,000Hz Variable Spectrum Graph & Instrument Extractors */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        20Hz – 20kHz Acoustic Graph
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {audioMeters.isKick && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[9px] font-mono font-bold animate-pulse">
                          KICK
                        </span>
                      )}
                      {audioMeters.isSnare && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[9px] font-mono font-bold animate-pulse">
                          SNARE
                        </span>
                      )}
                      {audioMeters.isHihat && (
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-[9px] font-mono font-bold animate-pulse">
                          HI-HAT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real-time Logarithmic Spectrum Graph Canvas */}
                  <div className="w-full rounded-xl overflow-hidden border border-zinc-800/90 bg-zinc-950 relative shadow-inner">
                    <canvas
                      ref={spectrumCanvasRef}
                      width={380}
                      height={95}
                      className="w-full h-[95px] block"
                    />
                    <div className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded bg-zinc-900/80 border border-zinc-800 text-[8px] font-mono text-zinc-400">
                      LOGARITHMIC 20Hz - 20kHz
                    </div>
                  </div>

                  {/* Frequency Band Spectrum Labels */}
                  <div className="grid grid-cols-4 gap-1 text-[8px] font-mono text-center text-zinc-500">
                    <div className="px-1 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 font-bold">
                      SUB (20-60Hz)
                    </div>
                    <div className="px-1 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 font-bold">
                      BASS (60-250Hz)
                    </div>
                    <div className="px-1 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 font-bold">
                      VOCAL / MIDS
                    </div>
                    <div className="px-1 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-cyan-400 font-bold">
                      HATS / AIR
                    </div>
                  </div>

                  {/* 6 Specialized Element Extractors */}
                  <div className="flex flex-col gap-2.5 pt-1 font-mono text-[10px]">
                    {/* Sub-Bass */}
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                          <span>SUB-BASS (20–60Hz • 808 Rumble)</span>
                        </span>
                        <span className="text-amber-400 font-bold">
                          {Math.round(audioMeters.subBass * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioMeters.subBass * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Bass */}
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                          <span>BASS (60–250Hz • Low Warmth)</span>
                        </span>
                        <span className="text-yellow-400 font-bold">
                          {Math.round(audioMeters.bass * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-600 to-yellow-300 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioMeters.bass * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Drums / Kick */}
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                          <span>DRUMS / KICK (40–130Hz Transient)</span>
                        </span>
                        <span className="text-rose-400 font-bold">
                          {Math.round(audioMeters.drums * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioMeters.drums * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Snare & Claps */}
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                          <span>SNARE & CLAP (Snap & Crack)</span>
                        </span>
                        <span className="text-purple-400 font-bold">
                          {Math.round(audioMeters.snare * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioMeters.snare * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Vocal Melody */}
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                          <span>VOCAL MELODY (300–3.5kHz • Leads)</span>
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {Math.round(audioMeters.vocalMelody * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioMeters.vocalMelody * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Hi-Hats */}
                    <div>
                      <div className="flex justify-between text-zinc-300 mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                          <span>HI-HATS & CYMBALS (6–20kHz)</span>
                        </span>
                        <span className="text-cyan-400 font-bold">
                          {Math.round(audioMeters.hihats * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-600 to-cyan-300 transition-all duration-75"
                          style={{ width: `${Math.min(100, audioMeters.hihats * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Master Balance / Spectral Tilt */}
                    <div className="pt-2 border-t border-zinc-800/80">
                      <div className="flex justify-between text-zinc-400 mb-1">
                        <span>SPECTRAL TILT (Bass vs Treble)</span>
                        <span className="font-bold text-zinc-200">
                          {audioMeters.spectralTilt < -0.15
                            ? "Warm Bass Heavy"
                            : audioMeters.spectralTilt > 0.15
                            ? "Bright Treble"
                            : "Balanced"}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-amber-500 transition-all duration-75"
                          style={{
                            width: `${Math.max(0, Math.min(100, (1 - (audioMeters.spectralTilt + 1) / 2) * 100))}%`,
                          }}
                        />
                        <div
                          className="h-full bg-cyan-400 transition-all duration-75"
                          style={{
                            width: `${Math.max(0, Math.min(100, ((audioMeters.spectralTilt + 1) / 2) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Cover Art Color Matching Engine (ColorThief) */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        Cover Art Palette (ColorThief)
                      </h4>
                    </div>
                    <button
                      onClick={() => handleToggleAutoColorMatch(!autoColorMatch)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        autoColorMatch
                          ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20 font-extrabold"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {autoColorMatch ? "Auto-Match Active" : "Manual Color Mode"}
                    </button>
                  </div>

                  {coverPalette ? (
                    <div className="flex flex-col gap-2.5 pt-1">
                      {/* Visual swatch cards with roles */}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: "Dominant", color: coverPalette.dominant, desc: "Bars & Waves" },
                          { label: "Accent", color: coverPalette.accent, desc: "Halo & HUD" },
                          { label: "Secondary", color: coverPalette.secondary, desc: "Complement" },
                          { label: "Dark Tone", color: coverPalette.dark, desc: "Ambient Depth" },
                          { label: "Light Tint", color: coverPalette.light, desc: "Glow & Peaks" },
                        ].map((item, idx) => {
                          const isSelected = activeAccentColor.toLowerCase() === item.color.toLowerCase();
                          return (
                            <button
                              key={idx}
                              onClick={() => handleSelectAccentSwatch(item.color)}
                              className={`p-2 rounded-xl bg-zinc-900 border transition-all cursor-pointer flex flex-col items-center gap-1.5 text-center group ${
                                isSelected
                                  ? "border-amber-400 shadow-md shadow-amber-400/10 ring-1 ring-amber-400"
                                  : "border-zinc-800 hover:border-zinc-700"
                              }`}
                            >
                              <div
                                className="w-7 h-7 rounded-lg shadow-inner border border-white/20 flex items-center justify-center transition-transform group-hover:scale-105"
                                style={{ backgroundColor: item.color }}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                              </div>
                              <span className="text-[9px] font-bold text-zinc-200 truncate w-full">
                                {item.label}
                              </span>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase">
                                {item.color}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-900">
                        <span className="text-[10px] text-zinc-500">
                          Click any swatch to apply as active scene accent.
                        </span>
                        <button
                          onClick={handleApplyPalette}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-bold text-[10px] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Apply Full Palette</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500">
                      Loading cover art and computing palette...
                    </div>
                  )}
                </div>

                {/* 3. Grid & Safe-Zones Overview */}
                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
                        Canvas Safe-Zones Overlay
                      </h4>
                    </div>
                    <button
                      onClick={handleToggleGrid}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        showGridOverlay
                          ? "bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-500/20"
                          : "bg-zinc-800 text-zinc-300 hover:text-white"
                      }`}
                    >
                      {showGridOverlay ? "Overlay Active" : "Enable Overlay"}
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Overlays dynamic 16:9 / 9:16 quadrant boundaries, platform safe margins, and visualizer alignment docks directly on the canvas preview.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. GPU EXPORT PROGRESS MODAL OVERLAY                         */}
      {/* ============================================================ */}
      {isExporting && exportProgress && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mb-4 animate-pulse">
            <Zap className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-extrabold text-white tracking-tight mb-1">
            Rendering 1080p {exportFps}FPS Video
          </h3>
          <p className="text-xs text-zinc-400 max-w-sm mb-6">
            GPU-accelerated WebCodecs rendering in progress. Frames are encoded
            with full audio-reactive physics and modular effects.
          </p>

          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
              <span className="text-amber-400">
                {exportProgress.percent}% Complete
              </span>
              <span className="text-zinc-400">
                {exportProgress.frame} / {exportProgress.totalFrames} frames
              </span>
            </div>

            <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-150"
                style={{ width: `${exportProgress.percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-3 pt-3 border-t border-zinc-800/80">
              <span>Speed: {exportProgress.fps} FPS</span>
              <span>
                Est. Remaining: {exportProgress.estimatedRemainingSec}s
              </span>
            </div>
          </div>

          <button
            onClick={cancelExport}
            className="mt-6 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            Cancel Export
          </button>
        </div>
      )}
    </div>
  );
};
