import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class FluidWaveEffect implements VideoEffect {
  public id = "vis-fluid-wave";
  public name = "Fluid Neon Wave Ribbon";
  public description = "Organic flowing Bezier spline audio waveform with neon glow and dynamic amplitude.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 42;

  public options = {
    wavePoints: 64,
    waveHeight: 65,
    glow: true,
    strokeColor: "#fbbf24",
    mirror: true,
  };

  public schema = [
    {
      key: "wavePoints",
      label: "Spline Detail Points",
      type: "number" as const,
      default: 64,
      min: 32,
      max: 128,
      step: 8,
    },
    {
      key: "waveHeight",
      label: "Wave Amplitude (px)",
      type: "number" as const,
      default: 65,
      min: 20,
      max: 140,
      step: 5,
    },
    {
      key: "strokeColor",
      label: "Neon Color",
      type: "color" as const,
      default: "#fbbf24",
    },
    {
      key: "mirror",
      label: "Symmetrical Mirror Ribbon",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "glow",
      label: "Neon Glow Bloom",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio } = frameCtx;
    const timeData = audio.timeData;

    // Scaled directly to the Dock Visualizer Grid Section
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const dock = GridSystem.getDockGeometry(width, height, aspectRatio, isVinylActive);

    const count = this.options.wavePoints;
    const totalW = dock.width;
    const startX = dock.cx - totalW / 2;
    const centerY = dock.cy;
    const stepX = totalW / (count - 1);
    const maxAmp = Math.min(this.options.waveHeight, dock.maxHeight * 0.45);

    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / count) * timeData.length);
      const amp = ((timeData[idx] - 128) / 128) * maxAmp * (1 + audio.bass * 0.35);
      points.push({
        x: startX + i * stepX,
        y: centerY + amp,
      });
    }

    ctx.save();

    if (this.options.glow) {
      ctx.shadowColor = this.options.strokeColor;
      ctx.shadowBlur = 16 + audio.subBass * 18;
    }

    // Top Wave Curve
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < count - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(
      points[count - 2].x,
      points[count - 2].y,
      points[count - 1].x,
      points[count - 1].y
    );

    ctx.strokeStyle = this.options.strokeColor;
    ctx.lineWidth = 3.0;
    ctx.lineCap = "round";
    ctx.stroke();

    // Mirrored bottom ribbon
    if (this.options.mirror) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, centerY - (points[0].y - centerY));

      for (let i = 1; i < count - 2; i++) {
        const y1 = centerY - (points[i].y - centerY);
        const y2 = centerY - (points[i + 1].y - centerY);
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (y1 + y2) / 2;
        ctx.quadraticCurveTo(points[i].x, y1, xc, yc);
      }
      ctx.quadraticCurveTo(
        points[count - 2].x,
        centerY - (points[count - 2].y - centerY),
        points[count - 1].x,
        centerY - (points[count - 1].y - centerY)
      );

      ctx.strokeStyle = this.options.strokeColor + "73"; // 45% opacity hex
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    ctx.restore();
  }

  public clone(): FluidWaveEffect {
    const c = new FluidWaveEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
