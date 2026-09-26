import { FrameContext, VideoEffect } from "../../types";

interface ShockwaveRing {
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  lineWidth: number;
  color: string;
}

export class ShockwaveRingsEffect implements VideoEffect {
  public id = "vis-shockwave-rings";
  public name = "Bass Shockwave Rings";
  public description = "Expanding geometric audio ripple rings radiating from the center on drum kicks, 808 sub drops, or snare snaps.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 39; // Just below hero card or visualizer dock

  private rings: ShockwaveRing[] = [];
  private lastTriggerTime = 0;

  public options = {
    trigger: "drums" as "drums" | "subBass" | "snare" | "hihats",
    color: "#fbbf24",
    maxRadius: 650,
    speed: 7,
    lineWidth: 2.5,
    glow: true,
    shape: "circle" as "circle" | "rounded-square" | "diamond",
    ringCount: 3,
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
        { label: "Snare & Clap Snaps", value: "snare" },
        { label: "Hi-Hat Ticks", value: "hihats" },
      ],
    },
    {
      key: "color",
      label: "Ring Accent Color",
      type: "color" as const,
      default: "#fbbf24",
    },
    {
      key: "shape",
      label: "Shockwave Geometry",
      type: "select" as const,
      default: "circle",
      options: [
        { label: "Concentric Circles", value: "circle" },
        { label: "Rounded Squares", value: "rounded-square" },
        { label: "Geometric Diamonds", value: "diamond" },
      ],
    },
    {
      key: "maxRadius",
      label: "Maximum Expansion Radius (px)",
      type: "number" as const,
      default: 650,
      min: 200,
      max: 1400,
      step: 25,
    },
    {
      key: "speed",
      label: "Ring Expansion Speed",
      type: "number" as const,
      default: 7,
      min: 2,
      max: 16,
      step: 0.5,
    },
    {
      key: "lineWidth",
      label: "Ring Line Thickness (px)",
      type: "number" as const,
      default: 2.5,
      min: 1,
      max: 10,
      step: 0.5,
    },
    {
      key: "glow",
      label: "Luminescence Glow",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio, time } = frameCtx;
    const cx = width / 2;
    const cy = height / 2;

    // Check hit trigger condition
    let shouldSpawn = false;
    if (this.options.trigger === "subBass") {
      shouldSpawn = (audio.calibrated?.subBass ?? audio.subBass ?? 0) > 0.65;
    } else if (this.options.trigger === "snare") {
      shouldSpawn = audio.isSnare;
    } else if (this.options.trigger === "hihats") {
      shouldSpawn = audio.isHihat;
    } else {
      // "drums" (kick hit or transient impact)
      shouldSpawn = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    }

    // Rate limit spawning: at least 0.12s between rings
    if (shouldSpawn && time - this.lastTriggerTime > 0.12) {
      this.lastTriggerTime = time;
      if (this.rings.length < 8) {
        this.rings.push({
          radius: 30,
          maxRadius: this.options.maxRadius,
          opacity: 0.95,
          speed: this.options.speed,
          lineWidth: this.options.lineWidth,
          color: this.options.color,
        });
      }
    }

    if (this.rings.length === 0) return;

    ctx.save();
    ctx.translate(cx, cy);

    if (this.options.glow) {
      ctx.shadowColor = this.options.color;
      ctx.shadowBlur = 12;
    }

    const nextRings: ShockwaveRing[] = [];

    for (const ring of this.rings) {
      ring.radius += ring.speed;
      const progress = ring.radius / ring.maxRadius;
      ring.opacity = Math.max(0, 1.0 - Math.pow(progress, 1.6));

      if (progress < 1.0 && ring.opacity > 0.01) {
        ctx.save();
        ctx.strokeStyle = ring.color;
        ctx.globalAlpha = ring.opacity;
        ctx.lineWidth = Math.max(1, ring.lineWidth * (1 - progress * 0.5));

        ctx.beginPath();
        if (this.options.shape === "circle") {
          ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
        } else if (this.options.shape === "rounded-square") {
          const half = ring.radius;
          ctx.roundRect(-half, -half, half * 2, half * 2, half * 0.2);
        } else {
          // Diamond
          const r = ring.radius;
          ctx.moveTo(0, -r);
          ctx.lineTo(r, 0);
          ctx.lineTo(0, r);
          ctx.lineTo(-r, 0);
          ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();

        nextRings.push(ring);
      }
    }

    this.rings = nextRings;
    ctx.restore();
  }

  public clone(): ShockwaveRingsEffect {
    const c = new ShockwaveRingsEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
