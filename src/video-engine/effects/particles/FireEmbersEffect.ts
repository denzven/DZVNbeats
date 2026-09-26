import { FrameContext, VideoEffect } from "../../types";

interface Ember {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  life: number;
  maxLife: number;
  hue: number;
}

export class FireEmbersEffect implements VideoEffect {
  public id = "part-fire-embers";
  public name = "Rising Fire Embers";
  public description = "Fiery glowing sparks and embers drifting upward with heat turbulence, bursting on kick transients.";
  public category = "particles" as const;
  public enabled = false;
  public order = 62;

  private embers: Ember[] = [];

  public options = {
    layer: "front" as "back" | "front",
    particleCount: 55,
    baseSpeed: 1.2,
    reactToKick: true,
    color: "#f97316", // Warm Flame Orange / Gold
  };

  public schema = [
    {
      key: "layer",
      label: "Particle Depth Layer",
      type: "select" as const,
      default: "front",
      options: [
        { label: "Behind Hero (Back Embers)", value: "back" },
        { label: "In Front of Hero (Foreground Flame)", value: "front" },
      ],
    },
    {
      key: "particleCount",
      label: "Ember Density",
      type: "number" as const,
      default: 55,
      min: 20,
      max: 120,
      step: 5,
    },
    {
      key: "baseSpeed",
      label: "Rising Speed Multiplier",
      type: "number" as const,
      default: 1.2,
      min: 0.4,
      max: 3.0,
      step: 0.2,
    },
    {
      key: "reactToKick",
      label: "Kick Transient Eruption",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "color",
      label: "Ember Flame Color",
      type: "color" as const,
      default: "#f97316",
    },
  ];

  private resetEmber(ember: Ember, width: number, height: number): void {
    ember.x = Math.random() * width;
    ember.y = height + Math.random() * 40;
    ember.size = 1.5 + Math.random() * 3.5;
    ember.speedY = (1.5 + Math.random() * 3.0) * this.options.baseSpeed;
    ember.speedX = (Math.random() - 0.5) * 1.5;
    ember.opacity = 0.4 + Math.random() * 0.6;
    ember.life = 0;
    ember.maxLife = 120 + Math.random() * 100;
    ember.hue = 25 + Math.random() * 25; // 25 (Orange-red) to 50 (Gold-yellow)
  }

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio } = frameCtx;
    this.order = this.options.layer === "back" ? 19 : 62;

    const count = this.options.particleCount;
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickSpeedBoost = isKick && this.options.reactToKick ? 2.5 : 1.0;

    // Initialize or resize pool
    while (this.embers.length < count) {
      const e: Ember = {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2,
        speedY: 2,
        speedX: 0,
        opacity: 0.8,
        life: Math.random() * 100,
        maxLife: 200,
        hue: 35,
      };
      this.resetEmber(e, width, height);
      e.y = Math.random() * height;
      this.embers.push(e);
    }
    if (this.embers.length > count) {
      this.embers.length = count;
    }

    ctx.save();

    for (let i = 0; i < this.embers.length; i++) {
      const e = this.embers[i];
      e.life++;
      e.y -= e.speedY * kickSpeedBoost;
      e.x += e.speedX + Math.sin(e.life * 0.05) * 0.8;

      const progress = e.life / e.maxLife;
      const alpha = Math.sin(progress * Math.PI) * e.opacity;

      if (e.y < -20 || e.life >= e.maxLife) {
        this.resetEmber(e, width, height);
        continue;
      }

      ctx.fillStyle = `hsl(${e.hue}, 95%, ${isKick ? "68%" : "55%"})`;
      ctx.shadowColor = `hsl(${e.hue}, 100%, 50%)`;
      ctx.shadowBlur = isKick ? 12 : 6;

      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size * (isKick ? 1.4 : 1.0), 0, Math.PI * 2);
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fill();
    }

    ctx.restore();
  }

  public clone(): FireEmbersEffect {
    const c = new FireEmbersEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    c.order = this.order;
    return c;
  }
}
