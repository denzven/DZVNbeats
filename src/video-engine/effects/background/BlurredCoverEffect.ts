import { FrameContext, VideoEffect } from "../../types";

export class BlurredCoverEffect implements VideoEffect {
  public id = "bg-blurred-cover";
  public name = "Blurred Ambient Cover";
  public description = "Creamy blurred cover background with subtle bass breathing and darkening.";
  public category = "background" as const;
  public enabled = true;
  public order = 10;
  public options = {
    blurAmount: 35,
    darken: 0.55,
    pulseWithBass: true,
    zoom: 1.15,
  };

  public schema = [
    {
      key: "blurAmount",
      label: "Blur Radius (px)",
      type: "number" as const,
      default: 35,
      min: 5,
      max: 80,
      step: 1,
    },
    {
      key: "darken",
      label: "Darkness Overlay",
      type: "number" as const,
      default: 0.55,
      min: 0,
      max: 0.9,
      step: 0.05,
    },
    {
      key: "zoom",
      label: "Background Scale",
      type: "number" as const,
      default: 1.15,
      min: 1.0,
      max: 1.5,
      step: 0.05,
    },
    {
      key: "pulseWithBass",
      label: "Bass Breathing",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, coverImage, audio } = frameCtx;

    ctx.save();

    // Default dark fallback
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, width, height);

    if (coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
      const bassPulse = this.options.pulseWithBass
        ? audio.bass * 0.06 + audio.subBass * 0.04
        : 0;
      const scale = this.options.zoom + bassPulse;

      const imgAspect = coverImage.naturalWidth / coverImage.naturalHeight;
      const canvasAspect = width / height;

      let drawW = width * scale;
      let drawH = height * scale;

      if (imgAspect > canvasAspect) {
        drawW = drawH * imgAspect;
      } else {
        drawH = drawW / imgAspect;
      }

      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;

      ctx.filter = `blur(${this.options.blurAmount}px)`;
      ctx.drawImage(coverImage, dx, dy, drawW, drawH);
      ctx.filter = "none";
    }

    // Dark overlay for contrast
    ctx.fillStyle = `rgba(9, 9, 11, ${this.options.darken})`;
    ctx.fillRect(0, 0, width, height);

    // Subtle radial gradient center highlight
    const radialGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      100,
      width / 2,
      height / 2,
      Math.max(width, height) / 1.4,
    );
    radialGrad.addColorStop(0, "rgba(255, 255, 255, 0.03)");
    radialGrad.addColorStop(1, "rgba(0, 0, 0, 0.65)");
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  public clone(): BlurredCoverEffect {
    const c = new BlurredCoverEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
