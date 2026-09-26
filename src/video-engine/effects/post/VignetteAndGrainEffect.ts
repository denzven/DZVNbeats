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

    // 2. Subtle living film grain
    if (this.options.showGrain && this.options.grainIntensity > 0) {
      // Draw sparse fast noise points without heavy pixel loops
      const grainCount = Math.floor((width * height) / 320);
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";

      for (let i = 0; i < grainCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        ctx.fillRect(x, y, 1, 1);
      }
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
