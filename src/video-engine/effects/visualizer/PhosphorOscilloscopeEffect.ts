import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class PhosphorOscilloscopeEffect implements VideoEffect {
  public id = "vis-neon-oscilloscope";
  public name = "Retro CRT Oscilloscope";
  public description = "Vector electron beam tracing real-time audio time-domain waveforms with glowing phosphor persistence.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 47;

  public options = {
    color: "#06b6d4",
    beamThickness: 2.5,
    glowIntensity: 1.2,
    amplitude: 1.0,
    showCenterLine: true,
  };

  public schema = [
    {
      key: "color",
      label: "Phosphor Beam Color",
      type: "color" as const,
      default: "#06b6d4",
    },
    {
      key: "amplitude",
      label: "Wave Amplitude Multiplier",
      type: "number" as const,
      default: 1.0,
      min: 0.3,
      max: 2.5,
      step: 0.1,
    },
    {
      key: "beamThickness",
      label: "Electron Beam Width",
      type: "number" as const,
      default: 2.5,
      min: 1.0,
      max: 6.0,
      step: 0.5,
    },
    {
      key: "glowIntensity",
      label: "Phosphor Bloom Strength",
      type: "number" as const,
      default: 1.2,
      min: 0.2,
      max: 2.5,
      step: 0.1,
    },
    {
      key: "showCenterLine",
      label: "Show Center Reticle Line",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio } = frameCtx;
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const dock = GridSystem.getDockGeometry(width, height, aspectRatio, isVinylActive);

    const timeData = audio.timeData;
    if (!timeData || timeData.length === 0) return;

    const dockW = dock.width;
    const dockH = dock.maxHeight;
    const startX = dock.cx - dockW / 2;
    const centerY = dock.cy;

    ctx.save();

    // 1. Subtle Center Reference Reticle
    if (this.options.showCenterLine) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, centerY);
      ctx.lineTo(startX + dockW, centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 2. Build Waveform Path from timeData
    const sliceCount = Math.min(timeData.length, 256);
    const step = dockW / (sliceCount - 1);
    const amp = (dockH / 2) * this.options.amplitude * 0.9;

    ctx.beginPath();
    for (let i = 0; i < sliceCount; i++) {
      const idx = Math.floor((i / sliceCount) * timeData.length);
      // Normalized from uint8 0..255 to -1.0..+1.0
      const v = (timeData[idx] - 128) / 128;
      const x = startX + i * step;
      const y = centerY + v * amp;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    // 3. Multi-Pass CRT Glow:
    // Pass A: Wide outer phosphor bloom
    ctx.shadowColor = this.options.color;
    ctx.shadowBlur = 18 * this.options.glowIntensity;
    ctx.strokeStyle = this.options.color;
    ctx.lineWidth = this.options.beamThickness * 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = 0.45;
    ctx.stroke();

    // Pass B: Intense neon core
    ctx.shadowBlur = 8 * this.options.glowIntensity;
    ctx.lineWidth = this.options.beamThickness;
    ctx.globalAlpha = 0.9;
    ctx.stroke();

    // Pass C: Hot white electron center ray
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, this.options.beamThickness * 0.45);
    ctx.globalAlpha = 0.85;
    ctx.stroke();

    ctx.restore();
  }

  public clone(): PhosphorOscilloscopeEffect {
    const c = new PhosphorOscilloscopeEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
