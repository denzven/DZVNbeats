import { FrameContext, VideoEffect } from "../../types";

export class RgbGlitchEffect implements VideoEffect {
  public id = "post-rgb-glitch";
  public name = "RGB Split & Glitch";
  public description = "Cinematic chromatic aberration and horizontal slice displacement triggered on bass kicks and drops.";
  public category = "post" as const;
  public enabled = false;
  public order = 92;

  public options = {
    glitchIntensity: 1.0,
    onlyOnKick: true,
    chromaticShift: 8, // pixels
  };

  public schema = [
    {
      key: "glitchIntensity",
      label: "Glitch Shift Magnitude",
      type: "number" as const,
      default: 1.0,
      min: 0.2,
      max: 2.5,
      step: 0.1,
    },
    {
      key: "chromaticShift",
      label: "RGB Split Offset (px)",
      type: "number" as const,
      default: 8,
      min: 2,
      max: 24,
      step: 1,
    },
    {
      key: "onlyOnKick",
      label: "Trigger Only on Bass Kicks",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height } = frameCtx;
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;

    if (this.options.onlyOnKick && !isKick) return;

    const shift = this.options.chromaticShift * this.options.glitchIntensity;

    ctx.save();

    // 1. Chromatic Shift Layer via globalCompositeOperation
    ctx.globalAlpha = 0.22 * this.options.glitchIntensity;
    ctx.globalCompositeOperation = "screen";

    // Red shift right
    ctx.drawImage(ctx.canvas, -shift, 0, width, height);

    // Cyan shift left
    ctx.drawImage(ctx.canvas, shift, 0, width, height);

    ctx.globalCompositeOperation = "source-over";

    // 2. Horizontal Glitch Slice Bands
    if (isKick) {
      const sliceCount = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s < sliceCount; s++) {
        const sliceY = Math.random() * height;
        const sliceH = 15 + Math.random() * 35;
        const sliceShift = (Math.random() - 0.5) * shift * 2.5;

        ctx.drawImage(
          ctx.canvas,
          0,
          sliceY,
          width,
          sliceH,
          sliceShift,
          sliceY,
          width,
          sliceH
        );
      }
    }

    ctx.restore();
  }

  public clone(): RgbGlitchEffect {
    const c = new RgbGlitchEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
