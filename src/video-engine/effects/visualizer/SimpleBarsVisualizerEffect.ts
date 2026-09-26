import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class SimpleBarsVisualizerEffect implements VideoEffect {
  public id = "vis-simple-bars";
  public name = "Simple Equalizer Bars";
  public description = "Clean, minimalist audio spectrum rectangular bars with a single set of bars from 20Hz to 20kHz. Customizable side placement, length, height, and color.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 41;

  private smoothBars: number[] = [];

  public options = {
    side: "bottom" as "bottom" | "top" | "left" | "right",
    barCount: 48,
    maxHeight: 85,
    length: 0, // 0 = auto dock/edge span
    barWidth: 6,
    barGap: 4,
    roundedCaps: false,
    mirror: false,
    color: "#fbbf24",
    gradientTips: false,
    glow: false,
    yOffset: 0,
    routing: "full" as
      | "full"
      | "subBass"
      | "bass"
      | "drums"
      | "snare"
      | "vocalMelody"
      | "hihats",
  };

  public schema = [
    {
      key: "side",
      label: "Side Placement",
      type: "select" as const,
      default: "bottom",
      options: [
        { label: "Bottom Dock", value: "bottom" },
        { label: "Top Header", value: "top" },
        { label: "Left Edge (Vertical)", value: "left" },
        { label: "Right Edge (Vertical)", value: "right" },
      ],
    },
    {
      key: "barCount",
      label: "Number of Bars",
      type: "number" as const,
      default: 48,
      min: 16,
      max: 96,
      step: 4,
    },
    {
      key: "maxHeight",
      label: "Max Bar Height / Amplitude (px)",
      type: "number" as const,
      default: 85,
      min: 20,
      max: 250,
      step: 5,
    },
    {
      key: "length",
      label: "Custom Length (px, 0 = Auto)",
      type: "number" as const,
      default: 0,
      min: 0,
      max: 1920,
      step: 20,
    },
    {
      key: "barWidth",
      label: "Bar Width (px)",
      type: "number" as const,
      default: 6,
      min: 2,
      max: 20,
      step: 1,
    },
    {
      key: "barGap",
      label: "Bar Spacing (px)",
      type: "number" as const,
      default: 4,
      min: 1,
      max: 12,
      step: 1,
    },
    {
      key: "roundedCaps",
      label: "Rounded Caps",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "mirror",
      label: "Symmetric Center Mirror",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "gradientTips",
      label: "Luminous Gradient Tips",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "glow",
      label: "Luminescence Glow",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "color",
      label: "Bar Accent Color",
      type: "color" as const,
      default: "#fbbf24",
    },
    {
      key: "yOffset",
      label: "Position Shift (px)",
      type: "number" as const,
      default: 0,
      min: -200,
      max: 200,
      step: 5,
    },
    {
      key: "routing",
      label: "Instrument / Band Routing",
      type: "select" as const,
      default: "full",
      options: [
        { label: "Full Spectrum (20Hz - 20,000Hz)", value: "full" },
        { label: "Sub-Bass Only (20Hz - 60Hz)", value: "subBass" },
        { label: "Bass & 808s (60Hz - 250Hz)", value: "bass" },
        { label: "Kick & Drum Punch", value: "drums" },
        { label: "Snare & Clap Snaps", value: "snare" },
        { label: "Vocal Melody & Leads (300Hz - 3.5kHz)", value: "vocalMelody" },
        { label: "Hi-Hats & Cymbals (6kHz - 20kHz)", value: "hihats" },
      ],
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio } = frameCtx;
    const count = this.options.barCount;
    const freq = audio.frequencyData;
    const adaptiveFft = audio.adaptiveFft;

    // Initialize or resize smoothing buffers
    if (this.smoothBars.length !== count) {
      this.smoothBars = new Array(count).fill(0);
    }

    const side = this.options.side;
    const isVertical = side === "left" || side === "right";
    const barW = this.options.barWidth;
    const gap = this.options.barGap;
    const totalBarsSpan = count * barW + (count - 1) * gap;

    // Determine baseline and start coordinates
    let startCoord = 0;
    let baseline = 0;

    if (side === "bottom") {
      const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
      const dock = GridSystem.getDockGeometry(width, height, aspectRatio, isVinylActive);
      baseline = dock.cy + dock.height * 0.38 + this.options.yOffset;
      startCoord = this.options.length > 0 ? width / 2 - totalBarsSpan / 2 : dock.cx - totalBarsSpan / 2;
    } else if (side === "top") {
      baseline = 60 + this.options.yOffset;
      startCoord = width / 2 - totalBarsSpan / 2;
    } else if (side === "left") {
      baseline = 40 + this.options.yOffset;
      startCoord = height / 2 - totalBarsSpan / 2;
    } else {
      // right
      baseline = width - 40 + this.options.yOffset;
      startCoord = height / 2 - totalBarsSpan / 2;
    }

    ctx.save();

    if (this.options.glow) {
      ctx.shadowColor = this.options.color;
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    const half = count / 2;

    for (let i = 0; i < count; i++) {
      let rawVal = 0;

      if (this.options.routing === "subBass") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : (1 - (i / count) * 0.4);
        rawVal = (audio.calibrated?.subBass ?? audio.subBass ?? 0) * factor;
      } else if (this.options.routing === "bass") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : (1 - (i / count) * 0.4);
        rawVal = (audio.calibrated?.bass ?? audio.bass ?? 0) * factor;
      } else if (this.options.routing === "drums") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : (1 - (i / count) * 0.4);
        rawVal = (audio.calibrated?.drums ?? audio.drums ?? 0) * factor;
      } else if (this.options.routing === "snare") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : (0.7 + Math.sin((i / count) * Math.PI) * 0.3);
        rawVal = (audio.calibrated?.snare ?? audio.snare ?? 0) * factor;
      } else if (this.options.routing === "vocalMelody") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : (0.7 + Math.sin((i / count) * Math.PI) * 0.3);
        rawVal = (audio.calibrated?.vocalMelody ?? audio.vocalMelody ?? 0) * factor;
      } else if (this.options.routing === "hihats") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : (0.6 + (i / count) * 0.4);
        rawVal = (audio.calibrated?.hihats ?? audio.hihats ?? 0) * factor;
      } else {
        // True 20Hz - 20,000Hz continuous logarithmic spectrum
        const minHz = 20;
        const maxHz = 20000;
        const totalBins = freq.length * 2; // 2048 FFT

        if (this.options.mirror) {
          const distFromCenter = Math.abs(i - half + 0.5) / half;
          const hz = minHz * Math.pow(maxHz / minHz, distFromCenter);
          const binIdx = Math.min(freq.length - 1, Math.max(0, Math.round((hz / 44100) * totalBins)));
          rawVal = adaptiveFft && adaptiveFft[binIdx] !== undefined
            ? adaptiveFft[binIdx]
            : (freq[binIdx] || 0) / 255;
        } else {
          // Single continuous set of bars from 20Hz (bar 0) to 20,000Hz (last bar)
          const fracStart = count > 1 ? i / count : 0;
          const fracEnd = count > 1 ? (i + 1) / count : 1;
          const hzStart = minHz * Math.pow(maxHz / minHz, fracStart);
          const hzEnd = minHz * Math.pow(maxHz / minHz, fracEnd);
          const binStart = Math.max(0, Math.floor((hzStart / 44100) * totalBins));
          const binEnd = Math.min(freq.length - 1, Math.ceil((hzEnd / 44100) * totalBins));

          let peak = 0;
          for (let b = binStart; b <= binEnd; b++) {
            const v = adaptiveFft && adaptiveFft[b] !== undefined
              ? adaptiveFft[b]
              : (freq[b] || 0) / 255;
            if (v > peak) peak = v;
          }
          rawVal = peak;
        }
      }

      // Ballistic smoothing
      if (rawVal > this.smoothBars[i]) {
        this.smoothBars[i] = rawVal;
      } else {
        this.smoothBars[i] += (rawVal - this.smoothBars[i]) * 0.28;
      }

      const barAmplitude = Math.max(3, this.smoothBars[i] * this.options.maxHeight);
      
      // For vertical bars, anchor lowest frequencies (20Hz) at the bottom and high frequencies (20kHz) at top
      const pos = isVertical
        ? startCoord + (count - 1 - i) * (barW + gap)
        : startCoord + i * (barW + gap);

      let bx = 0;
      let by = 0;
      let bw = 0;
      let bh = 0;

      if (isVertical) {
        by = pos;
        bh = barW;
        bw = barAmplitude;
        bx = side === "left" ? baseline : baseline - bw;
      } else {
        bx = pos;
        bw = barW;
        bh = barAmplitude;
        by = side === "bottom" ? baseline - bh : baseline;
      }

      // Clean rectangles — no gradient or glow unless explicitly selected
      if (this.options.gradientTips) {
        let grad = ctx.createLinearGradient(
          bx,
          isVertical ? by : by + bh,
          isVertical ? bx + bw : bx,
          by
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
        grad.addColorStop(0.4, this.options.color);
        grad.addColorStop(1, "#ffffff");
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = this.options.color;
      }

      if (this.options.roundedCaps) {
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, Math.min(bw, bh) / 2);
        ctx.fill();
      } else {
        // Pure solid clean rectangle!
        ctx.fillRect(bx, by, bw, bh);
      }
    }

    ctx.restore();
  }

  public clone(): SimpleBarsVisualizerEffect {
    const c = new SimpleBarsVisualizerEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
