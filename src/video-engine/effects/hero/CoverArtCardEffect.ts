import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class CoverArtCardEffect implements VideoEffect {
  public id = "hero-cover-art-shadow";
  public name = "Cover Art Card (Drop Shadow)";
  public description = "Pristine album cover artwork card with deep multi-layered drop shadow and customizable corner rounding. Clean and minimalist.";
  public category = "hero" as const;
  public enabled = false;
  public order = 34;

  public options = {
    cornerRadius: 22,
    shadowDepth: 40,
    shadowOpacity: 0.85,
    cardScale: 1.0,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.18)",
    reactToKick: false,
  };

  public schema = [
    {
      key: "cornerRadius",
      label: "Corner Rounding (px)",
      type: "number" as const,
      default: 22,
      min: 0,
      max: 48,
      step: 2,
    },
    {
      key: "shadowDepth",
      label: "Drop Shadow Blur",
      type: "number" as const,
      default: 40,
      min: 10,
      max: 80,
      step: 5,
    },
    {
      key: "shadowOpacity",
      label: "Shadow Darkness",
      type: "number" as const,
      default: 0.85,
      min: 0.2,
      max: 1.0,
      step: 0.05,
    },
    {
      key: "cardScale",
      label: "Artwork Size Multiplier",
      type: "number" as const,
      default: 1.0,
      min: 0.6,
      max: 1.5,
      step: 0.05,
    },
    {
      key: "borderWidth",
      label: "Border Thickness",
      type: "number" as const,
      default: 1.5,
      min: 0,
      max: 6,
      step: 0.5,
    },
    {
      key: "reactToKick",
      label: "Subtle Kick Bounce",
      type: "boolean" as const,
      default: false,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, aspectRatio, audio, coverImage } = frameCtx;
    const heroGeom = GridSystem.getHeroCardGeometry(width, height, aspectRatio, false);

    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickBoost = isKick && this.options.reactToKick ? 1.03 : 1.0;

    const size = heroGeom.size * this.options.cardScale * kickBoost;
    const half = size / 2;
    const cx = heroGeom.cx;
    const cy = heroGeom.cy;
    const rad = this.options.cornerRadius;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Deep Multi-Layer Drop Shadow (Ambient Occlusion + Distant Falloff)
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${this.options.shadowOpacity})`;
    ctx.shadowBlur = this.options.shadowDepth * (isKick && this.options.reactToKick ? 1.2 : 1.0);
    ctx.shadowOffsetY = this.options.shadowDepth * 0.35;

    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.roundRect(-half, -half, size, size, rad);
    ctx.fill();
    ctx.restore();

    // 2. Cover Art Image
    if (coverImage) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, rad);
      ctx.clip();
      ctx.drawImage(coverImage, -half, -half, size, size);
      ctx.restore();
    } else {
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, rad);
      ctx.fill();
    }

    // 3. Crisp Perimeter Border
    if (this.options.borderWidth > 0) {
      ctx.strokeStyle = this.options.borderColor;
      ctx.lineWidth = this.options.borderWidth;
      ctx.beginPath();
      ctx.roundRect(-half, -half, size, size, rad);
      ctx.stroke();
    }

    ctx.restore();
  }

  public clone(): CoverArtCardEffect {
    const c = new CoverArtCardEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
