import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class SoloVinylEffect implements VideoEffect {
  public id = "hero-solo-vinyl";
  public name = "Solo Spinning Vinyl";
  public description = "Pristine standalone spinning vinyl record with micro-grooves, light sheen reflections, and center cover art label. No sleeves or tonearms.";
  public category = "hero" as const;
  public enabled = false;
  public order = 30;

  private currentRotation = 0;

  public options = {
    rpmSpeed: 33.33,
    sizeMultiplier: 1.0,
    reactToKick: true,
    reflectionSheen: true,
    centerCoverScale: 0.38,
  };

  public schema = [
    {
      key: "rpmSpeed",
      label: "Spin Speed (RPM)",
      type: "number" as const,
      default: 33.33,
      min: 0,
      max: 78,
      step: 1,
    },
    {
      key: "sizeMultiplier",
      label: "Vinyl Disc Size",
      type: "number" as const,
      default: 1.0,
      min: 0.6,
      max: 1.5,
      step: 0.05,
    },
    {
      key: "reactToKick",
      label: "Sub-Bass Kick Pulse",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "reflectionSheen",
      label: "Glossy Groove Sheen",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "centerCoverScale",
      label: "Center Label Size",
      type: "number" as const,
      default: 0.38,
      min: 0.25,
      max: 0.5,
      step: 0.02,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, aspectRatio, audio, coverImage, fps } = frameCtx;
    const heroGeom = GridSystem.getHeroCardGeometry(width, height, aspectRatio, false);

    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickScale = isKick && this.options.reactToKick ? 1.035 : 1.0;

    // RPM rotation delta per frame
    const deltaRot = ((this.options.rpmSpeed * 2 * Math.PI) / 60) / (fps || 60);
    this.currentRotation += deltaRot;

    const baseRadius = (heroGeom.size / 2) * this.options.sizeMultiplier * kickScale;
    const cx = heroGeom.cx;
    const cy = heroGeom.cy;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Deep Multi-Layer Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = isKick ? 45 : 30;
    ctx.shadowOffsetY = 12;

    // 2. Vinyl Outer Disc Body (Deep Carbon Black)
    ctx.fillStyle = "#0c0c0e";
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "transparent";

    // 3. Beveled Outer Rim Highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Phonograph Micro-Groove Rings
    ctx.lineWidth = 1;
    const labelRadius = baseRadius * this.options.centerCoverScale;
    const grooveRange = baseRadius - labelRadius;
    const ringCount = 14;

    for (let i = 0; i < ringCount; i++) {
      const r = labelRadius + (i / ringCount) * grooveRange * 0.94;
      ctx.strokeStyle = i % 2 === 0 ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 5. Dynamic Anisotropic Light Sheen (Two opposing reflection cones that rotate)
    if (this.options.reflectionSheen) {
      ctx.save();
      ctx.rotate(this.currentRotation * 0.4); // Slower reflective refraction angle

      const sheenGrad = ctx.createConicGradient(0, 0, 0);
      sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
      sheenGrad.addColorStop(0.25, "rgba(0, 0, 0, 0.15)");
      sheenGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
      sheenGrad.addColorStop(0.75, "rgba(0, 0, 0, 0.15)");
      sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0.08)");

      ctx.fillStyle = sheenGrad;
      ctx.globalCompositeOperation = "screen";
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.98, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 6. Rotating Center Label Sticker with Cover Art
    ctx.save();
    ctx.rotate(this.currentRotation);

    // Label Outer Ring
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cover Art in Circular Cutout
    if (coverImage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, labelRadius * 0.92, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(
        coverImage,
        -labelRadius * 0.92,
        -labelRadius * 0.92,
        labelRadius * 1.84,
        labelRadius * 1.84
      );
      ctx.restore();
    }

    // Label Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, labelRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 7. Spindle Center Hole
    const holeRadius = Math.max(6, baseRadius * 0.045);
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  public clone(): SoloVinylEffect {
    const c = new SoloVinylEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
