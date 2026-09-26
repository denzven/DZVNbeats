import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class LedVuMeterEffect implements VideoEffect {
  public id = "vis-led-vu-meter";
  public name = "Segmented LED VU Console";
  public description = "Dual or multi-band analog studio console VU meter bars with discrete green, amber, and red LEDs plus floating peak-drop caps.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 46;

  private smoothLevels = [0, 0, 0, 0];
  private peakLevels = [0, 0, 0, 0];

  public options = {
    segmentCount: 20,
    showDbLabels: true,
    mode: "triband" as "triband" | "stereo",
    glow: true,
  };

  public schema = [
    {
      key: "segmentCount",
      label: "LED Segments per Bar",
      type: "number" as const,
      default: 20,
      min: 10,
      max: 32,
      step: 2,
    },
    {
      key: "mode",
      label: "Meter Configuration",
      type: "select" as const,
      default: "triband",
      options: [
        { label: "Tri-Band Studio (Lows / Mids / Highs)", value: "triband" },
        { label: "Stereo Master (L / R Channels)", value: "stereo" },
      ],
    },
    {
      key: "showDbLabels",
      label: "Show Decibel Markings",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "glow",
      label: "LED Luminescence Glow",
      type: "boolean" as const,
      default: true,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, width, height, aspectRatio } = frameCtx;
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const dock = GridSystem.getDockGeometry(width, height, aspectRatio, isVinylActive);

    const cal = audio.calibrated || {
      lows: audio.bass,
      mids: audio.mids,
      highs: audio.highs,
      kickTransient: audio.isKick ? 1 : 0,
    };

    // Determine target levels based on mode
    let targetLevels: number[];
    let labels: string[];

    if (this.options.mode === "stereo") {
      const left = Math.min(1, cal.lows * 0.7 + cal.mids * 0.4);
      const right = Math.min(1, cal.mids * 0.4 + cal.highs * 0.7);
      targetLevels = [left, right];
      labels = ["CH-L", "CH-R"];
    } else {
      targetLevels = [cal.lows, cal.mids, cal.highs];
      labels = ["LOWS 808", "MIDS CLAP", "HIGHS HAT"];
    }

    // Smooth physics
    for (let i = 0; i < targetLevels.length; i++) {
      const target = targetLevels[i];
      if (target > this.smoothLevels[i]) {
        this.smoothLevels[i] = target; // Instant ballistic attack
      } else {
        this.smoothLevels[i] += (target - this.smoothLevels[i]) * 0.15; // Smooth decay
      }

      if (this.smoothLevels[i] > this.peakLevels[i]) {
        this.peakLevels[i] = this.smoothLevels[i];
      } else {
        this.peakLevels[i] = Math.max(0, this.peakLevels[i] - 0.008); // Slow peak drop
      }
    }

    const barCount = targetLevels.length;
    const segCount = this.options.segmentCount;
    const totalW = Math.min(dock.width * 0.9, barCount * 140);
    const startX = dock.cx - totalW / 2;
    const columnW = totalW / barCount;
    const barW = Math.min(columnW * 0.65, 52);
    const barH = dock.maxHeight;
    const segGap = 3;
    const segH = Math.max(2, (barH - (segCount - 1) * segGap) / segCount);

    ctx.save();

    for (let i = 0; i < barCount; i++) {
      const colCenterX = startX + i * columnW + columnW / 2;
      const bx = colCenterX - barW / 2;
      const by = dock.cy + barH / 2; // bottom baseline

      const activeSegs = Math.round(this.smoothLevels[i] * segCount);
      const peakSeg = Math.min(segCount - 1, Math.round(this.peakLevels[i] * segCount));

      // Draw Segments
      for (let s = 0; s < segCount; s++) {
        const sy = by - (s + 1) * (segH + segGap);
        const isActive = s < activeSegs;
        const isPeak = s === peakSeg;

        // LED Color Coding:
        // Top 15% = Red Clip, Middle 25% = Amber Warning, Bottom 60% = Green Nominal
        const ratio = s / segCount;
        let onColor = "#10b981"; // Emerald
        let offColor = "rgba(16, 185, 129, 0.1)";

        if (ratio >= 0.85) {
          onColor = "#ef4444"; // Rose / Red
          offColor = "rgba(239, 68, 68, 0.12)";
        } else if (ratio >= 0.6) {
          onColor = "#f59e0b"; // Amber
          offColor = "rgba(245, 158, 11, 0.12)";
        }

        if (isActive) {
          ctx.fillStyle = onColor;
          if (this.options.glow) {
            ctx.shadowColor = onColor;
            ctx.shadowBlur = 6;
          }
        } else {
          ctx.fillStyle = offColor;
          ctx.shadowColor = "transparent";
        }

        ctx.beginPath();
        ctx.roundRect(bx, sy, barW, segH, 2);
        ctx.fill();

        // Draw Peak hold marker
        if (isPeak && !isActive) {
          ctx.fillStyle = onColor;
          ctx.shadowColor = onColor;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(bx, sy, barW, segH, 2);
          ctx.fill();
        }
      }

      ctx.shadowColor = "transparent";

      // Column Label Below
      if (this.options.showDbLabels) {
        ctx.font = "700 11px 'Space Mono', monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.textAlign = "center";
        ctx.fillText(labels[i], colCenterX, by + 18);
      }
    }

    ctx.restore();
  }

  public clone(): LedVuMeterEffect {
    const c = new LedVuMeterEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
