import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class SpectrumBarsEffect implements VideoEffect {
  public id = "vis-spectrum-bars";
  public name = "Linear Spectrum Dock";
  public description = "Glassmorphic dock with audio equalizer bars (20Hz - 20,000Hz) and floating peak-drop caps.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 40; // Mid-visualizer layer

  private peaks: number[] = [];

  public options = {
    barCount: 48,
    maxHeight: 70,
    barWidth: 6,
    barGap: 5,
    showGlassDock: true,
    showPeaks: true,
    mirror: false,
    color: "#f59e0b",
    adaptiveCalibration: true,
  };

  public schema = [
    {
      key: "barCount",
      label: "Equalizer Bar Count",
      type: "number" as const,
      default: 48,
      min: 16,
      max: 96,
      step: 4,
    },
    {
      key: "maxHeight",
      label: "Max Bar Height (px)",
      type: "number" as const,
      default: 70,
      min: 25,
      max: 140,
      step: 5,
    },
    {
      key: "showGlassDock",
      label: "Show Glassmorphic Dock Pill",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showPeaks",
      label: "Show Floating Peaks",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "mirror",
      label: "Center Symmetric Mirror",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "adaptiveCalibration",
      label: "Adaptive Beat Calibration (Lows/Mids/Highs)",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "color",
      label: "Bar Accent Color",
      type: "color" as const,
      default: "#f59e0b",
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio } = frameCtx;
    const count = this.options.barCount;
    const freq = audio.frequencyData;

    if (this.peaks.length !== count) {
      this.peaks = new Array(count).fill(0);
    }

    // Scaled directly to the Dock Visualizer Grid Section
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const dock = GridSystem.getDockGeometry(width, height, aspectRatio, isVinylActive);

    // Dynamically calculate barWidth and barGap to fit within dock bounds in both orientations
    const maxAllowedWidth = dock.width;
    const rawTotalWidth = count * this.options.barWidth + (count - 1) * this.options.barGap;
    const targetW = Math.min(maxAllowedWidth, rawTotalWidth);

    const effectiveBarW = Math.max(2.5, (targetW / count) * 0.54);
    const effectiveGap = Math.max(1.5, (targetW - count * effectiveBarW) / (count - 1));
    const totalBarsWidth = count * effectiveBarW + (count - 1) * effectiveGap;

    const startX = dock.cx - totalBarsWidth / 2;
    const maxHeight = Math.min(this.options.maxHeight, dock.maxHeight);
    const baseY = dock.cy + maxHeight * 0.28;

    ctx.save();

    // 1. Glassmorphic Background Dock
    if (this.options.showGlassDock) {
      const dockPadX = 24;
      const dockPadY = 14;
      const dockW = totalBarsWidth + dockPadX * 2;
      const dockH = maxHeight + dockPadY * 2;

      ctx.beginPath();
      ctx.roundRect(
        dock.cx - dockW / 2,
        baseY - maxHeight - dockPadY,
        dockW,
        dockH,
        18
      );
      ctx.fillStyle = "rgba(18, 18, 20, 0.72)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    const minHz = 20;
    const maxHz = 20000;
    const totalBins = freq.length * 2; // 2048 FFT

    // 2. Render Bars (Acoustically mapped 20Hz - 20,000Hz)
    for (let i = 0; i < count; i++) {
      let normVal = 0;
      if (this.options.mirror) {
        const normIdx = Math.abs(i - count / 2) / (count / 2);
        const hz = minHz * Math.pow(maxHz / minHz, normIdx);
        const binIdx = Math.min(freq.length - 1, Math.max(0, Math.round((hz / 44100) * totalBins)));
        normVal = (freq[binIdx] || 0) / 255;
        if (this.options.adaptiveCalibration && audio.adaptiveFft && audio.adaptiveFft[binIdx] !== undefined) {
          normVal = audio.adaptiveFft[binIdx];
        }
      } else {
        const fracStart = count > 1 ? i / count : 0;
        const fracEnd = count > 1 ? (i + 1) / count : 1;
        const hzStart = minHz * Math.pow(maxHz / minHz, fracStart);
        const hzEnd = minHz * Math.pow(maxHz / minHz, fracEnd);
        const binStart = Math.max(0, Math.floor((hzStart / 44100) * totalBins));
        const binEnd = Math.min(freq.length - 1, Math.ceil((hzEnd / 44100) * totalBins));

        let peak = 0;
        for (let b = binStart; b <= binEnd; b++) {
          const v = this.options.adaptiveCalibration && audio.adaptiveFft && audio.adaptiveFft[b] !== undefined
            ? audio.adaptiveFft[b]
            : (freq[b] || 0) / 255;
          if (v > peak) peak = v;
        }
        normVal = peak;
      }
      const h = Math.max(3, normVal * maxHeight);

      // Peak drop gravity
      if (h > this.peaks[i]) {
        this.peaks[i] = h;
      } else {
        this.peaks[i] = Math.max(0, this.peaks[i] - 1.6);
      }

      const x = startX + i * (effectiveBarW + effectiveGap);

      // Bar gradient
      const barGrad = ctx.createLinearGradient(x, baseY - h, x, baseY);
      barGrad.addColorStop(0, this.options.color);
      barGrad.addColorStop(1, this.options.color + "4D"); // 30% opacity tail

      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x, baseY - h, effectiveBarW, h, 2.5);
      ctx.fill();

      // Mirror reflection below
      const refH = h * 0.35;
      const refGrad = ctx.createLinearGradient(x, baseY, x, baseY + refH);
      refGrad.addColorStop(0, this.options.color + "40"); // 25% opacity
      refGrad.addColorStop(1, "transparent");
      ctx.fillStyle = refGrad;
      ctx.beginPath();
      ctx.roundRect(x, baseY + 2, effectiveBarW, refH, 2);
      ctx.fill();

      // Peak cap
      if (this.options.showPeaks && this.peaks[i] > 4) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, baseY - this.peaks[i] - 3, effectiveBarW, 2);
      }
    }

    ctx.restore();
  }

  public clone(): SpectrumBarsEffect {
    const c = new SpectrumBarsEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
