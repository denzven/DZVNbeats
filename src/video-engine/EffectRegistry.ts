import { AspectRatio, EffectCategory, VideoEffect } from "./types";
import { BlurredCoverEffect } from "./effects/background/BlurredCoverEffect";
import { MeshGradientEffect } from "./effects/background/MeshGradientEffect";
import { RadialSpotlightEffect } from "./effects/background/RadialSpotlightEffect";
import { CyberGridBackgroundEffect } from "./effects/background/CyberGridBackgroundEffect";
import { VinylRecordEffect } from "./effects/hero/VinylRecordEffect";
import { CassetteTapeEffect } from "./effects/hero/CassetteTapeEffect";
import { ThumpingArtworkEffect } from "./effects/hero/ThumpingArtworkEffect";
import { SoloVinylEffect } from "./effects/hero/SoloVinylEffect";
import { CoverArtCardEffect } from "./effects/hero/CoverArtCardEffect";
import { SimpleMaxCoverEffect } from "./effects/hero/SimpleMaxCoverEffect";
import { CircularDonutEffect } from "./effects/visualizer/CircularDonutEffect";
import { SpectrumBarsEffect } from "./effects/visualizer/SpectrumBarsEffect";
import { SimpleBarsVisualizerEffect } from "./effects/visualizer/SimpleBarsVisualizerEffect";
import { SideBarsVisualizerEffect } from "./effects/visualizer/SideBarsVisualizerEffect";
import { ShockwaveRingsEffect } from "./effects/visualizer/ShockwaveRingsEffect";
import { FluidWaveEffect } from "./effects/visualizer/FluidWaveEffect";
import { AdaptiveVisualizerEffect } from "./effects/visualizer/AdaptiveVisualizerEffect";
import { LedVuMeterEffect } from "./effects/visualizer/LedVuMeterEffect";
import { PhosphorOscilloscopeEffect } from "./effects/visualizer/PhosphorOscilloscopeEffect";
import { DustAndEmbersEffect } from "./effects/particles/DustAndEmbersEffect";
import { FireEmbersEffect } from "./effects/particles/FireEmbersEffect";
import { TrackInfoEffect } from "./effects/hud/TrackInfoEffect";
import { VignetteAndGrainEffect } from "./effects/post/VignetteAndGrainEffect";
import { RgbGlitchEffect } from "./effects/post/RgbGlitchEffect";
import { ExposurePulseEffect } from "./effects/post/ExposurePulseEffect";
import { GridGuidelinesEffect } from "./effects/hud/GridGuidelinesEffect";

type EffectFactory = () => VideoEffect;

export class EffectRegistry {
  private static factories: Map<string, EffectFactory> = new Map();

  /**
   * Register a new effect factory or class.
   * Allows plugins or future modules to easily add new effects!
   */
  public static register(factory: EffectFactory): void {
    const sample = factory();
    this.factories.set(sample.id, factory);
  }

  /**
   * Get an instantiated effect by ID
   */
  public static create(id: string): VideoEffect | null {
    const factory = this.factories.get(id);
    return factory ? factory() : null;
  }

  /**
   * Get sample instances of all registered effects (useful for UI lists & effect libraries)
   */
  public static getAllAvailable(): VideoEffect[] {
    return Array.from(this.factories.values()).map((f) => f());
  }

  /**
   * Get available effects filtered by distinct category:
   * background | hero | visualizer | particles | hud | post
   */
  public static getByCategory(category: EffectCategory): VideoEffect[] {
    return this.getAllAvailable().filter((e) => e.category === category);
  }

  /**
   * Build the recommended default effect pipeline for an aspect ratio
   */
  public static createDefaultPipeline(aspectRatio: AspectRatio): VideoEffect[] {
    const all = this.getAllAvailable();

    // IDs that are off by default in all pipelines
    const ALWAYS_OFF = new Set([
      "bg-mesh-gradient",
      "bg-radial-spotlight",
      "bg-cyber-grid",
      "hero-cassette-deck",
      "hero-solo-vinyl",
      "hero-cover-art-shadow",
      "hero-simple-max-cover",
      "vis-circular-donut",
      "vis-fluid-wave",
      "vis-adaptive-triband",
      "vis-led-vu-meter",
      "vis-neon-oscilloscope",
      "vis-simple-bars",
      "vis-side-bars",
      "vis-shockwave-rings",
      "part-fire-embers",
      "post-rgb-glitch",
      "post-exposure-pulse",
      "debug-grid-guides",
    ]);

    if (aspectRatio === "16:9") {
      // Landscape "Vinyl Record Lounge" default stack
      return all
        .map((effect) => {
          if (
            ALWAYS_OFF.has(effect.id) ||
            effect.id === "hero-thumping-art"
          ) {
            effect.enabled = false;
          } else {
            effect.enabled = true;
          }
          return effect;
        })
        .sort((a, b) => a.order - b.order);
    } else {
      // Vertical (9:16) "Bass Thump & Energy Shorts" default stack
      return all
        .map((effect) => {
          if (
            ALWAYS_OFF.has(effect.id) ||
            effect.id === "hero-vinyl-deck"
          ) {
            effect.enabled = false;
          } else {
            effect.enabled = true;
          }
          return effect;
        })
        .sort((a, b) => a.order - b.order);
    }
  }

  /**
   * Helper method to dynamically register a custom effect from a definition
   */
  public static addCustomEffect(effectDef: {
    id: string;
    name: string;
    description: string;
    category: EffectCategory;
    order?: number;
    options?: Record<string, any>;
    render: (ctx: CanvasRenderingContext2D, frameCtx: any) => void;
  }): void {
    const factory: EffectFactory = () => ({
      id: effectDef.id,
      name: effectDef.name,
      description: effectDef.description,
      category: effectDef.category,
      enabled: true,
      order: effectDef.order ?? 55,
      options: effectDef.options ?? {},
      render: effectDef.render,
      clone() {
        return factory();
      },
    });
    this.register(factory);
  }
}

// --------------------------------------------------------------------------
// Register Built-in Modular Effect Library in 6 Distinct Categories:
// --------------------------------------------------------------------------

// 1. BACKGROUND (Fills the scene background — only one active at a time)
EffectRegistry.register(() => new BlurredCoverEffect());          // bg-blurred-cover
EffectRegistry.register(() => new MeshGradientEffect());          // bg-mesh-gradient
EffectRegistry.register(() => new RadialSpotlightEffect());       // bg-radial-spotlight
EffectRegistry.register(() => new CyberGridBackgroundEffect());   // bg-cyber-grid

// 2. HERO (Primary focal centerpieces — mix & match supported)
EffectRegistry.register(() => new VinylRecordEffect());           // hero-vinyl-deck
EffectRegistry.register(() => new SoloVinylEffect());             // hero-solo-vinyl
EffectRegistry.register(() => new CoverArtCardEffect());          // hero-cover-art-shadow
EffectRegistry.register(() => new SimpleMaxCoverEffect());        // hero-simple-max-cover
EffectRegistry.register(() => new CassetteTapeEffect());          // hero-cassette-deck
EffectRegistry.register(() => new ThumpingArtworkEffect());       // hero-thumping-art

// 3. VISUALIZER (Reacts dynamically to the music — all stackable)
EffectRegistry.register(() => new SpectrumBarsEffect());          // 40: Glassmorphic Dock Bars
EffectRegistry.register(() => new SimpleBarsVisualizerEffect());  // 41: Clean Simple Bars
EffectRegistry.register(() => new SideBarsVisualizerEffect());    // 41: Side Spectrum Bars
EffectRegistry.register(() => new ShockwaveRingsEffect());        // 39: Bass Shockwave Rings
EffectRegistry.register(() => new FluidWaveEffect());             // 42: Fluid Waveform Ribbon
EffectRegistry.register(() => new CircularDonutEffect());         // 44: Circular Donut Spectrograph
EffectRegistry.register(() => new AdaptiveVisualizerEffect());    // 45: Calibrated Tri-Band EQ
EffectRegistry.register(() => new LedVuMeterEffect());            // 46: Console LED VU Meter
EffectRegistry.register(() => new PhosphorOscilloscopeEffect());  // 47: Phosphor CRT Oscilloscope

// 4. PARTICLES (Depth layer 'back' | 'front' option per instance)
EffectRegistry.register(() => new DustAndEmbersEffect("back"));   // Floating Dust & Bokeh
EffectRegistry.register(() => new DustAndEmbersEffect("front"));  // Foreground Sparks
EffectRegistry.register(() => new FireEmbersEffect());            // Rising Fire Embers

// 5. HUD (Metadata, badges, typography & layout arrangements)
EffectRegistry.register(() => new TrackInfoEffect());             // 70: Modular Typography HUD
EffectRegistry.register(() => new GridGuidelinesEffect());        // 95: Alignment Guidelines

// 6. POST (Cinematic post-processing)
EffectRegistry.register(() => new VignetteAndGrainEffect());      // 90: Vignette & Film Grain
EffectRegistry.register(() => new RgbGlitchEffect());             // 92: RGB Chromatic Glitch
EffectRegistry.register(() => new ExposurePulseEffect());          // 91: Beat Exposure Flash
