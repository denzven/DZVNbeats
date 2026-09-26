export type AspectRatio = "16:9" | "9:16";

export type EffectCategory =
  | "background"
  | "hero"
  | "visualizer"
  | "particles"
  | "hud"
  | "post";

export interface BeatMetadata {
  id: string;
  title: string;
  filename: string;
  coverArt?: string;
  bpm?: number;
  key?: string;
  duration?: string;
  tags?: string[];
  beatType?: string;
}

export interface CalibratedBands {
  lows: number;          // 0.0 - 1.0 calibrated & auto-gain leveled bass (20Hz - 250Hz)
  mids: number;          // 0.0 - 1.0 calibrated & auto-gain leveled midrange (250Hz - 4kHz)
  highs: number;         // 0.0 - 1.0 calibrated & auto-gain leveled treble (4kHz - 20kHz)
  air: number;           // 0.0 - 1.0 ultra-high sparkle (10kHz - 20kHz)
  kickTransient: number; // 0.0 - 1.0 dynamic kick impact
  spectralTilt: number;  // -1.0 (bass-heavy) to +1.0 (bright/treble)
  subBass?: number;      // 0.0 - 1.0 calibrated sub-bass (20Hz - 60Hz)
  bass?: number;         // 0.0 - 1.0 calibrated bass (60Hz - 250Hz)
  drums?: number;        // 0.0 - 1.0 calibrated kick & drum punch
  snare?: number;        // 0.0 - 1.0 calibrated snare & clap snap
  vocalMelody?: number;  // 0.0 - 1.0 calibrated vocal & melodic lead
  hihats?: number;       // 0.0 - 1.0 calibrated hi-hats & cymbals
}

export interface AudioAnalysis {
  subBass: number;       // 0.0 - 1.0 (20Hz - 60Hz energy)
  bass: number;          // 0.0 - 1.0 (60Hz - 250Hz energy)
  mids: number;          // 0.0 - 1.0 (250Hz - 4kHz energy)
  highs: number;         // 0.0 - 1.0 (4kHz - 20kHz energy)
  drums: number;         // 0.0 - 1.0 (dynamic kick & drum punch)
  snare: number;         // 0.0 - 1.0 (snare & clap snap)
  vocalMelody: number;   // 0.0 - 1.0 (vocal & melodic lead line)
  hihats: number;        // 0.0 - 1.0 (hi-hats, shakers & cymbals)
  overallEnergy: number; // 0.0 - 1.0 RMS amplitude
  isKick: boolean;       // Instantaneous bass transient detected
  isSnare: boolean;      // Instantaneous snare transient detected
  isHihat: boolean;      // Instantaneous hi-hat transient detected
  frequencyData: Uint8Array; // Raw FFT bins (0 - 255)
  timeData: Uint8Array;      // Raw waveform oscillogram (0 - 255)
  calibrated: CalibratedBands; // Adaptive beat-to-beat calibrated bands
  adaptiveFft: Float32Array;   // Adaptive per-bin normalized spectrum (0.0 - 1.0 each)
}

export interface GridZone {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

export interface GridThirds {
  x1: number; // Left third line (W / 3)
  x2: number; // Right third line (2W / 3)
  y1: number; // Top third line (H / 3)
  y2: number; // Bottom third line (2H / 3)
  powerPoints: Array<{ x: number; y: number; label: string }>;
}

export interface GridSection {
  id: string;
  name: string;
  role: string;
  zone: GridZone;
  accentColor: string;
}

export interface CanvasGrid {
  aspectRatio: AspectRatio;
  width: number;
  height: number;
  thirds: GridThirds;     // Rule of Thirds coordinates & power intersection points
  sections: GridSection[]; // The 3 primary compositional divisions (tiers / columns)
  header: GridZone;       // Top branding/metadata zone
  heroStage: GridZone;    // Main central stage
  slotLeft: GridZone;     // Left stage slot (sleeve / secondary card)
  slotCenter: GridZone;   // Center stage slot (vinyl disc / thumping card)
  slotRight: GridZone;    // Right stage slot (tonearm / meters)
  dock: GridZone;         // Bottom visualizer & progress dock
  safeBounds: GridZone;   // Full safe zone (clears TikTok/Reels UI overlays in 9:16)
}

export interface FrameContext {
  width: number;
  height: number;
  time: number;          // Current timestamp in seconds
  duration: number;      // Total duration in seconds
  frame: number;         // Current frame index
  fps: number;           // Target FPS (default: 60)
  beat: BeatMetadata;    // Beat information
  audio: AudioAnalysis;  // Audio metrics for this specific frame
  aspectRatio: AspectRatio;
  coverImage: HTMLImageElement | null;
  grid: CanvasGrid;      // Layout safe-zones & slot coordinates
  introProgress: number; // 0.0 (closed/start) to 1.0 (fully opened/playing)
  activeEffects?: string[]; // IDs of all currently enabled effects in the pipeline
}

export interface EffectOptionSchema {
  key: string;
  label: string;
  type: "boolean" | "number" | "color" | "select";
  default: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
}

export interface VideoEffect {
  id: string;
  name: string;
  description: string;
  category: EffectCategory;
  enabled: boolean;
  order: number; // Render order / Z-Index layer
  slot?: "left" | "center" | "right" | "dock" | "full" | "auto";
  options: Record<string, any>;
  schema?: EffectOptionSchema[];

  init?(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): Promise<void> | void;
  render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void;
  destroy?(): void;
  clone?(): VideoEffect;
}

export interface VideoPreset {
  id: string;
  name: string;
  description: string;
  aspectRatio: AspectRatio;
  effects: {
    id: string;
    enabled: boolean;
    order?: number;
    options?: Record<string, any>;
  }[];
}
