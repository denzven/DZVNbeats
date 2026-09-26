import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class CassetteTapeEffect implements VideoEffect {
  public id = "hero-cassette-deck";
  public name = "Vintage Cassette Tape";
  public description = "Classic analog cassette tape with rotating spool gears, magnetic tape window, and handwritten beat label.";
  public category = "hero" as const;
  public enabled = false;
  public order = 32;

  private spoolRotation = 0;

  public options = {
    shellColor: "#1e1e24",
    accentColor: "#fbbf24",
    reactToKick: true,
    tapeSpeed: 1.0,
  };

  public schema = [
    {
      key: "shellColor",
      label: "Cassette Body Color",
      type: "color" as const,
      default: "#1e1e24",
    },
    {
      key: "accentColor",
      label: "Label Accent Color",
      type: "color" as const,
      default: "#fbbf24",
    },
    {
      key: "reactToKick",
      label: "Kick Bounce Dynamics",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "tapeSpeed",
      label: "Spool Rotation Speed",
      type: "number" as const,
      default: 1.0,
      min: 0.2,
      max: 3.0,
      step: 0.2,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, aspectRatio, audio, beat, coverImage } = frameCtx;
    const heroGeom = GridSystem.getHeroCardGeometry(width, height, aspectRatio, false);

    const isKick = audio.isKick || (audio.calibrated?.kickTransient ?? 0) > 0.6;
    const kickBounce = isKick && this.options.reactToKick ? 1.04 : 1.0;

    // Advance spool rotation
    this.spoolRotation += 0.03 * this.options.tapeSpeed;

    // Dimensions: standard cassette ratio ~1.58 : 1
    const tapeW = heroGeom.size * 1.35 * kickBounce;
    const tapeH = (tapeW / 1.58);
    const cx = heroGeom.cx;
    const cy = heroGeom.cy;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Heavy Outer Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = isKick ? 38 : 24;
    ctx.shadowOffsetY = 12;

    // 2. Plastic Outer Shell
    const halfW = tapeW / 2;
    const halfH = tapeH / 2;

    ctx.fillStyle = this.options.shellColor;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, tapeW, tapeH, 18);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";

    // Beveled Inner Inset
    ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-halfW + 10, -halfH + 10, tapeW - 20, tapeH - 20, 14);
    ctx.stroke();

    // 3. Cassette Sticker Label
    const labelW = tapeW * 0.84;
    const labelH = tapeH * 0.72;
    const labelX = -labelW / 2;
    const labelY = -halfH + tapeH * 0.12;

    ctx.fillStyle = "#f4f4f5";
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, labelW, labelH, 10);
    ctx.fill();

    // Top Brand Accent Stripe
    ctx.fillStyle = this.options.accentColor;
    ctx.beginPath();
    ctx.roundRect(labelX, labelY, labelW, 14, [10, 10, 0, 0]);
    ctx.fill();

    // Title & Producer on Label
    ctx.fillStyle = "#18181b";
    ctx.font = "900 16px 'Space Mono', monospace";
    ctx.textAlign = "left";
    const labelTitle = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    ctx.fillText(`SIDE A  •  ${labelTitle}`, labelX + 16, labelY + 36);

    ctx.font = "700 12px 'Space Mono', monospace";
    ctx.fillStyle = "#52525b";
    ctx.fillText("HIGH BIAS // DZVN-PROD", labelX + 16, labelY + 54);

    // Mini Cover Art Stamp on Right of Label
    if (coverImage) {
      const stampSize = 52;
      const stampX = labelX + labelW - stampSize - 14;
      const stampY = labelY + 22;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(stampX, stampY, stampSize, stampSize, 8);
      ctx.clip();
      ctx.drawImage(coverImage, stampX, stampY, stampSize, stampSize);
      ctx.restore();
    }

    // 4. Transparent Tape Window (Center Inset)
    const winW = tapeW * 0.52;
    const winH = tapeH * 0.36;
    const winX = -winW / 2;
    const winY = labelY + labelH * 0.52;

    ctx.fillStyle = "rgba(10, 10, 14, 0.95)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(winX, winY, winW, winH, 8);
    ctx.fill();
    ctx.stroke();

    // 5. Dual Rotating Spool Hubs
    const spoolDistance = winW * 0.32;
    const spoolRadius = winH * 0.36;

    const drawSpool = (sx: number, sy: number) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.spoolRotation);

      // Brown Magnetic Tape Pack
      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.arc(0, 0, spoolRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // White Center Cog
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, spoolRadius, 0, Math.PI * 2);
      ctx.fill();

      // Center Hollow
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.arc(0, 0, spoolRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // 6 Cog Teeth
      ctx.fillStyle = "#ffffff";
      for (let t = 0; t < 6; t++) {
        const ang = (t / 6) * Math.PI * 2;
        ctx.fillRect(
          Math.cos(ang) * (spoolRadius * 0.42) - 2.5,
          Math.sin(ang) * (spoolRadius * 0.42) - 2.5,
          5,
          5
        );
      }

      ctx.restore();
    };

    drawSpool(-spoolDistance, winY + winH / 2);
    drawSpool(spoolDistance, winY + winH / 2);

    // 6. Corner Screw Details
    const screwOffset = 14;
    const drawScrew = (x: number, y: number) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 2.5, y);
      ctx.lineTo(x + 2.5, y);
      ctx.stroke();
    };

    drawScrew(-halfW + screwOffset, -halfH + screwOffset);
    drawScrew(halfW - screwOffset, -halfH + screwOffset);
    drawScrew(-halfW + screwOffset, halfH - screwOffset);
    drawScrew(halfW - screwOffset, halfH - screwOffset);

    ctx.restore();
  }

  public clone(): CassetteTapeEffect {
    const c = new CassetteTapeEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
