import { FrameContext, VideoEffect } from "../../types";

interface GradientNode {
  baseX: number;
  baseY: number;
  radius: number;
  phase: number;
  speed: number;
  colorKey: "dominant" | "accent" | "secondary" | "dark" | "light";
}

export class MeshGradientEffect implements VideoEffect {
  public id = "bg-mesh-gradient";
  public name = "Fluid Mesh Gradient";
  public description = "Multi-point organic morphing mesh gradient that flows ambiently and pulses to audio kicks.";
  public category = "background" as const;
  public enabled = false;
  public order = 8;

  private nodes: GradientNode[] = [
    { baseX: 0.2, baseY: 0.25, radius: 0.55, phase: 0.0, speed: 0.5, colorKey: "dominant" },
    { baseX: 0.8, baseY: 0.3, radius: 0.6, phase: 1.8, speed: 0.42, colorKey: "accent" },
    { baseX: 0.35, baseY: 0.75, radius: 0.65, phase: 3.2, speed: 0.48, colorKey: "secondary" },
    { baseX: 0.75, baseY: 0.8, radius: 0.5, phase: 4.5, speed: 0.55, colorKey: "dark" },
  ];

  public options = {
    speed: 0.8,
    darken: 0.35, // 0.0 (vibrant) to 0.8 (moody dark)
    reactToKick: true,
    customAccent: "#fbbf24",
  };

  public schema = [
    {
      key: "speed",
      label: "Flow Velocity",
      type: "number" as const,
      default: 0.8,
      min: 0.2,
      max: 2.5,
      step: 0.1,
    },
    {
      key: "darken",
      label: "Background Shadow Depth",
      type: "number" as const,
      default: 0.35,
      min: 0.0,
      max: 0.8,
      step: 0.05,
    },
    {
      key: "reactToKick",
      label: "Kick Pulse Dynamic",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "customAccent",
      label: "Accent Node Tint",
      type: "color" as const,
      default: "#fbbf24",
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio, time } = frameCtx;
    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickBoost = isKick && this.options.reactToKick ? 1.25 : 1.0;

    // Palette fallback mapping
    const pal = (frameCtx as any).palette || {
      dominant: "#312e81",
      accent: this.options.customAccent,
      secondary: "#4338ca",
      dark: "#0f172a",
      light: "#6366f1",
    };

    ctx.save();

    // Base background fill
    ctx.fillStyle = pal.dark || "#0a0a0f";
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = "screen";

    const maxDim = Math.max(width, height);

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      const t = time * this.options.speed * node.speed;
      const ox = Math.sin(t + node.phase) * 0.18;
      const oy = Math.cos(t * 0.8 + node.phase) * 0.18;

      const cx = (node.baseX + ox) * width;
      const cy = (node.baseY + oy) * height;
      const r = node.radius * maxDim * kickBoost;

      let color = pal[node.colorKey] || this.options.customAccent;
      if (node.colorKey === "accent" && this.options.customAccent) {
        color = this.options.customAccent;
      }

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, color);
      grad.addColorStop(0.45, color);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.65;
      ctx.fillRect(0, 0, width, height);
    }

    // Vignette / Shadow Overlay
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(5, 5, 8, ${this.options.darken})`;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  public clone(): MeshGradientEffect {
    const c = new MeshGradientEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
