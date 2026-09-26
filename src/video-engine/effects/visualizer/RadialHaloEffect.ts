import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class RadialHaloEffect implements VideoEffect {
  public id = "vis-radial-halo";
  public name = "Radial Spectrum Halo";
  public description = "Glowing circular frequency spectrum radiating outward from behind the vinyl record rim.";
  public category = "visualizer" as const;
  public enabled = true;
  public order = 25; // Rendered BEHIND the Hero disc (order: 30) for pristine edge lighting!

  public options = {
    barCount: 96,
    maxBarLength: 85,
    glow: true,
    colorStart: "#fbbf24", // Amber-400
    colorEnd: "#f97316",   // Orange-500
    mirror: true,
    pulseRings: true,
  };

  public schema = [
    {
      key: "barCount",
      label: "Number of Radial Bars",
      type: "number" as const,
      default: 96,
      min: 32,
      max: 180,
      step: 8,
    },
    {
      key: "maxBarLength",
      label: "Max Bar Height (px)",
      type: "number" as const,
      default: 85,
      min: 20,
      max: 160,
      step: 5,
    },
    {
      key: "pulseRings",
      label: "Bass Pulse Shockwave Rings",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "colorStart",
      label: "Inner Glow Color",
      type: "color" as const,
      default: "#fbbf24",
    },
    {
      key: "colorEnd",
      label: "Outer Tip Color",
      type: "color" as const,
      default: "#f97316",
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio, time } = frameCtx;

    // Use unified aura geometry: wraps behind vinyl disc if active, or around artwork card
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const geom = GridSystem.getAuraGeometry(width, height, aspectRatio, time, isVinylActive);
    const cx = geom.cx;
    const cy = geom.cy;
    const baseRadius = geom.baseRadius;

    const count = this.options.barCount;
    const freq = audio.frequencyData;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Audio-Reactive Bass Shockwave Ring behind disc
    if (this.options.pulseRings) {
      const ringPulse = audio.subBass * 40;
      const ringAlpha = Math.min(0.6, audio.subBass * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius + ringPulse + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(251, 191, 36, ${ringAlpha})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 2. Radial Frequency Bars
    if (this.options.glow) {
      ctx.shadowColor = this.options.colorStart;
      ctx.shadowBlur = 14 + audio.bass * 20;
    }

    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const normIdx = this.options.mirror
        ? Math.abs(i - count / 2) / (count / 2)
        : i / count;
      const binIdx = Math.floor(normIdx * Math.min(freq.length, 110));

      const rawVal = freq[binIdx] || 0;
      const normalized = Math.pow(rawVal / 255, 1.35);
      const barLen = Math.max(4, normalized * this.options.maxBarLength);

      const angle = i * angleStep;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const x1 = cos * (baseRadius + 2);
      const y1 = sin * (baseRadius + 2);
      const x2 = cos * (baseRadius + 2 + barLen);
      const y2 = sin * (baseRadius + 2 + barLen);

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, this.options.colorStart);
      grad.addColorStop(1, this.options.colorEnd);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(2.0, ((Math.PI * 2 * baseRadius) / count) * 0.6);
      ctx.lineCap = "round";
      ctx.stroke();
    }

    ctx.restore();
  }

  public clone(): RadialHaloEffect {
    const c = new RadialHaloEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
