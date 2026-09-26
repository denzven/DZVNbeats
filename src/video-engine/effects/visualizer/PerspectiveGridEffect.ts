import { FrameContext, VideoEffect } from "../../types";

export class PerspectiveGridEffect implements VideoEffect {
  public id = "vis-synthwave-horizon";
  public name = "Perspective Grid Horizon";
  public description = "Retro 3D wireframe terrain floor receding toward the horizon with audio-reactive ripples and forward motion.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 22; // Behind hero objects, in front of background cover

  private scrollOffset = 0;

  public options = {
    color: "#a855f7", // Neon Purple / Cyan
    speed: 0.6,
    gridDensity: 14,
    horizonPercent: 0.58, // Horizon line at 58% down the screen
    kickReaction: true,
  };

  public schema = [
    {
      key: "color",
      label: "Grid Wireframe Color",
      type: "color" as const,
      default: "#a855f7",
    },
    {
      key: "speed",
      label: "Forward Scroll Velocity",
      type: "number" as const,
      default: 0.6,
      min: 0.1,
      max: 2.0,
      step: 0.1,
    },
    {
      key: "gridDensity",
      label: "Perspective Lines Density",
      type: "number" as const,
      default: 14,
      min: 8,
      max: 24,
      step: 2,
    },
    {
      key: "kickReaction",
      label: "Bass Undulation Waves",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio, time } = frameCtx;
    const horizonY = height * this.options.horizonPercent;
    const floorH = height - horizonY;
    if (floorH <= 0) return;

    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickBoost = isKick && this.options.kickReaction ? 1.6 : 1.0;
    this.scrollOffset = (this.scrollOffset + 0.012 * this.options.speed * kickBoost) % 1.0;

    ctx.save();

    // Subtle dark gradient floor backdrop
    const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
    floorGrad.addColorStop(0, "rgba(10, 10, 16, 0.2)");
    floorGrad.addColorStop(1, "rgba(8, 8, 14, 0.85)");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizonY, width, floorH);

    // Glowing Horizon Line
    const horizGrad = ctx.createLinearGradient(0, 0, width, 0);
    horizGrad.addColorStop(0, "transparent");
    horizGrad.addColorStop(0.5, this.options.color);
    horizGrad.addColorStop(1, "transparent");

    ctx.strokeStyle = horizGrad;
    ctx.lineWidth = isKick ? 3.5 : 2;
    ctx.shadowColor = this.options.color;
    ctx.shadowBlur = isKick ? 20 : 10;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(width, horizonY);
    ctx.stroke();

    // Perspective Lines converging to vanishing center (width / 2, horizonY)
    const vanishingX = width / 2;
    const cols = this.options.gridDensity;
    const spreadBottom = width * 1.8;

    ctx.lineWidth = 1.3;
    ctx.strokeStyle = this.options.color;
    ctx.shadowBlur = 6;

    // 1. Perspective Radial Lines
    for (let i = -cols; i <= cols; i++) {
      const bottomX = vanishingX + (i / cols) * (spreadBottom / 2);
      ctx.beginPath();
      ctx.moveTo(vanishingX, horizonY);
      ctx.lineTo(bottomX, height);
      ctx.stroke();
    }

    // 2. Transverse Horizontal Cross-Lines (Logarithmic distance scaling for realistic 3D depth)
    const numRows = 16;
    const lowsEnergy = audio.calibrated?.lows ?? audio.bass ?? 0.3;

    for (let r = 0; r < numRows; r++) {
      // Exponential distribution from horizon (0) to bottom (1)
      const rawT = (r + this.scrollOffset) / numRows;
      const t = Math.pow(rawT, 2.4); // Quadratic perspective compression
      const y = horizonY + t * floorH;

      // Ripple undulation reacting to bass
      const ripple = this.options.kickReaction
        ? Math.sin(t * Math.PI * 4 - time * 6) * lowsEnergy * 10
        : 0;

      const alpha = Math.min(1, Math.max(0.08, t * 1.2));
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, y + ripple);
      ctx.lineTo(width, y + ripple);
      ctx.stroke();
    }

    ctx.restore();
  }

  public clone(): PerspectiveGridEffect {
    const c = new PerspectiveGridEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
