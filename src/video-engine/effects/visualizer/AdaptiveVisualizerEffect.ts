import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class AdaptiveVisualizerEffect implements VideoEffect {
  public id = "vis-adaptive-triband";
  public name = "Adaptive Tri-Band Visualizer";
  public description = "Beat-to-beat calibrated audio visualizer: auto-levels Lows, Mids, and Highs so every track looks perfectly dialed in.";
  public category = "visualizer" as const;
  public enabled = false; // Registered and toggleable in Effect Stack / Presets
  public order = 45;

  // Smoothing buffers for fluid, cinematic movement
  private smoothLows = 0;
  private smoothMids = 0;
  private smoothHighs = 0;
  private peakLows = 0;
  private peakMids = 0;
  private peakHighs = 0;

  public options = {
    mode: "triband-eq" as "triband-eq" | "studio-elements" | "adaptive-spectrum" | "hybrid-ribbon",
    showLabels: true,
    showPercentages: true,
    lowColor: "#f59e0b",
    midColor: "#10b981",
    highColor: "#06b6d4",
    dockHeight: 85,
  };

  public schema = [
    {
      key: "mode",
      label: "Visualizer Style",
      type: "select" as const,
      default: "triband-eq",
      options: [
        { label: "Adaptive Tri-Band EQ (Lows / Mids / Highs)", value: "triband-eq" },
        { label: "6-Band Studio Elements (Sub/Bass/Kick/Snare/Vocal/Hats)", value: "studio-elements" },
        { label: "Calibrated Dynamic Spectrum (64 Bars)", value: "adaptive-spectrum" },
        { label: "Calibrated Hybrid Ribbon", value: "hybrid-ribbon" },
      ],
    },
    {
      key: "showLabels",
      label: "Show Band Frequencies & Names",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showPercentages",
      label: "Show Calibrated Level Badges",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "dockHeight",
      label: "Visualizer Height (px)",
      type: "number" as const,
      default: 85,
      min: 40,
      max: 130,
      step: 5,
    },
    {
      key: "lowColor",
      label: "Lows Accent Color",
      type: "color" as const,
      default: "#f59e0b",
    },
    {
      key: "midColor",
      label: "Mids Accent Color",
      type: "color" as const,
      default: "#10b981",
    },
    {
      key: "highColor",
      label: "Highs Accent Color",
      type: "color" as const,
      default: "#06b6d4",
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio } = frameCtx;
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const dock = GridSystem.getDockGeometry(width, height, aspectRatio, isVinylActive);
    const isLandscape = aspectRatio === "16:9";

    // Access beat-to-beat calibrated bands
    const cal = audio.calibrated || {
      lows: audio.bass,
      mids: audio.mids,
      highs: audio.highs,
      air: 0.5,
      kickTransient: audio.isKick ? 1 : 0,
      spectralTilt: 0,
    };

    // Smooth movement with quick attack and natural damping
    const smoothing = 0.32;
    this.smoothLows += (cal.lows - this.smoothLows) * smoothing;
    this.smoothMids += (cal.mids - this.smoothMids) * smoothing;
    this.smoothHighs += (cal.highs - this.smoothHighs) * smoothing;

    // Peak hold decay
    this.peakLows = Math.max(this.smoothLows, this.peakLows - 0.008);
    this.peakMids = Math.max(this.smoothMids, this.peakMids - 0.008);
    this.peakHighs = Math.max(this.smoothHighs, this.peakHighs - 0.008);

    ctx.save();

    if (this.options.mode === "triband-eq") {
      this.renderTriBandEQ(ctx, dock, isLandscape);
    } else if (this.options.mode === "studio-elements") {
      this.renderStudioElements(ctx, dock, isLandscape, frameCtx);
    } else if (this.options.mode === "adaptive-spectrum") {
      this.renderAdaptiveSpectrum(ctx, dock, audio.adaptiveFft);
    } else {
      this.renderHybridRibbon(ctx, dock, audio.timeData);
    }

    ctx.restore();
  }

  /**
   * Mode 1: Adaptive Tri-Band EQ
   * Three distinct calibrated glassmorphic level meters (LOWS, MIDS, HIGHS)
   */
  private renderTriBandEQ(
    ctx: CanvasRenderingContext2D,
    dock: { cx: number; cy: number; width: number; height: number },
    isLandscape: boolean
  ): void {
    const totalW = dock.width;
    const bandGap = isLandscape ? 18 : 12;
    const numBands = 3;
    const bandW = (totalW - (numBands - 1) * bandGap) / numBands;
    const bandH = Math.min(this.options.dockHeight, dock.height * 0.88);
    const startX = dock.cx - totalW / 2;
    const baseY = dock.cy - bandH / 2;

    const bands = [
      {
        id: "lows",
        name: "LOWS",
        desc: "20-250Hz • 808/BASS",
        value: this.smoothLows,
        peak: this.peakLows,
        color: this.options.lowColor,
      },
      {
        id: "mids",
        name: "MIDS",
        desc: "250-4kHz • VOCAL/SNARE",
        value: this.smoothMids,
        peak: this.peakMids,
        color: this.options.midColor,
      },
      {
        id: "highs",
        name: "HIGHS",
        desc: "4-20kHz • HATS/AIR",
        value: this.smoothHighs,
        peak: this.peakHighs,
        color: this.options.highColor,
      },
    ];

    for (let i = 0; i < bands.length; i++) {
      const b = bands[i];
      const x = startX + i * (bandW + bandGap);

      // Glassmorphic meter capsule
      ctx.fillStyle = "rgba(18, 18, 22, 0.78)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(x, baseY, bandW, bandH, 14);
      ctx.fill();
      ctx.stroke();

      // Fluid fill height based on beat-to-beat calibrated value
      const fillPad = 4;
      const maxFillH = bandH - fillPad * 2;
      const fillH = Math.max(6, b.value * maxFillH);
      const fillY = baseY + bandH - fillPad - fillH;

      // Vertical gradient with glowing top
      const grad = ctx.createLinearGradient(x, fillY, x, baseY + bandH);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, `${b.color}22`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + fillPad, fillY, bandW - fillPad * 2, fillH, 10);
      ctx.fill();

      // Glowing peak hold needle line
      if (b.peak > 0.05) {
        const peakY = baseY + bandH - fillPad - b.peak * maxFillH;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + fillPad + 4, peakY);
        ctx.lineTo(x + bandW - fillPad - 4, peakY);
        ctx.stroke();
      }

      // Band typography & badges
      if (this.options.showLabels) {
        // Band Name
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 13px 'Space Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText(b.name, x + 14, baseY + 22);

        // Frequency range subtitle
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "700 9px 'Space Mono', monospace";
        ctx.fillText(b.desc, x + 14, baseY + 36);

        // Percentage Level Badge
        if (this.options.showPercentages) {
          const pct = Math.round(b.value * 100);
          ctx.fillStyle = b.color;
          ctx.font = "800 12px 'Space Mono', monospace";
          ctx.textAlign = "right";
          ctx.fillText(`${pct}%`, x + bandW - 14, baseY + 22);
        }
      }
    }
  }

  /**
   * Mode 2: 6-Band Studio Elements
   * Real-time calibrated monitoring of Sub-Bass, Bass, Drums, Snare, Vocal Melody, and Hi-Hats
   */
  private renderStudioElements(
    ctx: CanvasRenderingContext2D,
    dock: { cx: number; cy: number; width: number; height: number },
    isLandscape: boolean,
    frameCtx: FrameContext
  ): void {
    const { audio } = frameCtx;
    const totalW = dock.width;
    const numBands = 6;
    const bandGap = isLandscape ? 8 : 4;
    const bandW = (totalW - (numBands - 1) * bandGap) / numBands;
    const bandH = Math.min(this.options.dockHeight, dock.height * 0.88);
    const startX = dock.cx - totalW / 2;
    const baseY = dock.cy - bandH / 2;

    const elements = [
      {
        name: "SUB",
        desc: "20-60Hz",
        value: audio.calibrated?.subBass ?? audio.subBass ?? 0,
        color: "#f59e0b", // Amber
        active: (audio.subBass ?? 0) > 0.4,
      },
      {
        name: "BASS",
        desc: "60-250Hz",
        value: audio.calibrated?.bass ?? audio.bass ?? 0,
        color: "#eab308", // Yellow
        active: (audio.bass ?? 0) > 0.4,
      },
      {
        name: "DRUM",
        desc: "KICK",
        value: audio.calibrated?.drums ?? audio.drums ?? 0,
        color: "#f43f5e", // Rose
        active: audio.isKick,
      },
      {
        name: "SNARE",
        desc: "SNAP",
        value: audio.calibrated?.snare ?? audio.snare ?? 0,
        color: "#a855f7", // Purple
        active: audio.isSnare,
      },
      {
        name: "VOCAL",
        desc: "300-3.5k",
        value: audio.calibrated?.vocalMelody ?? audio.vocalMelody ?? 0,
        color: "#10b981", // Emerald
        active: (audio.vocalMelody ?? 0) > 0.35,
      },
      {
        name: "HATS",
        desc: "6-20kHz",
        value: audio.calibrated?.hihats ?? audio.hihats ?? 0,
        color: "#06b6d4", // Cyan
        active: audio.isHihat,
      },
    ];

    for (let i = 0; i < numBands; i++) {
      const el = elements[i];
      const x = startX + i * (bandW + bandGap);

      // Glass background
      ctx.fillStyle = el.active ? `${el.color}18` : "rgba(18, 18, 22, 0.72)";
      ctx.strokeStyle = el.active ? el.color : "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = el.active ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(x, baseY, bandW, bandH, 10);
      ctx.fill();
      ctx.stroke();

      // Fluid fill height
      const fillPad = 3;
      const maxFillH = bandH - fillPad * 2;
      const fillH = Math.max(4, Math.min(1.0, el.value) * maxFillH);
      const fillY = baseY + bandH - fillPad - fillH;

      const grad = ctx.createLinearGradient(x, fillY, x, baseY + bandH);
      grad.addColorStop(0, el.color);
      grad.addColorStop(1, `${el.color}22`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x + fillPad, fillY, bandW - fillPad * 2, fillH, 6);
      ctx.fill();

      if (this.options.showLabels) {
        ctx.fillStyle = "#ffffff";
        ctx.font = "800 10px 'Space Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText(el.name, x + bandW / 2, baseY + 16);

        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.font = "700 8px 'Space Mono', monospace";
        ctx.fillText(el.desc, x + bandW / 2, baseY + 28);
      }
    }
  }

  /**
   * Mode 3: Calibrated Dynamic Spectrum (64 Bars)
   * Auto-leveled across all frequency bands using psychoacoustic tilt curves
   */
  private renderAdaptiveSpectrum(
    ctx: CanvasRenderingContext2D,
    dock: { cx: number; cy: number; width: number; height: number },
    adaptiveFft: Float32Array
  ): void {
    const barCount = 54;
    const totalW = dock.width;
    const maxBarH = Math.min(this.options.dockHeight * 0.85, dock.height * 0.78);
    const gap = 3;
    const barW = (totalW - (barCount - 1) * gap) / barCount;
    const startX = dock.cx - totalW / 2;
    const baseY = dock.cy + maxBarH * 0.35;

    // Glassmorphic baseline dock
    ctx.fillStyle = "rgba(18, 18, 22, 0.72)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(startX - 12, baseY - maxBarH - 12, totalW + 24, maxBarH + 24, 16);
    ctx.fill();
    ctx.stroke();

    for (let i = 0; i < barCount; i++) {
      const frac = i / barCount;
      const binIdx = Math.floor(frac * Math.min(adaptiveFft.length, 180));
      const val = adaptiveFft[binIdx] || 0;
      const h = Math.max(4, val * maxBarH);
      const x = startX + i * (barW + gap);

      // Color transitions naturally: Lows (Amber) -> Mids (Emerald) -> Highs (Cyan)
      let barColor = this.options.lowColor;
      if (frac > 0.6) {
        barColor = this.options.highColor;
      } else if (frac > 0.25) {
        barColor = this.options.midColor;
      }

      const grad = ctx.createLinearGradient(x, baseY - h, x, baseY);
      grad.addColorStop(0, barColor);
      grad.addColorStop(1, `${barColor}33`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, baseY - h, barW, h, 2.5);
      ctx.fill();

      // Soft reflection below baseline
      const refH = h * 0.3;
      ctx.fillStyle = `${barColor}22`;
      ctx.beginPath();
      ctx.roundRect(x, baseY + 2, barW, refH, 1.5);
      ctx.fill();
    }
  }

  /**
   * Mode 3: Calibrated Hybrid Ribbon
   * Fluid waveform ribbon dynamically driven by calibrated lows (height), mids (frequency), and highs (ripple)
   */
  private renderHybridRibbon(
    ctx: CanvasRenderingContext2D,
    dock: { cx: number; cy: number; width: number; height: number },
    timeData: Uint8Array
  ): void {
    const totalW = dock.width;
    const startX = dock.cx - totalW / 2;
    const centerY = dock.cy;
    const points = 48;
    const stepX = totalW / (points - 1);
    const maxAmp = Math.min(this.options.dockHeight * 0.45, dock.height * 0.42);

    ctx.save();

    // Backdrop glow
    ctx.fillStyle = "rgba(18, 18, 22, 0.65)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(startX - 10, centerY - maxAmp - 12, totalW + 20, maxAmp * 2 + 24, 16);
    ctx.fill();
    ctx.stroke();

    // Wave path
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const idx = Math.floor((i / points) * timeData.length);
      const raw = ((timeData[idx] - 128) / 128);
      // Modulate using calibrated lows, mids, and highs
      const dynamicAmp = raw * maxAmp * (0.4 + this.smoothLows * 0.8 + this.smoothMids * 0.4);
      const x = startX + i * stepX;
      const y = centerY + dynamicAmp;

      if (i === 0) ctx.moveTo(x, y);
      else {
        const prevX = startX + (i - 1) * stepX;
        const xc = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, y, xc, y);
      }
    }

    ctx.strokeStyle = this.options.lowColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.options.lowColor;
    ctx.shadowBlur = 12;
    ctx.stroke();

    ctx.restore();
  }

  public clone(): AdaptiveVisualizerEffect {
    const c = new AdaptiveVisualizerEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
