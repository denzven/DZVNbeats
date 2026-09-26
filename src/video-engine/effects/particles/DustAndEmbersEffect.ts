import { FrameContext, VideoEffect } from "../../types";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  color: string;
}

export class DustAndEmbersEffect implements VideoEffect {
  public id: string;
  public name: string;
  public description: string;
  public category = "particles" as const;
  public enabled = true;
  public order: number;

  private particles: Particle[] = [];

  public options = {
    layer: "back" as "back" | "front",
    plane: "background" as "background" | "foreground",
    particleCount: 65,
    baseSpeed: 0.8,
    reactToKick: true,
    emberColor: "#fbbf24",
  };

  public schema = [
    {
      key: "layer",
      label: "Particle Depth Layer",
      type: "select" as const,
      default: "back",
      options: [
        { label: "Behind Hero (Background Bokeh)", value: "back" },
        { label: "In Front of Hero (Foreground Sparks)", value: "front" },
      ],
    },
    {
      key: "particleCount",
      label: "Particle Density",
      type: "number" as const,
      default: 65,
      min: 15,
      max: 200,
      step: 5,
    },
    {
      key: "baseSpeed",
      label: "Drift Speed",
      type: "number" as const,
      default: 0.8,
      min: 0.2,
      max: 3.0,
      step: 0.1,
    },
    {
      key: "reactToKick",
      label: "Kick Drum Spark Explosions",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "emberColor",
      label: "Particle Tint",
      type: "color" as const,
      default: "#fbbf24",
    },
  ];

  constructor(layer: "back" | "front" | "background" | "foreground" = "back") {
    const isBack = layer === "back" || layer === "background";
    this.options.layer = isBack ? "back" : "front";
    this.options.plane = isBack ? "background" : "foreground";

    if (isBack) {
      this.id = "part-bokeh-back";
      this.name = "Floating Dust & Bokeh";
      this.description = "Atmospheric bokeh discs and micro-dust drifting in 3D space.";
      this.order = 18; // Behind Hero
      this.options.particleCount = 50;
      this.options.baseSpeed = 0.5;
      this.options.reactToKick = false;
    } else {
      this.id = "part-sparks-fore";
      this.name = "Foreground Sparks & Dust";
      this.description = "Crisp foreground dust particles and explosive spark bursts on beat drops.";
      this.order = 60; // In front of Hero
      this.options.particleCount = 70;
      this.options.baseSpeed = 0.9;
      this.options.reactToKick = true;
    }
  }

  private initParticle(p: Particle, w: number, h: number, isBurst = false, burstX = 0, burstY = 0): void {
    const isBack = this.options.layer === "back" || this.options.plane === "background";

    if (isBurst) {
      p.x = burstX;
      p.y = burstY;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 8;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 1.5 + Math.random() * 3.5;
      p.maxAlpha = 0.8 + Math.random() * 0.2;
      p.alpha = p.maxAlpha;
      p.life = 0;
      p.maxLife = 30 + Math.random() * 40;
      p.color = this.options.emberColor;
      return;
    }

    p.x = Math.random() * w;
    p.y = Math.random() * h;
    const speed = (0.2 + Math.random() * 0.8) * this.options.baseSpeed;
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    p.vx = Math.cos(angle) * speed * 0.5;
    p.vy = Math.sin(angle) * speed;

    if (isBack) {
      p.size = 3 + Math.random() * 12; // Large soft bokeh discs
      p.maxAlpha = 0.15 + Math.random() * 0.35;
    } else {
      p.size = 1 + Math.random() * 2.5; // Fine crisp dust
      p.maxAlpha = 0.3 + Math.random() * 0.5;
    }

    p.alpha = 0;
    p.life = 0;
    p.maxLife = 180 + Math.random() * 240;
    p.color = this.options.emberColor;
  }

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio } = frameCtx;
    const isBack = this.options.layer === "back" || this.options.plane === "background";
    this.order = isBack ? 18 : 60;

    const count = this.options.particleCount;

    while (this.particles.length < count) {
      const p: Particle = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        alpha: 0,
        maxAlpha: 0,
        life: 0,
        maxLife: 0,
        color: this.options.emberColor,
      };
      this.initParticle(p, width, height);
      this.particles.push(p);
    }
    if (this.particles.length > count) {
      this.particles.length = count;
    }

    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    if (isKick && this.options.reactToKick && !isBack) {
      const burstCount = 10;
      const bx = width / 2 + (Math.random() - 0.5) * (width * 0.4);
      const by = height / 2 + (Math.random() - 0.5) * (height * 0.3);
      for (let i = 0; i < burstCount; i++) {
        const deadP = this.particles.find((p) => p.life >= p.maxLife);
        if (deadP) {
          this.initParticle(deadP, width, height, true, bx, by);
        }
      }
    }

    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life++;

      if (p.life >= p.maxLife || p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
        this.initParticle(p, width, height);
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;

      const progress = p.life / p.maxLife;
      if (progress < 0.2) {
        p.alpha = (progress / 0.2) * p.maxAlpha;
      } else if (progress > 0.8) {
        p.alpha = ((1 - progress) / 0.2) * p.maxAlpha;
      } else {
        p.alpha = p.maxAlpha;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (isBack) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = "transparent";
      }
    }

    ctx.restore();
  }

  public clone(): DustAndEmbersEffect {
    const c = new DustAndEmbersEffect(this.options.layer);
    c.enabled = this.enabled;
    c.options = { ...this.options };
    c.order = this.order;
    return c;
  }
}
