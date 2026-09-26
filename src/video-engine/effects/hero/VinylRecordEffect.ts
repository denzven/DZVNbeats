import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class VinylRecordEffect implements VideoEffect {
  public id = "hero-vinyl-deck";
  public name = "Vinyl Sleeve & Spinning Record";
  public description = "Cinematic 3-phase sleeve reveal, vinyl sliding out from inside the cardboard pocket, 33⅓ RPM spin, and tonearm needle drop.";
  public category = "hero" as const;
  public enabled = true;
  public order = 30; // Stage Hero layer

  public options = {
    introDuration: 2.8, // Duration of sleeve open + slide sequence in seconds
    rpmSpeed: 33.33,
    showTonearm: true,
    grooveGleam: true,
    forceOpened: false, // Override to always keep fully opened for testing
  };

  public schema = [
    {
      key: "introDuration",
      label: "Opening Intro Duration (s)",
      type: "number" as const,
      default: 2.8,
      min: 1.0,
      max: 6.0,
      step: 0.2,
    },
    {
      key: "rpmSpeed",
      label: "Rotation Speed (RPM)",
      type: "number" as const,
      default: 33.33,
      min: 16.0,
      max: 78.0,
      step: 1.0,
    },
    {
      key: "showTonearm",
      label: "Show Metallic Tonearm",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "grooveGleam",
      label: "Anisotropic Light Sheen",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "forceOpened",
      label: "Force Fully Opened",
      type: "boolean" as const,
      default: false,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { time, coverImage, beat, aspectRatio, audio, width, height } = frameCtx;
    const isLandscape = aspectRatio === "16:9";

    // 1. Unified Geometry from GridSystem
    const geom = GridSystem.getVinylGeometry(
      width,
      height,
      aspectRatio,
      time,
      this.options.introDuration,
      this.options.forceOpened
    );

    const {
      sleeveX,
      sleeveY,
      sleeveSize,
      vinylCenterX,
      vinylCenterY,
      vinylRadius,
      slideProgress,
      tonearmProgress,
    } = geom;

    // -------------------------------------------------------------
    // PASS 1: SLEEVE BACK POCKET (Interior Dark Lining)
    // -------------------------------------------------------------
    ctx.save();
    this.drawSleeveBack(ctx, sleeveX, sleeveY, sleeveSize, isLandscape);
    ctx.restore();

    // -------------------------------------------------------------
    // PASS 1.5: TURNTABLE PLATTER & PLINTH BED (Grounded beneath vinyl)
    // -------------------------------------------------------------
    if (isLandscape && slideProgress > 0.15) {
      ctx.save();
      this.drawTurntablePlatter(ctx, vinylCenterX, vinylCenterY, vinylRadius, slideProgress);
      ctx.restore();
    }

    // -------------------------------------------------------------
    // PASS 2: VINYL DISC (Emerging from between back & front sleeve)
    // -------------------------------------------------------------
    ctx.save();
    this.drawVinylDisc(
      ctx,
      vinylCenterX,
      vinylCenterY,
      vinylRadius,
      time,
      slideProgress,
      coverImage,
      audio
    );
    ctx.restore();

    // -------------------------------------------------------------
    // PASS 3: SLEEVE FRONT COVER (Covers pocket-side of vinyl)
    // -------------------------------------------------------------
    ctx.save();
    this.drawSleeveFront(
      ctx,
      sleeveX,
      sleeveY,
      sleeveSize,
      slideProgress,
      coverImage,
      beat,
      isLandscape
    );
    ctx.restore();

    // -------------------------------------------------------------
    // PASS 4: METALLIC TONEARM (Swing & Needle Drop on Plinth)
    // -------------------------------------------------------------
    if (this.options.showTonearm && isLandscape && slideProgress > 0.4) {
      ctx.save();
      this.drawTonearm(
        ctx,
        vinylCenterX,
        vinylCenterY,
        vinylRadius,
        tonearmProgress
      );
      ctx.restore();
    }
  }  /**
   * Sleeve Back: Dark interior lining with inner pocket cavity shadow
   */
  private drawSleeveBack(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    isLandscape: boolean
  ): void {
    const r = 14;

    // Outer shadow behind the entire sleeve
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetX = isLandscape ? 12 : 0;
    ctx.shadowOffsetY = isLandscape ? 22 : 18;

    ctx.beginPath();
    ctx.roundRect(x, y, size, size, r);
    ctx.fillStyle = "#121214";
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Inner pocket dark void (Right side for landscape, top side for vertical)
    let voidGrad: CanvasGradient;
    if (isLandscape) {
      voidGrad = ctx.createLinearGradient(x + size * 0.4, y, x + size, y);
    } else {
      voidGrad = ctx.createLinearGradient(x, y + size * 0.5, x, y);
    }
    voidGrad.addColorStop(0, "#0c0c0e");
    voidGrad.addColorStop(1, "#000000");
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, size - 12, size - 16, 8);
    ctx.fill();
  }

  /**
   * Turntable Platter: Grounded machined metal turntable platter bed underneath the vinyl disc
   */
  private drawTurntablePlatter(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    slideProgress: number
  ): void {
    const platterR = radius + 9;
    const alpha = Math.min(1.0, (slideProgress - 0.15) / 0.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Platter drop shadow onto turntable body/bed
    ctx.beginPath();
    ctx.arc(cx, cy + 12, platterR + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = 18;
    ctx.fill();
    ctx.shadowColor = "transparent";

    // 1. Brushed Aluminum Platter Beveled Rim
    const rimGrad = ctx.createRadialGradient(cx, cy, platterR - 8, cx, cy, platterR);
    rimGrad.addColorStop(0, "#27272a");
    rimGrad.addColorStop(0.5, "#52525b");
    rimGrad.addColorStop(0.8, "#a1a1aa");
    rimGrad.addColorStop(1, "#18181b");

    ctx.beginPath();
    ctx.arc(cx, cy, platterR, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // 2. High-precision Strobe Dots Ring (Iconic Technics / Hi-Fi Turntable aesthetic)
    const strobeCount = 72;
    const strobeR = platterR - 3.5;
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    for (let i = 0; i < strobeCount; i++) {
      const angle = (i * Math.PI * 2) / strobeCount;
      const sx = cx + Math.cos(angle) * strobeR;
      const sy = cy + Math.sin(angle) * strobeR;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Dark Matte Rubber Slipmat
    const matR = radius + 1;
    ctx.beginPath();
    ctx.arc(cx, cy, matR, 0, Math.PI * 2);
    ctx.fillStyle = "#141416";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Vinyl Disc: Glossy concentric micro-grooves, rotation, anisotropic sheen, center label
   */
  private drawVinylDisc(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    time: number,
    slideProgress: number,
    coverImage: HTMLImageElement | null,
    audio: any
  ): void {
    // Rotation starts slowly and accelerates as it slides out
    const revsPerSec = (this.options.rpmSpeed / 60) * Math.min(1.0, slideProgress * 1.2);
    const rotationAngle = (time * revsPerSec * Math.PI * 2) % (Math.PI * 2);

    // Audio-reactive speaker cone excursion on sub-bass
    const bassPulse = audio.subBass * 0.025 + audio.bass * 0.015;
    const r = radius * (1.0 + bassPulse);

    // Deep contact shadow underneath the vinyl onto turntable bed
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx + 8 * slideProgress, cy + 12 * slideProgress, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 + 0.35 * slideProgress})`;
    ctx.filter = "blur(18px)";
    ctx.fill();
    ctx.filter = "none";
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationAngle);

    // 1. Disc Rim & Outer Edge
    const rimGrad = ctx.createRadialGradient(0, 0, r * 0.94, 0, 0, r);
    rimGrad.addColorStop(0, "#27272a");
    rimGrad.addColorStop(0.6, "#18181b");
    rimGrad.addColorStop(1, "#09090b");

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // 2. Realistic Concentric Micro-Grooves
    const grooveStart = r * 0.44;
    const grooveEnd = r * 0.96;
    const numGrooves = 22;
    const step = (grooveEnd - grooveStart) / numGrooves;

    ctx.strokeStyle = "rgba(255, 255, 255, 0.038)";
    ctx.lineWidth = 1.2;

    for (let i = 0; i < numGrooves; i++) {
      const curR = grooveStart + i * step;
      ctx.beginPath();
      ctx.arc(0, 0, curR, 0, Math.PI * 2);
      ctx.stroke();

      // Occasional song track gap spacing
      if (i === 7 || i === 14) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(0, 0, curR + step * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.038)";
        ctx.lineWidth = 1.2;
      }
    }

    // 3. Anisotropic Specular Light Sheen (Two radial reflection cones)
    if (this.options.grooveGleam) {
      const sheenGrad = ctx.createLinearGradient(-r, -r, r, r);
      sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.09)");
      sheenGrad.addColorStop(0.5, "transparent");
      sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0.09)");

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r * 0.96, -Math.PI / 5, Math.PI / 5);
      ctx.lineTo(0, 0);
      ctx.arc(0, 0, r * 0.96, (4 * Math.PI) / 5, (6 * Math.PI) / 5);
      ctx.closePath();
      ctx.fillStyle = sheenGrad;
      ctx.fill();
      ctx.restore();
    }

    // 4. Center Label (Circular Beat Cover Art)
    const labelR = r * 0.38;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    ctx.clip();

    if (coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
      ctx.drawImage(coverImage, -labelR, -labelR, labelR * 2, labelR * 2);
    } else {
      const bgGrad = ctx.createLinearGradient(-labelR, -labelR, labelR, labelR);
      bgGrad.addColorStop(0, "#fbbf24");
      bgGrad.addColorStop(1, "#b45309");
      ctx.fillStyle = bgGrad;
      ctx.fill();
    }

    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Spindle Hole
    const holeR = labelR * 0.16;

    // Brass/gold spindle ring
    ctx.beginPath();
    ctx.arc(0, 0, holeR * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = "#eab308";
    ctx.fill();

    // Center cutout
    ctx.beginPath();
    ctx.arc(0, 0, holeR, 0, Math.PI * 2);
    ctx.fillStyle = "#09090b";
    ctx.fill();
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Sleeve Front Cover: Album Artwork Jacket with mouth opening slot
   */
  private drawSleeveFront(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    slideProgress: number,
    coverImage: HTMLImageElement | null,
    beat: any,
    isLandscape: boolean
  ): void {
    const r = 14;

    ctx.save();

    // Clip to sleeve jacket shape
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, r);
    ctx.clip();

    // Draw Album Cover Image
    if (coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
      ctx.drawImage(coverImage, x, y, size, size);
    } else {
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      grad.addColorStop(0, "#27272a");
      grad.addColorStop(1, "#09090b");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${Math.floor(size * 0.08)}px 'Outfit', Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(beat?.title?.toUpperCase() || "UNTITLED BEAT", x + size / 2, y + size / 2);
    }

    // Glossy cardboard sheen reflection
    const gloss = ctx.createLinearGradient(x, y, x + size * 0.8, y + size * 0.8);
    gloss.addColorStop(0, "rgba(255, 255, 255, 0.16)");
    gloss.addColorStop(0.35, "rgba(255, 255, 255, 0.03)");
    gloss.addColorStop(0.36, "transparent");
    gloss.addColorStop(1, "rgba(0, 0, 0, 0.35)");
    ctx.fillStyle = gloss;
    ctx.fill();

    if (isLandscape) {
      // Left spine edge binding highlight
      const spineGrad = ctx.createLinearGradient(x, y, x + 8, y);
      spineGrad.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      spineGrad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = spineGrad;
      ctx.fillRect(x, y, 7, size);

      // Right mouth opening slot shadow where vinyl slides out
      const mouthShadowW = 24;
      const mouthGrad = ctx.createLinearGradient(x + size - mouthShadowW, y, x + size, y);
      mouthGrad.addColorStop(0, "transparent");
      mouthGrad.addColorStop(1, `rgba(0, 0, 0, ${0.7 + 0.25 * (1 - slideProgress)})`);
      ctx.fillStyle = mouthGrad;
      ctx.fillRect(x + size - mouthShadowW, y, mouthShadowW, size);
    } else {
      // Vertical: Top mouth opening slot shadow where vinyl slides upward
      const mouthShadowH = 24;
      const mouthGrad = ctx.createLinearGradient(x, y + mouthShadowH, x, y);
      mouthGrad.addColorStop(0, "transparent");
      mouthGrad.addColorStop(1, `rgba(0, 0, 0, ${0.7 + 0.25 * (1 - slideProgress)})`);
      ctx.fillStyle = mouthGrad;
      ctx.fillRect(x, y, size, mouthShadowH);
    }

    ctx.restore();

    // Sleek border outline
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, r);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Metallic Tonearm: Realistic grounded turntable gimbal plinth, counterweight, S-curve arm, and needle drop
   */
  private drawTonearm(
    ctx: CanvasRenderingContext2D,
    vinylX: number,
    vinylY: number,
    vinylRadius: number,
    tonearmProgress: number
  ): void {
    // Rotation angle: rest position (-0.50 rad) -> active playback groove position (-0.18 rad)
    const restAngle = -0.50;
    const activeAngle = -0.18;
    const angle = restAngle + (activeAngle - restAngle) * tonearmProgress;

    // Needle height (drops down onto the groove at the end)
    const dropOffset = (1 - tonearmProgress) * 10;

    // Grounded turntable plinth pivot position
    const pivotX = vinylX + vinylRadius * 0.94;
    const pivotY = vinylY - vinylRadius * 0.68;

    ctx.save();

    // -------------------------------------------------------------
    // PASS 4A: GROUNDED TURNTABLE PLINTH BASE ISLAND (Static beneath arm)
    // -------------------------------------------------------------
    const plinthW = 76;
    const plinthH = 120;
    const plinthX = pivotX - 38;
    const plinthY = pivotY - 48;

    // Plinth shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 14;

    ctx.beginPath();
    ctx.roundRect(plinthX, plinthY, plinthW, plinthH, 16);
    const plinthGrad = ctx.createLinearGradient(plinthX, plinthY, plinthX + plinthW, plinthY + plinthH);
    plinthGrad.addColorStop(0, "#1f1f23");
    plinthGrad.addColorStop(0.5, "#141416");
    plinthGrad.addColorStop(1, "#0a0a0c");
    ctx.fillStyle = plinthGrad;
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Knurled height adjustment base ring
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#27272a";
    ctx.fill();
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Cueing lever (silver arm)
    ctx.beginPath();
    ctx.moveTo(pivotX - 16, pivotY + 12);
    ctx.lineTo(pivotX - 28, pivotY + (tonearmProgress > 0.8 ? 6 : -4));
    ctx.strokeStyle = "#a1a1aa";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // -------------------------------------------------------------
    // PASS 4B: ROTATING GIMBAL & S-CURVE TONEARM
    // -------------------------------------------------------------
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(angle);

    // 1. Brushed Aluminum Gimbal Pivot Ring
    const gimbalGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, 20);
    gimbalGrad.addColorStop(0, "#f4f4f5");
    gimbalGrad.addColorStop(0.4, "#a1a1aa");
    gimbalGrad.addColorStop(0.8, "#52525b");
    gimbalGrad.addColorStop(1, "#18181b");

    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fillStyle = gimbalGrad;
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Center pivot bearing
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Counterweight cylinder with gold calibration scale
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-8, -38, 16, 24);
    ctx.strokeStyle = "#a1a1aa";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -38, 16, 24);

    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(-8, -26, 16, 3);

    // 3. S-Curved Metallic Arm Tube with Polished Chrome Highlight
    const armLen = vinylRadius * 1.22;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      -10, armLen * 0.28,
      -34, armLen * 0.68,
      -56, armLen
    );
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 5.0;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;
    ctx.stroke();
    ctx.shadowColor = "transparent";

    // 4. Headshell & Cartridge
    ctx.save();
    ctx.translate(-56, armLen + dropOffset);
    ctx.rotate(0.36);

    // Headshell body
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.roundRect(-6, 0, 12, 26, 3);
    ctx.fill();
    ctx.strokeStyle = "#71717a";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Finger lift handle
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(14, 8);
    ctx.strokeStyle = "#d4d4d8";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();

    // Red Stylus LED Indicator (glows brightly when active on groove)
    ctx.fillStyle = tonearmProgress > 0.9 ? "#ef4444" : "#71717a";
    ctx.shadowColor = "#ef4444";
    ctx.shadowBlur = tonearmProgress > 0.9 ? 10 : 0;
    ctx.beginPath();
    ctx.arc(0, 26, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    ctx.restore();
    ctx.restore();
  }

  public clone(): VinylRecordEffect {
    const c = new VinylRecordEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
