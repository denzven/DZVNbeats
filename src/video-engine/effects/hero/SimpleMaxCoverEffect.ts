import { FrameContext, VideoEffect } from "../../types";

export class SimpleMaxCoverEffect implements VideoEffect {
  public id = "hero-simple-max-cover";
  public name = "Max Center Cover Art";
  public description = "Clean album cover artwork covering the maximum possible size in the center of the screen with customizable padding, corner rounding, drop shadow, and dynamic kick bounce.";
  public category = "hero" as const;
  public enabled = false;
  public order = 35;

  public options = {
    fitMode: "max-square" as "max-square" | "cover" | "contain",
    padding: 36,
    cornerRadius: 24,
    shadowDepth: 45,
    shadowOpacity: 0.85,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.18)",
    reactToKick: true,
    kickScale: 1.03,
    dimOverlay: 0.0,
    kickGlow: true,
  };

  public schema = [
    {
      key: "fitMode",
      label: "Cover Fit Mode",
      type: "select" as const,
      default: "max-square",
      options: [
        { label: "Max Center Square (1:1 Max Possible)", value: "max-square" },
        { label: "Full Canvas Bleed (Cover Screen)", value: "cover" },
        { label: "Canvas Fit (Contain)", value: "contain" },
      ],
    },
    {
      key: "padding",
      label: "Outer Padding (px)",
      type: "number" as const,
      default: 36,
      min: 0,
      max: 180,
      step: 4,
    },
    {
      key: "cornerRadius",
      label: "Corner Rounding (px)",
      type: "number" as const,
      default: 24,
      min: 0,
      max: 80,
      step: 2,
    },
    {
      key: "shadowDepth",
      label: "Drop Shadow Blur",
      type: "number" as const,
      default: 45,
      min: 0,
      max: 100,
      step: 5,
    },
    {
      key: "shadowOpacity",
      label: "Shadow Darkness",
      type: "number" as const,
      default: 0.85,
      min: 0.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: "borderWidth",
      label: "Border Thickness",
      type: "number" as const,
      default: 1.5,
      min: 0,
      max: 8,
      step: 0.5,
    },
    {
      key: "borderColor",
      label: "Border Color",
      type: "color" as const,
      default: "#ffffff",
    },
    {
      key: "reactToKick",
      label: "Dynamic Bass Bounce",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "kickScale",
      label: "Bounce Strength Multiplier",
      type: "number" as const,
      default: 1.03,
      min: 1.0,
      max: 1.15,
      step: 0.01,
    },
    {
      key: "kickGlow",
      label: "Subtle Kick Glow",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "dimOverlay",
      label: "Darken Artwork Dimmer",
      type: "number" as const,
      default: 0.0,
      min: 0.0,
      max: 0.8,
      step: 0.05,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio, coverImage } = frameCtx;
    const cx = width / 2;
    const cy = height / 2;

    // Reactivity to kicks & drum transients
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.55;
    const drumImpact = (audio.drums ?? 0) * 0.4 + (audio.subBass ?? 0) * 0.3;
    const kickMultiplier = this.options.reactToKick
      ? 1.0 + (isKick ? (this.options.kickScale - 1.0) : drumImpact * (this.options.kickScale - 1.0) * 0.6)
      : 1.0;

    // Calculate maximum possible dimensions in the center of the screen
    let targetW = width;
    let targetH = height;

    if (this.options.fitMode === "max-square") {
      // Maximum possible square that fits within the viewport with configured padding
      const maxSquareDimension = Math.min(width, height) - this.options.padding * 2;
      targetW = Math.max(100, maxSquareDimension) * kickMultiplier;
      targetH = targetW;
    } else if (this.options.fitMode === "cover") {
      targetW = width * kickMultiplier;
      targetH = height * kickMultiplier;
    } else {
      // Contain mode
      const scale = Math.min(
        (width - this.options.padding * 2) / width,
        (height - this.options.padding * 2) / height
      );
      targetW = width * scale * kickMultiplier;
      targetH = height * scale * kickMultiplier;
    }

    const halfW = targetW / 2;
    const halfH = targetH / 2;
    const rad = Math.min(this.options.cornerRadius, Math.min(halfW, halfH));

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Deep Multi-Layer Drop Shadow
    if (this.options.shadowDepth > 0 && this.options.shadowOpacity > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(0, 0, 0, ${this.options.shadowOpacity})`;
      ctx.shadowBlur = this.options.shadowDepth * (isKick ? 1.15 : 1.0);
      ctx.shadowOffsetY = this.options.shadowDepth * 0.35;

      ctx.fillStyle = "#121214";
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, targetW, targetH, rad);
      ctx.fill();
      ctx.restore();
    }

    // 2. Cover Art Image (centered, maximum possible size)
    if (coverImage) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, targetW, targetH, rad);
      ctx.clip();

      // Draw image with proper aspect-fit / aspect-fill into the target bounds
      const imgW = coverImage.width || 1;
      const imgH = coverImage.height || 1;
      const imgAspect = imgW / imgH;
      const rectAspect = targetW / targetH;

      let drawW = targetW;
      let drawH = targetH;
      let offX = -halfW;
      let offY = -halfH;

      if (imgAspect > rectAspect) {
        drawW = targetH * imgAspect;
        offX = -drawW / 2;
      } else {
        drawH = targetW / imgAspect;
        offY = -drawH / 2;
      }

      ctx.drawImage(coverImage, offX, offY, drawW, drawH);

      // Optional Dimmer Overlay
      if (this.options.dimOverlay > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.options.dimOverlay})`;
        ctx.fillRect(-halfW, -halfH, targetW, targetH);
      }

      ctx.restore();
    } else {
      // Fallback elegant placeholder card
      ctx.fillStyle = "#1e1e24";
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, targetW, targetH, rad);
      ctx.fill();
    }

    // 3. Perimeter Border & Kick Glow
    if (this.options.borderWidth > 0) {
      ctx.save();
      if (this.options.kickGlow && isKick) {
        ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
        ctx.shadowBlur = 15;
      }
      ctx.strokeStyle = this.options.borderColor;
      ctx.lineWidth = this.options.borderWidth;
      ctx.beginPath();
      ctx.roundRect(-halfW, -halfH, targetW, targetH, rad);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  public clone(): SimpleMaxCoverEffect {
    const c = new SimpleMaxCoverEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
