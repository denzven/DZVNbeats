import { FrameContext, VideoEffect } from "../../types";

export class VignetteAndGrainEffect implements VideoEffect {
  public id = "post-vignette-grain";
  public name = "Cinematic Vignette & Film Grain";
  public description = "Rich analog edge falloff and subtle living 35mm film grain texture.";
  public category = "post" as const;
  public enabled = true;
  public order = 90;

  public options = {
    vignetteStrength: 0.65,
    grainIntensity: 0.04,
    showVignette: true,
    showGrain: true,
  };

  public schema = [
    {
      key: "vignetteStrength",
      label: "Vignette Darkness",
      type: "number" as const,
      default: 0.65,
      min: 0.0,
      max: 1.0,
      step: 0.05,
    },
    {
      key: "grainIntensity",
      label: "Film Grain Amount",
      type: "number" as const,
      default: 0.04,
      min: 0.0,
      max: 0.15,
      step: 0.01,
    },
  ];

  private noiseCanvases: HTMLCanvasElement[] = [];

  private getNoiseCanvas(index: number): HTMLCanvasElement {
    if (!this.noiseCanvases[index]) {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const offCtx = canvas.getContext("2d");
      if (offCtx) {
        const imgData = offCtx.createImageData(size, size);
        const data = imgData.data;
        const total = size * size;
        for (let i = 0; i < total; i++) {
          const idx = i * 4;
          const val = Math.random() > 0.5 ? 255 : 200;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = Math.random() < 0.2 ? Math.floor(Math.random() * 26 + 8) : 0;
        }
        offCtx.putImageData(imgData, 0, 0);
      }
      this.noiseCanvases[index] = canvas;
    }
    return this.noiseCanvases[index];
  }

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height } = frameCtx;

    ctx.save();

    // 1. Vignette
    if (this.options.showVignette && this.options.vignetteStrength > 0) {
      const radius = Math.max(width, height) * 0.75;
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        radius * 0.35,
        width / 2,
        height / 2,
        radius
      );
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, `rgba(0, 0, 0, ${this.options.vignetteStrength})`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. High-speed living 35mm film grain texture
    if (this.options.showGrain && this.options.grainIntensity > 0) {
      const noiseIdx = frameCtx.frame % 4;
      const noise = this.getNoiseCanvas(noiseIdx);
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, this.options.grainIntensity * 2.4);
      ctx.globalCompositeOperation = "screen";
      const pattern = ctx.createPattern(noise, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();
    }

    ctx.restore();
  }

  public clone(): VignetteAndGrainEffect {
    const c = new VignetteAndGrainEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
