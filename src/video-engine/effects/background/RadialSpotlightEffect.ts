import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class RadialSpotlightEffect implements VideoEffect {
  public id = "bg-radial-spotlight";
  public name = "Studio Spotlight & Backdrop";
  public description = "Cinematic studio spotlight cone centered on the hero centerpiece with dark perimeter falloff and kick pulse.";
  public category = "background" as const;
  public enabled = false;
  public order = 9;

  public options = {
    spotlightColor: "#f59e0b",
    intensity: 0.85,
    radiusMultiplier: 1.0,
    reactToKick: true,
  };

  public schema = [
    {
      key: "spotlightColor",
      label: "Spotlight Core Color",
      type: "color" as const,
      default: "#f59e0b",
    },
    {
      key: "intensity",
      label: "Luminance Intensity",
      type: "number" as const,
      default: 0.85,
      min: 0.2,
      max: 1.5,
      step: 0.05,
    },
    {
      key: "radiusMultiplier",
      label: "Beam Spread Radius",
      type: "number" as const,
      default: 1.0,
      min: 0.5,
      max: 2.0,
      step: 0.1,
    },
    {
      key: "reactToKick",
      label: "Kick Pulse Dynamic",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, aspectRatio, audio } = frameCtx;
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickBoost = isKick && this.options.reactToKick ? 1.2 : 1.0;

    // Anchor spotlight at hero center
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    let cx = width / 2;
    let cy = height / 2;

    if (isVinylActive) {
      const vGeom = GridSystem.getVinylGeometry(width, height, aspectRatio, frameCtx.time);
      cx = vGeom.vinylCenterX;
      cy = vGeom.vinylCenterY;
    } else {
      const heroGeom = GridSystem.getHeroCardGeometry(width, height, aspectRatio, false);
      cx = heroGeom.cx;
      cy = heroGeom.cy;
    }

    const baseRadius = Math.max(width, height) * 0.45 * this.options.radiusMultiplier * kickBoost;

    ctx.save();

    // Dark moody backdrop
    ctx.fillStyle = "#09090d";
    ctx.fillRect(0, 0, width, height);

    // Radial Spotlight Beam
    const spotGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius);
    spotGrad.addColorStop(0, this.options.spotlightColor);
    spotGrad.addColorStop(0.25, this.options.spotlightColor);
    spotGrad.addColorStop(0.65, "rgba(20, 20, 28, 0.4)");
    spotGrad.addColorStop(1, "transparent");

    ctx.globalAlpha = Math.min(1, 0.45 * this.options.intensity * (isKick ? 1.3 : 1.0));
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle center highlight
    const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.35);
    coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    coreGrad.addColorStop(1, "transparent");
    ctx.globalAlpha = 0.25 * this.options.intensity;
    ctx.fillStyle = coreGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  public clone(): RadialSpotlightEffect {
    const c = new RadialSpotlightEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
