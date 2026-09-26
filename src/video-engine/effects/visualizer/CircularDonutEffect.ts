import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class CircularDonutEffect implements VideoEffect {
  public id = "vis-circular-donut";
  public name = "Circular Donut Spectrograph";
  public description = "Mirrored circular equalizer bars radiating around the hero centerpiece with audio kick expansion.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 44;

  private currentRotation = 0;
  private kickScale = 1.0;

  public options = {
    barCount: 64,
    maxBarLength: 75,
    barWidth: 5,
    innerRadiusOffset: 12,
    rotationSpeed: 0.15,
    color: "#fbbf24",
    glow: true,
    kickReaction: true,
  };

  public schema = [
    {
      key: "barCount",
      label: "Radial Bar Count",
      type: "number" as const,
      default: 64,
      min: 24,
      max: 128,
      step: 8,
    },
    {
      key: "maxBarLength",
      label: "Max Bar Length (px)",
      type: "number" as const,
      default: 75,
      min: 20,
      max: 160,
      step: 5,
    },
    {
      key: "barWidth",
      label: "Bar Thickness (px)",
      type: "number" as const,
      default: 5,
      min: 2,
      max: 12,
      step: 1,
    },
    {
      key: "rotationSpeed",
      label: "Spin Speed (RPM)",
      type: "number" as const,
      default: 0.15,
      min: -1.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: "kickReaction",
      label: "Kick Pulse Expansion",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "glow",
      label: "Glow Bloom Aura",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "color",
      label: "Spectrograph Color",
      type: "color" as const,
      default: "#fbbf24",
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio, time } = frameCtx;
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const auraGeom = GridSystem.getAuraGeometry(width, height, aspectRatio, time, isVinylActive);

    // Audio Kick Dynamics
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    if (this.options.kickReaction && isKick) {
      this.kickScale = 1.15;
    } else {
      this.kickScale += (1.0 - this.kickScale) * 0.12;
    }

    // Continuous Rotation
    this.currentRotation += this.options.rotationSpeed * 0.02;

    const count = this.options.barCount;
    const baseRadius = (auraGeom.baseRadius + this.options.innerRadiusOffset) * this.kickScale;
    const maxLength = this.options.maxBarLength * (isKick ? 1.2 : 1.0);
    const freq = audio.frequencyData;

    ctx.save();
    ctx.translate(auraGeom.cx, auraGeom.cy);

    if (this.options.glow) {
      ctx.shadowColor = this.options.color;
      ctx.shadowBlur = isKick ? 24 : 12;
    }

    ctx.strokeStyle = this.options.color;
    ctx.lineWidth = this.options.barWidth;
    ctx.lineCap = "round";

    // Draw circular radiating bars (mirrored left and right for harmonic symmetry)
    const half = count / 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + this.currentRotation;

      // Symmetrical FFT index mapping
      const fftIndex = Math.floor(
        i < half
          ? (i / half) * (freq.length * 0.45)
          : ((count - i) / half) * (freq.length * 0.45)
      );
      const val = (freq[fftIndex] || 0) / 255;
      const barLen = Math.max(6, val * maxLength);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const x1 = cos * baseRadius;
      const y1 = sin * baseRadius;
      const x2 = cos * (baseRadius + barLen);
      const y2 = sin * (baseRadius + barLen);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  public clone(): CircularDonutEffect {
    const c = new CircularDonutEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
