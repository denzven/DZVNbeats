import { FrameContext, VideoEffect } from "../../types";

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
}

export class CyberGridBackgroundEffect implements VideoEffect {
  public id = "bg-cyber-grid";
  public name = "Cyber Techno Grid Backdrop";
  public description = "Full-screen techno grid background with twinkling space particles and audio-reactive scanline sweeps.";
  public category = "background" as const;
  public enabled = false;
  public order = 11;

  private stars: Star[] = [];

  public options = {
    gridColor: "#06b6d4", // Neon Cyan
    gridSpacing: 80,
    starCount: 60,
    reactToKick: true,
  };

  public schema = [
    {
      key: "gridColor",
      label: "Grid Wireframe Color",
      type: "color" as const,
      default: "#06b6d4",
    },
    {
      key: "gridSpacing",
      label: "Grid Cell Size (px)",
      type: "number" as const,
      default: 80,
      min: 40,
      max: 160,
      step: 10,
    },
    {
      key: "starCount",
      label: "Twinkling Star Density",
      type: "number" as const,
      default: 60,
      min: 20,
      max: 150,
      step: 10,
    },
    {
      key: "reactToKick",
      label: "Kick Pulse Scanline",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio, time } = frameCtx;
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;

    // Initialize stars once
    if (this.stars.length !== this.options.starCount) {
      this.stars = [];
      for (let i = 0; i < this.options.starCount; i++) {
        this.stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: 1 + Math.random() * 2,
          alpha: 0.3 + Math.random() * 0.7,
          twinkleSpeed: 1 + Math.random() * 3,
        });
      }
    }

    ctx.save();

    // Deep Black Canvas
    ctx.fillStyle = "#07070b";
    ctx.fillRect(0, 0, width, height);

    // 1. Twinkling Deep Stars
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const tw = Math.sin(time * s.twinkleSpeed) * 0.3 + 0.7;
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = Math.max(0, Math.min(1, s.alpha * tw * (isKick ? 1.4 : 1.0)));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Subtle Techno Grid Lines
    const spacing = this.options.gridSpacing;
    ctx.strokeStyle = this.options.gridColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = isKick && this.options.reactToKick ? 0.22 : 0.12;

    ctx.beginPath();
    for (let x = 0; x <= width; x += spacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += spacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 3. Audio Scanline Sweep
    const sweepY = (time * 140) % height;
    const sweepGrad = ctx.createLinearGradient(0, sweepY - 40, 0, sweepY + 40);
    sweepGrad.addColorStop(0, "transparent");
    sweepGrad.addColorStop(0.5, this.options.gridColor);
    sweepGrad.addColorStop(1, "transparent");

    ctx.fillStyle = sweepGrad;
    ctx.globalAlpha = isKick ? 0.35 : 0.18;
    ctx.fillRect(0, sweepY - 40, width, 80);

    ctx.restore();
  }

  public clone(): CyberGridBackgroundEffect {
    const c = new CyberGridBackgroundEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
