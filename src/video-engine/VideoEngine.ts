import {
  AspectRatio,
  AudioAnalysis,
  BeatMetadata,
  FrameContext,
  VideoEffect,
  VideoPreset,
} from "./types";
import { AudioAnalyzer } from "./AudioAnalyzer";
import { EffectRegistry } from "./EffectRegistry";
import { GridSystem } from "./GridSystem";
import { VIDEO_PRESETS } from "./presets";
import { ColorExtractor, ExtractedPalette } from "./ColorExtractor";

export interface VideoEngineOptions {
  canvas: HTMLCanvasElement;
  aspectRatio?: AspectRatio;
  beat: BeatMetadata;
  audioElement?: HTMLAudioElement;
  fps?: number;
}

export class VideoEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private aspectRatio: AspectRatio;
  private beat: BeatMetadata;
  private audioAnalyzer: AudioAnalyzer;
  private audioElement: HTMLAudioElement | null = null;
  private effects: VideoEffect[] = [];
  public showDebugGrid = false;

  private isPlaying = false;
  private currentTime = 0;
  private duration = 120; // fallback seconds
  private animFrameId: number | null = null;
  private lastTimestamp = 0;
  private coverImage: HTMLImageElement | null = null;
  private fps = 60;
  private frameCount = 0;

  // Listeners
  public onTimeUpdate?: (current: number, total: number) => void;
  public onPlayStateChange?: (isPlaying: boolean) => void;
  public onAudioAnalysis?: (analysis: AudioAnalysis) => void;

  // ColorThief-style cover art palette
  public extractedPalette: ExtractedPalette | null = null;
  public onPaletteExtracted?: (palette: ExtractedPalette) => void;
  public autoColorMatch = true;

  constructor(options: VideoEngineOptions) {
    this.canvas = options.canvas;
    const context = this.canvas.getContext("2d", { alpha: true });
    if (!context) {
      throw new Error("Unable to obtain 2D context from canvas");
    }
    this.ctx = context;

    this.aspectRatio = options.aspectRatio || "16:9";
    this.beat = options.beat;
    this.fps = options.fps || 60;
    this.audioAnalyzer = new AudioAnalyzer();

    if (options.audioElement) {
      this.setAudioElement(options.audioElement);
    }

    this.loadCoverImage();
    this.initDefaultPipeline();
    this.updateCanvasResolution();
  }

  public setAudioElement(el: HTMLAudioElement): void {
    this.audioElement = el;
    this.audioAnalyzer.attachAudioElement(el);

    if (el.duration && !isNaN(el.duration)) {
      this.duration = el.duration;
    }

    el.addEventListener("loadedmetadata", () => {
      if (el.duration && !isNaN(el.duration)) {
        this.duration = el.duration;
      }
    });

    el.addEventListener("play", () => {
      this.isPlaying = true;
      this.onPlayStateChange?.(true);
      this.startLoop();
    });

    el.addEventListener("pause", () => {
      this.isPlaying = false;
      this.onPlayStateChange?.(false);
      this.stopLoop();
      this.renderFrame();
    });

    el.addEventListener("timeupdate", () => {
      this.currentTime = el.currentTime;
      this.onTimeUpdate?.(this.currentTime, this.duration);
    });

    if (el.src) {
      this.preCalibrateTrack(el.src);
    }
  }

  private calibratedSrc: string | null = null;

  private async preCalibrateTrack(src: string): Promise<void> {
    if (this.calibratedSrc === src || !src) return;
    this.calibratedSrc = src;
    try {
      const res = await fetch(src);
      const ab = await res.arrayBuffer();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const buf = await ctx.decodeAudioData(ab);
      const data = buf.getChannelData(0);
      this.audioAnalyzer.calibrateTrackProfile(data);
      ctx.close();
    } catch {
      // Dynamic real-time AGC handles calibration if offline fetch is restricted
    }
  }

  public setAspectRatio(ratio: AspectRatio, shouldApplyPreset = false): void {
    if (this.aspectRatio !== ratio) {
      this.aspectRatio = ratio;
      this.updateCanvasResolution();
      if (shouldApplyPreset) {
        const nonBlank = VIDEO_PRESETS.find(
          (p) => p.aspectRatio === ratio && !p.id.startsWith("blank-")
        );
        if (nonBlank) {
          this.applyPreset(nonBlank);
        } else {
          this.effects = EffectRegistry.createDefaultPipeline(ratio);
        }
      }
      this.renderFrame();
    }
  }

  public getAspectRatio(): AspectRatio {
    return this.aspectRatio;
  }

  public updateCanvasResolution(): void {
    // Internal coordinate system
    if (this.aspectRatio === "16:9") {
      this.canvas.width = 1920;
      this.canvas.height = 1080;
    } else {
      this.canvas.width = 1080;
      this.canvas.height = 1920;
    }
  }

  public setBeat(beat: BeatMetadata): void {
    this.beat = beat;
    this.loadCoverImage();
    this.renderFrame();
  }

  private loadCoverImage(): void {
    const coverSrc = this.beat.coverArt;
    if (!coverSrc) {
      this.coverImage = null;
      this.extractedPalette = null;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = coverSrc;
    img.onload = () => {
      this.coverImage = img;
      const palette = ColorExtractor.extractFromImage(img);
      this.extractedPalette = palette;
      this.onPaletteExtracted?.(palette);
      if (this.autoColorMatch) {
        this.applyCoverPalette(palette);
      }
      this.renderFrame();
    };
    img.onerror = () => {
      // In case crossOrigin fails on some environments, load fallback image without crossOrigin
      const fallbackImg = new Image();
      fallbackImg.src = coverSrc;
      fallbackImg.onload = () => {
        this.coverImage = fallbackImg;
        this.renderFrame();
      };
      ColorExtractor.extract(coverSrc).then((pal) => {
        this.extractedPalette = pal;
        this.onPaletteExtracted?.(pal);
        if (this.autoColorMatch) {
          this.applyCoverPalette(pal);
        }
      });
    };
  }

  public initDefaultPipeline(): void {
    this.effects = EffectRegistry.createDefaultPipeline(this.aspectRatio);
  }

  public getEffects(): VideoEffect[] {
    return this.effects;
  }

  public setEffects(effects: VideoEffect[]): void {
    this.effects = effects.sort((a, b) => a.order - b.order);
    this.renderFrame();
  }

  public toggleEffect(id: string, enabled?: boolean): void {
    const effect = this.effects.find((e) => e.id === id);
    if (effect) {
      effect.enabled = enabled !== undefined ? enabled : !effect.enabled;

      // Background mutex: only one background active at a time
      if (effect.category === "background" && effect.enabled) {
        for (const other of this.effects) {
          if (other.id !== id && other.category === "background") {
            other.enabled = false;
          }
        }
      }

      if (id === "debug-grid-guides") {
        this.showDebugGrid = effect.enabled;
      }
      this.renderFrame();
    }
  }

  public deselectAllEffects(): void {
    for (const effect of this.effects) {
      effect.enabled = false;
    }
    this.showDebugGrid = false;
    this.renderFrame();
  }

  public selectAllEffects(): void {
    for (const effect of this.effects) {
      if (effect.id !== "debug-grid-guides") {
        effect.enabled = true;
      }
    }
    this.renderFrame();
  }

  public updateEffectOption(id: string, optionKey: string, value: any): void {
    const effect = this.effects.find((e) => e.id === id);
    if (effect) {
      effect.options[optionKey] = value;
      if (optionKey === "layer") {
        effect.order = value === "back" ? 18 : 60;
        this.effects.sort((a, b) => a.order - b.order);
      }
      this.renderFrame();
    }
  }

  public applyPreset(preset: VideoPreset): void {
    // Merge preset config with existing or newly instantiated effects
    const allEffects = EffectRegistry.getAllAvailable();

    const newStack = allEffects.map((eff) => {
      const match = preset.effects.find((p) => p.id === eff.id);
      if (match) {
        eff.enabled = match.enabled;
        if (match.options) {
          eff.options = { ...eff.options, ...match.options };
        }
      } else {
        eff.enabled = false;
      }
      return eff;
    });

    this.effects = newStack.sort((a, b) => a.order - b.order);

    // If auto color match is enabled and palette is extracted, apply harmonious colors to styled presets
    if (this.autoColorMatch && this.extractedPalette && !preset.id.startsWith("blank-")) {
      this.applyCoverPalette(this.extractedPalette);
    } else {
      this.renderFrame();
    }
  }

  public play(): void {
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    } else {
      this.isPlaying = true;
      this.startLoop();
      this.onPlayStateChange?.(true);
    }
  }

  public pause(): void {
    if (this.audioElement) {
      this.audioElement.pause();
    } else {
      this.isPlaying = false;
      this.stopLoop();
      this.onPlayStateChange?.(false);
    }
  }

  public seek(seconds: number): void {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    if (this.audioElement) {
      this.audioElement.currentTime = this.currentTime;
    }
    this.renderFrame();
  }

  private startLoop(): void {
    if (this.animFrameId) return;
    this.lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;

      if (!this.audioElement && this.isPlaying) {
        this.currentTime += dt;
        if (this.currentTime >= this.duration) {
          this.currentTime = 0;
        }
        this.onTimeUpdate?.(this.currentTime, this.duration);
      }

      this.renderFrame();
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private stopLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Render a single frame with all active effects
   */
  public renderFrame(targetTime?: number, targetAudio?: AudioAnalysis): void {
    const t = targetTime !== undefined ? targetTime : this.currentTime;
    const audio = targetAudio || this.audioAnalyzer.getAnalysis(t);
    const grid = GridSystem.computeGrid(
      this.canvas.width,
      this.canvas.height,
      this.aspectRatio
    );
    const introProgress = Math.min(1.0, Math.max(0.0, t / 2.8));

    const frameCtx: FrameContext = {
      width: this.canvas.width,
      height: this.canvas.height,
      time: t,
      duration: this.duration,
      frame: this.frameCount++,
      fps: this.fps,
      beat: this.beat,
      audio,
      aspectRatio: this.aspectRatio,
      coverImage: this.coverImage,
      grid,
      introProgress,
      activeEffects: this.effects.filter((e) => e.enabled).map((e) => e.id),
    };

    // 1. Clear frame to a pristine blank transparent screen
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 2. Render sorted active effects (depth order)
    for (const effect of this.effects) {
      if (effect.enabled) {
        try {
          effect.render(this.ctx, frameCtx);
        } catch (err) {
          console.error(`Error rendering effect '${effect.id}':`, err);
        }
      }
    }

    // 3. Fallback debug grid if active and not already rendered by GridGuidelinesEffect
    const hasGridEffect = this.effects.some((e) => e.id === "debug-grid-guides" && e.enabled);
    if (this.showDebugGrid && !hasGridEffect) {
      GridSystem.drawDebugGrid(this.ctx, grid);
    }

    // 4. Dispatch live audio analysis to listeners (UI meters, variable graphs)
    this.onAudioAnalysis?.(audio);
  }

  public getAudioAnalysis(): AudioAnalysis {
    return this.audioAnalyzer.getAnalysis(this.currentTime);
  }

  public toggleDebugGrid(show?: boolean): void {
    const guideEffect = this.effects.find((e) => e.id === "debug-grid-guides");
    const nextState =
      show !== undefined ? show : !(guideEffect ? guideEffect.enabled : this.showDebugGrid);
    this.showDebugGrid = nextState;
    if (guideEffect) {
      guideEffect.enabled = nextState;
    }
    this.renderFrame();
  }

  public replayIntro(): void {
    this.seek(0);
    this.play();
  }

  public getAudioAnalyzer(): AudioAnalyzer {
    return this.audioAnalyzer;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getCoverImage(): HTMLImageElement | null {
    return this.coverImage;
  }

  public getPalette(): ExtractedPalette | null {
    return this.extractedPalette;
  }

  public setAutoColorMatch(enabled: boolean): void {
    this.autoColorMatch = enabled;
    if (enabled && this.extractedPalette) {
      this.applyCoverPalette(this.extractedPalette);
    }
  }

  /**
   * Apply extracted ColorThief palette across visualizers, aura, HUD, and particles
   */
  public applyCoverPalette(paletteInput?: ExtractedPalette): void {
    const palette = paletteInput || this.extractedPalette;
    if (!palette) return;

    for (const eff of this.effects) {
      if (eff.id === "vis-radial-halo") {
        eff.options.colorStart = palette.accent;
        eff.options.colorEnd = palette.secondary || palette.dominant;
      } else if (eff.id === "vis-fluid-wave") {
        eff.options.strokeColor = palette.accent;
      } else if (eff.id === "vis-spectrum-bars") {
        eff.options.color = palette.dominant;
      } else if (eff.id === "vis-adaptive-triband") {
        eff.options.lowColor = palette.dominant;
        eff.options.midColor = palette.accent;
        eff.options.highColor = palette.secondary || palette.light;
      } else if (eff.id === "hud-track-info") {
        eff.options.accentColor = palette.accent;
      } else if (eff.id === "part-sparks-fore") {
        eff.options.emberColor = palette.accent;
      } else if (eff.id === "part-bokeh-back") {
        eff.options.emberColor = palette.secondary || palette.accent;
      }
    }

    this.renderFrame();
  }

  /**
   * Apply a specific hex color as the primary accent across visualizer and HUD elements
   */
  public applyAccentColor(accentHex: string): void {
    for (const eff of this.effects) {
      if (eff.id === "vis-radial-halo") {
        eff.options.colorStart = accentHex;
      } else if (eff.id === "vis-fluid-wave") {
        eff.options.strokeColor = accentHex;
      } else if (eff.id === "vis-spectrum-bars") {
        eff.options.color = accentHex;
      } else if (eff.id === "vis-adaptive-triband") {
        eff.options.midColor = accentHex;
      } else if (eff.id === "hud-track-info") {
        eff.options.accentColor = accentHex;
      } else if (eff.id === "part-sparks-fore" || eff.id === "part-bokeh-back") {
        eff.options.emberColor = accentHex;
      }
    }

    this.renderFrame();
  }

  public destroy(): void {
    this.stopLoop();
    this.audioAnalyzer.destroy();
  }
}
