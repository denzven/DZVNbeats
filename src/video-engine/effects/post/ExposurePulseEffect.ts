import { FrameContext, VideoEffect } from "../../types";

export class ExposurePulseEffect implements VideoEffect {
  public id = "post-exposure-pulse";
  public name = "Beat Exposure Flash";
  public description = "Dynamic screen exposure pump and luminous ambient flash that reacts to drum kicks, 808 sub drops, or snare snaps.";
  public category = "post" as const;
  public enabled = false;
  public order = 91; // Post-processing layer

  private currentPulse = 0;

  public options = {
    trigger: "drums" as "drums" | "subBass" | "snare" | "hihats" | "overall",
    intensity: 0.32,
    flashColor: "#ffffff",
    blendMode: "screen" as "screen" | "lighter" | "overlay",
    bloomRadius: 35,
    decaySpeed: 0.14,
    centerOnly: false,
  };

  public schema = [
    {
      key: "trigger",
      label: "Audio Trigger Source",
      type: "select" as const,
      default: "drums",
      options: [
        { label: "Kick & Drum Hits (Recommended)", value: "drums" },
        { label: "Sub-Bass & 808 Drops (20Hz - 60Hz)", value: "subBass" },
        { label: "Snare & Clap Cracks", value: "snare" },
        { label: "Hi-Hat Sparkling Ticks", value: "hihats" },
        { label: "Overall Master RMS Energy", value: "overall" },
      ],
    },
    {
      key: "intensity",
      label: "Flash Intensity / Exposure Boost",
      type: "number" as const,
      default: 0.32,
      min: 0.05,
      max: 1.0,
      step: 0.05,
    },
    {
      key: "flashColor",
      label: "Flash Tint Color",
      type: "color" as const,
      default: "#ffffff",
    },
    {
      key: "blendMode",
      label: "Canvas Blend Mode",
      type: "select" as const,
      default: "screen",
      options: [
        { label: "Screen (Smooth Film Light)", value: "screen" },
        { label: "Lighter / Additive (Vivid Glow)", value: "lighter" },
        { label: "Overlay (Punchy Contrast)", value: "overlay" },
      ],
    },
    {
      key: "bloomRadius",
      label: "Ambient Edge Bloom (px)",
      type: "number" as const,
      default: 35,
      min: 0,
      max: 100,
      step: 5,
    },
    {
      key: "decaySpeed",
      label: "Decay Smoothness",
      type: "number" as const,
      default: 0.14,
      min: 0.04,
      max: 0.4,
      step: 0.02,
    },
    {
      key: "centerOnly",
      label: "Radial Vignette Flash Only",
      type: "boolean" as const,
      default: false,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio } = frameCtx;

    // Detect instantaneous hit based on trigger selection
    let hitEnergy = 0;
    if (this.options.trigger === "subBass") {
      hitEnergy = audio.calibrated?.subBass ?? audio.subBass ?? 0;
    } else if (this.options.trigger === "snare") {
      hitEnergy = audio.isSnare ? 1.0 : (audio.calibrated?.snare ?? audio.snare ?? 0);
    } else if (this.options.trigger === "hihats") {
      hitEnergy = audio.isHihat ? 1.0 : (audio.calibrated?.hihats ?? audio.hihats ?? 0);
    } else if (this.options.trigger === "overall") {
      hitEnergy = audio.overallEnergy;
    } else {
      // "drums" (default kick + drum transients)
      hitEnergy = audio.isKick
        ? 1.0
        : (audio.calibrated?.kickTransient ?? 0) * 0.8 + (audio.drums ?? 0) * 0.4;
    }

    // Ballistic pulse envelope: instant surge, smooth exponential decay
    const targetFlash = hitEnergy * this.options.intensity;
    if (targetFlash > this.currentPulse) {
      this.currentPulse = targetFlash;
    } else {
      this.currentPulse = Math.max(
        0,
        this.currentPulse - this.options.decaySpeed
      );
    }

    if (this.currentPulse <= 0.005) return;

    ctx.save();
    ctx.globalCompositeOperation = this.options.blendMode;
    ctx.globalAlpha = Math.min(1.0, this.currentPulse);

    if (this.options.centerOnly) {
      // Radial glow emanating from center
      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.max(width, height) * 0.65;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, this.options.flashColor);
      grad.addColorStop(0.5, this.options.flashColor + "66");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Full canvas exposure boost with optional bloom edges
      ctx.fillStyle = this.options.flashColor;
      ctx.fillRect(0, 0, width, height);

      if (this.options.bloomRadius > 0) {
        ctx.shadowColor = this.options.flashColor;
        ctx.shadowBlur = this.options.bloomRadius;
      }
    }

    ctx.restore();
  }

  public clone(): ExposurePulseEffect {
    const c = new ExposurePulseEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
