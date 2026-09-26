import { FrameContext, VideoEffect } from "../../types";

export class SideBarsVisualizerEffect implements VideoEffect {
  public id = "vis-side-bars";
  public name = "Customizable Side Bar Visualizer";
  public description = "Clean audio spectrum rectangular bars that can be placed on any side (left, right, bottom, top, or both sides), vertical or horizontal, with a single 20Hz to 20kHz set of bars, custom color, length, height, bar width, and gap.";
  public category = "visualizer" as const;
  public enabled = false;
  public order = 41;

  private smoothBarsLeft: number[] = [];
  private smoothBarsRight: number[] = [];

  public options = {
    side: "left" as "left" | "right" | "bottom" | "top" | "both-sides",
    direction: "inward" as "inward" | "outward",
    length: 0, // 0 for auto edge length
    maxHeight: 90,
    barCount: 40,
    barWidth: 6,
    barGap: 4,
    edgeOffset: 32,
    centerShift: 0,
    color: "#fbbf24",
    gradientTips: false,
    tipColor: "#ffffff",
    roundedCaps: false,
    glow: false,
    mirror: false,
    routing: "full" as
      | "full"
      | "subBass"
      | "bass"
      | "drums"
      | "snare"
      | "vocalMelody"
      | "hihats",
  };

  public schema = [
    {
      key: "side",
      label: "Screen Side Placement",
      type: "select" as const,
      default: "left",
      options: [
        { label: "Left Edge (Vertical)", value: "left" },
        { label: "Right Edge (Vertical)", value: "right" },
        { label: "Both Edges (Left & Right Sides)", value: "both-sides" },
        { label: "Bottom Edge (Horizontal)", value: "bottom" },
        { label: "Top Edge (Horizontal)", value: "top" },
      ],
    },
    {
      key: "direction",
      label: "Bar Growth Direction",
      type: "select" as const,
      default: "inward",
      options: [
        { label: "Inward (Pointing Toward Center)", value: "inward" },
        { label: "Outward (Pointing Toward Edge)", value: "outward" },
      ],
    },
    {
      key: "length",
      label: "Visualizer Total Length (0 = Full Edge)",
      type: "number" as const,
      default: 0,
      min: 0,
      max: 1920,
      step: 20,
    },
    {
      key: "maxHeight",
      label: "Max Bar Height / Amplitude (px)",
      type: "number" as const,
      default: 90,
      min: 15,
      max: 300,
      step: 5,
    },
    {
      key: "barCount",
      label: "Number of Bars",
      type: "number" as const,
      default: 40,
      min: 12,
      max: 96,
      step: 4,
    },
    {
      key: "barWidth",
      label: "Bar Width (px)",
      type: "number" as const,
      default: 6,
      min: 2,
      max: 20,
      step: 1,
    },
    {
      key: "barGap",
      label: "Bar Spacing (px)",
      type: "number" as const,
      default: 4,
      min: 1,
      max: 12,
      step: 1,
    },
    {
      key: "edgeOffset",
      label: "Distance from Edge (px)",
      type: "number" as const,
      default: 32,
      min: 0,
      max: 200,
      step: 4,
    },
    {
      key: "centerShift",
      label: "Center Shift Along Edge (px)",
      type: "number" as const,
      default: 0,
      min: -300,
      max: 300,
      step: 10,
    },
    {
      key: "color",
      label: "Bar Accent Color",
      type: "color" as const,
      default: "#fbbf24",
    },
    {
      key: "gradientTips",
      label: "Luminous Gradient Tips",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "tipColor",
      label: "Tip Highlight Color",
      type: "color" as const,
      default: "#ffffff",
    },
    {
      key: "roundedCaps",
      label: "Rounded Bar Caps",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "glow",
      label: "Luminescence Glow",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "mirror",
      label: "Symmetric Center Mirror",
      type: "boolean" as const,
      default: false,
    },
    {
      key: "routing",
      label: "Frequency & Instrument Routing",
      type: "select" as const,
      default: "full",
      options: [
        { label: "Full Spectrum (20Hz - 20,000Hz)", value: "full" },
        { label: "Sub-Bass Only (20Hz - 60Hz)", value: "subBass" },
        { label: "Bass & 808s (60Hz - 250Hz)", value: "bass" },
        { label: "Kick & Drum Punch", value: "drums" },
        { label: "Snare & Clap Snaps", value: "snare" },
        { label: "Vocal Melody & Leads (300Hz - 3.5kHz)", value: "vocalMelody" },
        { label: "Hi-Hats & Cymbals (6kHz - 20kHz)", value: "hihats" },
      ],
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, audio } = frameCtx;
    const count = this.options.barCount;

    if (this.smoothBarsLeft.length !== count) {
      this.smoothBarsLeft = new Array(count).fill(0);
    }
    if (this.smoothBarsRight.length !== count) {
      this.smoothBarsRight = new Array(count).fill(0);
    }

    const sidesToRender: Array<"left" | "right" | "bottom" | "top"> =
      this.options.side === "both-sides"
        ? ["left", "right"]
        : [this.options.side];

    for (const side of sidesToRender) {
      const smoothBuffer =
        side === "right" ? this.smoothBarsRight : this.smoothBarsLeft;
      this.renderSingleSide(ctx, side, width, height, audio, smoothBuffer);
    }
  }

  private renderSingleSide(
    ctx: CanvasRenderingContext2D,
    side: "left" | "right" | "bottom" | "top",
    width: number,
    height: number,
    audio: any,
    smoothBars: number[]
  ): void {
    const count = this.options.barCount;
    const isVertical = side === "left" || side === "right";
    const availableSpan = isVertical ? height : width;

    // Total length along the edge
    const spanLength =
      this.options.length > 0
        ? Math.min(this.options.length, availableSpan)
        : availableSpan * 0.72;

    let barW = this.options.barWidth;
    let gap = this.options.barGap;
    let totalBarsSpan = count * barW + (count - 1) * gap;

    if (this.options.length > 0 && totalBarsSpan > spanLength) {
      barW = Math.max(2, (spanLength / count) * 0.6);
      gap = Math.max(1, (spanLength - count * barW) / (count - 1));
      totalBarsSpan = count * barW + (count - 1) * gap;
    }

    // Center alignment along the edge
    const startCoord =
      availableSpan / 2 - totalBarsSpan / 2 + this.options.centerShift;

    // Edge baseline offset
    let baseline = 0;
    if (side === "left") {
      baseline = this.options.edgeOffset;
    } else if (side === "right") {
      baseline = width - this.options.edgeOffset;
    } else if (side === "bottom") {
      baseline = height - this.options.edgeOffset;
    } else if (side === "top") {
      baseline = this.options.edgeOffset;
    }

    ctx.save();

    if (this.options.glow) {
      ctx.shadowColor = this.options.color;
      ctx.shadowBlur = 10;
    } else {
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
    }

    const freq = audio.frequencyData;
    const adaptiveFft = audio.adaptiveFft;
    const half = count / 2;
    const minHz = 20;
    const maxHz = 20000;
    const totalBins = freq.length * 2; // 2048 FFT

    for (let i = 0; i < count; i++) {
      let rawVal = 0;

      // Extract value according to routing selection
      if (this.options.routing === "subBass") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : 1;
        rawVal = (audio.calibrated?.subBass ?? audio.subBass ?? 0) * (0.6 + factor * 0.4);
      } else if (this.options.routing === "bass") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : 1;
        rawVal = (audio.calibrated?.bass ?? audio.bass ?? 0) * (0.6 + factor * 0.4);
      } else if (this.options.routing === "drums") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : 1;
        rawVal = (audio.calibrated?.drums ?? audio.drums ?? 0) * (0.6 + factor * 0.4);
      } else if (this.options.routing === "snare") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : 1;
        rawVal = (audio.calibrated?.snare ?? audio.snare ?? 0) * (0.6 + factor * 0.4);
      } else if (this.options.routing === "vocalMelody") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : 1;
        rawVal = (audio.calibrated?.vocalMelody ?? audio.vocalMelody ?? 0) * (0.6 + factor * 0.4);
      } else if (this.options.routing === "hihats") {
        const factor = this.options.mirror ? 1 - Math.abs(i - half) / half : 1;
        rawVal = (audio.calibrated?.hihats ?? audio.hihats ?? 0) * (0.6 + factor * 0.4);
      } else {
        // True 20Hz - 20,000Hz continuous logarithmic spectrum
        if (this.options.mirror) {
          const distFromCenter = Math.abs(i - half + 0.5) / half;
          const hz = minHz * Math.pow(maxHz / minHz, distFromCenter);
          const binIdx = Math.min(freq.length - 1, Math.max(0, Math.round((hz / 44100) * totalBins)));
          rawVal = adaptiveFft && adaptiveFft[binIdx] !== undefined
            ? adaptiveFft[binIdx]
            : (freq[binIdx] || 0) / 255;
        } else {
          // Single continuous set of bars from 20Hz (bar 0) to 20,000Hz (last bar)
          const fracStart = count > 1 ? i / count : 0;
          const fracEnd = count > 1 ? (i + 1) / count : 1;
          const hzStart = minHz * Math.pow(maxHz / minHz, fracStart);
          const hzEnd = minHz * Math.pow(maxHz / minHz, fracEnd);
          const binStart = Math.max(0, Math.floor((hzStart / 44100) * totalBins));
          const binEnd = Math.min(freq.length - 1, Math.ceil((hzEnd / 44100) * totalBins));

          let peak = 0;
          for (let b = binStart; b <= binEnd; b++) {
            const v = adaptiveFft && adaptiveFft[b] !== undefined
              ? adaptiveFft[b]
              : (freq[b] || 0) / 255;
            if (v > peak) peak = v;
          }
          rawVal = peak;
        }
      }

      // Ballistic smoothing
      if (rawVal > smoothBars[i]) {
        smoothBars[i] = rawVal;
      } else {
        smoothBars[i] += (rawVal - smoothBars[i]) * 0.28;
      }

      const barAmplitude = Math.max(3, smoothBars[i] * this.options.maxHeight);

      // On vertical edges, anchor lowest frequencies (20Hz) at the bottom and high frequencies (20kHz) at the top
      const posAlongEdge = isVertical
        ? startCoord + (count - 1 - i) * (barW + gap)
        : startCoord + i * (barW + gap);

      // Determine bar rectangle coordinates based on side and inward/outward direction
      let rx = 0;
      let ry = 0;
      let rw = 0;
      let rh = 0;
      let gradStart = { x: 0, y: 0 };
      let gradEnd = { x: 0, y: 0 };

      if (isVertical) {
        // Vertical side: bar travels horizontally
        ry = posAlongEdge;
        rh = barW;
        rw = barAmplitude;

        if (side === "left") {
          if (this.options.direction === "inward") {
            rx = baseline;
            gradStart = { x: rx, y: ry };
            gradEnd = { x: rx + rw, y: ry };
          } else {
            rx = baseline - rw;
            gradStart = { x: baseline, y: ry };
            gradEnd = { x: rx, y: ry };
          }
        } else {
          // Right edge
          if (this.options.direction === "inward") {
            rx = baseline - rw;
            gradStart = { x: baseline, y: ry };
            gradEnd = { x: rx, y: ry };
          } else {
            rx = baseline;
            gradStart = { x: rx, y: ry };
            gradEnd = { x: rx + rw, y: ry };
          }
        }
      } else {
        // Horizontal side: bar travels vertically
        rx = posAlongEdge;
        rw = barW;
        rh = barAmplitude;

        if (side === "bottom") {
          if (this.options.direction === "inward") {
            ry = baseline - rh;
            gradStart = { x: rx, y: baseline };
            gradEnd = { x: rx, y: ry };
          } else {
            ry = baseline;
            gradStart = { x: rx, y: baseline };
            gradEnd = { x: rx, y: ry + rh };
          }
        } else {
          // Top edge
          if (this.options.direction === "inward") {
            ry = baseline;
            gradStart = { x: rx, y: baseline };
            gradEnd = { x: rx, y: ry + rh };
          } else {
            ry = baseline - rh;
            gradStart = { x: rx, y: baseline };
            gradEnd = { x: rx, y: ry };
          }
        }
      }

      // Bar fill (simple solid color or gradient tips if requested)
      if (this.options.gradientTips) {
        const grad = ctx.createLinearGradient(
          gradStart.x,
          gradStart.y,
          gradEnd.x,
          gradEnd.y
        );
        grad.addColorStop(0, this.options.color + "55");
        grad.addColorStop(0.5, this.options.color);
        grad.addColorStop(1, this.options.tipColor);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = this.options.color;
      }

      if (this.options.roundedCaps) {
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, Math.min(rw, rh) / 2);
        ctx.fill();
      } else {
        // Pure solid clean rectangle
        ctx.fillRect(rx, ry, rw, rh);
      }
    }

    ctx.restore();
  }

  public clone(): SideBarsVisualizerEffect {
    const c = new SideBarsVisualizerEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
