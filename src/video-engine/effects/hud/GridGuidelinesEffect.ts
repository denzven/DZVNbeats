import { FrameContext, VideoEffect } from "../../types";

export class GridGuidelinesEffect implements VideoEffect {
  public id = "debug-grid-guides";
  public name = "Layered Grid & Composition Guides";
  public description = "Cinematic debugging layers: Rule of Thirds, Diagonals, 3-Part Composition Sections, Safe Bounds, and Component Alignment.";
  public category = "hud" as const;
  public enabled = false; // Off by default, toggled via studio Safe-Zones button or effect list
  public order = 95; // Top-most overlay for clear visual debugging

  public options = {
    showThirds: true,
    showDiagonals: true,
    showSections: true,
    showSafeBounds: true,
    showHeroStage: true,
    showHeroSlots: true,
    showDock: true,
    showCrosshair: true,
    showZoneLabels: true,
    guideOpacity: 0.85,
  };

  public schema = [
    {
      key: "showThirds",
      label: "Rule of Thirds & Power Points",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showDiagonals",
      label: "Cinematic Diagonals & Harmonic Armature",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showSections",
      label: "3-Part Composition Sections",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showSafeBounds",
      label: "Show Safe Bounds (Mobile Trims)",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showHeroStage",
      label: "Show Hero Stage Zone",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showHeroSlots",
      label: "Show Sleeve & Platter Slots",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showDock",
      label: "Show Visualizer Dock Zone",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showCrosshair",
      label: "Show Center Crosshair",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showZoneLabels",
      label: "Show High-Legibility Zone Badges",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "guideOpacity",
      label: "Guide Line Opacity",
      type: "number" as const,
      default: 0.85,
      min: 0.2,
      max: 1.0,
      step: 0.05,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { width, height, aspectRatio, grid } = frameCtx;
    const isLandscape = aspectRatio === "16:9";
    const op = this.options.guideOpacity;

    ctx.save();

    // ============================================================
    // LAYER 1: CINEMATIC DIAGONALS & HARMONIC ARMATURE
    // ============================================================
    if (this.options.showDiagonals) {
      ctx.lineWidth = 1.2;
      ctx.setLineDash([6, 8]);
      ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.25})`;

      // Major Baroque diagonal (top-left to bottom-right)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, height);
      // Major Sinister diagonal (bottom-left to top-right)
      ctx.moveTo(0, height);
      ctx.lineTo(width, 0);
      ctx.stroke();

      // Optical focal diamond connecting midpoints
      ctx.strokeStyle = `rgba(255, 255, 255, ${op * 0.18})`;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height / 2);
      ctx.lineTo(width / 2, height);
      ctx.lineTo(0, height / 2);
      ctx.closePath();
      ctx.stroke();
    }

    // ============================================================
    // LAYER 2: RULE OF THIRDS (3 PARTS) & POWER POINTS
    // ============================================================
    if (this.options.showThirds && grid.thirds) {
      const { x1, x2, y1, y2, powerPoints } = grid.thirds;

      // Thirds lines (Golden amber dashed)
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = `rgba(251, 191, 36, ${op * 0.7})`;

      ctx.beginPath();
      // Vertical Thirds
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, height);
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, height);
      // Horizontal Thirds
      ctx.moveTo(0, y1);
      ctx.lineTo(width, y1);
      ctx.moveTo(0, y2);
      ctx.lineTo(width, y2);
      ctx.stroke();

      // Power Point Golden Intersections
      ctx.setLineDash([]);
      for (const pt of powerPoints) {
        // Outer focal ring
        ctx.strokeStyle = `rgba(251, 191, 36, ${op * 0.95})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = `rgba(251, 191, 36, ${op})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        if (this.options.showZoneLabels) {
          this.drawBadge(ctx, pt.x + 18, pt.y + 4, pt.label, "#fbbf24");
        }
      }
    }

    // ============================================================
    // LAYER 3: 3-PART COMPOSITIONAL SECTIONS
    // ============================================================
    if (this.options.showSections && grid.sections) {
      ctx.lineWidth = 1.4;

      for (let i = 0; i < grid.sections.length; i++) {
        const sec = grid.sections[i];
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = `${sec.accentColor}${Math.round(op * 180).toString(16).padStart(2, "0")}`;
        ctx.strokeRect(sec.zone.x, sec.zone.y, sec.zone.w, sec.zone.h);

        if (this.options.showZoneLabels) {
          const badgeX = isLandscape
            ? sec.zone.x + 18
            : sec.zone.x + 24;
          const badgeY = isLandscape
            ? 34
            : sec.zone.y + 36;

          this.drawBadge(ctx, badgeX, badgeY, `${sec.name.toUpperCase()} • ${sec.role}`, sec.accentColor);
        }
      }
    }

    // ============================================================
    // LAYER 4: CENTER CROSSHAIRS & OPTICAL RETICLE
    // ============================================================
    if (this.options.showCrosshair) {
      const cx = width / 2;
      const cy = height / 2;

      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = `rgba(244, 63, 94, ${op * 0.55})`;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Center crosshair ring
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 63, 94, ${op * 0.85})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = `rgba(244, 63, 94, ${op})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      if (this.options.showZoneLabels) {
        this.drawBadge(ctx, cx + 28, cy - 8, `OPTICAL CENTER (${cx}, ${cy})`, "#f43f5e");
      }
    }

    // ============================================================
    // LAYER 5: SAFE BOUNDS (CYAN)
    // ============================================================
    if (this.options.showSafeBounds) {
      const sb = grid.safeBounds;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = `rgba(6, 182, 212, ${op})`;
      ctx.strokeRect(sb.x, sb.y, sb.w, sb.h);

      if (this.options.showZoneLabels) {
        const label = isLandscape
          ? `16:9 SAFE MARGIN (${Math.round(sb.w)}x${Math.round(sb.h)})`
          : `SHORTS / REELS SAFE MARGIN (${Math.round(sb.w)}x${Math.round(sb.h)})`;
        this.drawBadge(ctx, sb.x + 14, sb.y + 24, label, "#06b6d4");
      }
    }

    // ============================================================
    // LAYER 6: HERO STAGE & COMPONENT SLOTS
    // ============================================================
    if (this.options.showHeroStage) {
      const hs = grid.heroStage;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = `rgba(245, 158, 11, ${op * 0.75})`;
      ctx.strokeRect(hs.x, hs.y, hs.w, hs.h);

      if (this.options.showZoneLabels) {
        this.drawBadge(
          ctx,
          hs.x + 14,
          hs.y + 24,
          `HERO STAGE ZONE (${Math.round(hs.w)}x${Math.round(hs.h)})`,
          "#f59e0b"
        );
      }
    }

    if (this.options.showHeroSlots) {
      ctx.lineWidth = 1.4;
      ctx.setLineDash([]);

      if (isLandscape) {
        // Slot Left (Sleeve)
        ctx.strokeStyle = `rgba(245, 158, 11, ${op * 0.65})`;
        ctx.strokeRect(grid.slotLeft.x, grid.slotLeft.y, grid.slotLeft.w, grid.slotLeft.h);
        if (this.options.showZoneLabels) {
          this.drawBadge(ctx, grid.slotLeft.x + 12, grid.slotLeft.y + 24, `SLOT: SLEEVE JACKET`, "#f59e0b");
        }

        // Slot Center (Vinyl Disc / Active Card)
        ctx.strokeStyle = `rgba(234, 179, 8, ${op * 0.75})`;
        ctx.strokeRect(grid.slotCenter.x, grid.slotCenter.y, grid.slotCenter.w, grid.slotCenter.h);
        if (this.options.showZoneLabels) {
          this.drawBadge(ctx, grid.slotCenter.x + 12, grid.slotCenter.y + 24, `SLOT: VINYL PLATTER`, "#eab308");
        }

        // Slot Right (Tonearm)
        ctx.strokeStyle = `rgba(217, 119, 6, ${op * 0.6})`;
        ctx.strokeRect(grid.slotRight.x, grid.slotRight.y, grid.slotRight.w, grid.slotRight.h);
        if (this.options.showZoneLabels) {
          this.drawBadge(ctx, grid.slotRight.x + 12, grid.slotRight.y + 24, `SLOT: TONEARM PLINTH`, "#d97706");
        }
      } else {
        // Portrait Slot Center
        ctx.strokeStyle = `rgba(245, 158, 11, ${op * 0.75})`;
        ctx.strokeRect(grid.slotCenter.x, grid.slotCenter.y, grid.slotCenter.w, grid.slotCenter.h);
        if (this.options.showZoneLabels) {
          this.drawBadge(
            ctx,
            grid.slotCenter.x + 14,
            grid.slotCenter.y + 28,
            `HERO CARD (${Math.round(grid.slotCenter.w)}x${Math.round(grid.slotCenter.h)})`,
            "#f59e0b"
          );
        }
      }
    }

    // ============================================================
    // LAYER 7: DOCK VISUALIZER ZONE
    // ============================================================
    if (this.options.showDock) {
      const dk = grid.dock;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = `rgba(16, 185, 129, ${op})`;
      ctx.strokeRect(dk.x, dk.y, dk.w, dk.h);

      if (this.options.showZoneLabels) {
        this.drawBadge(
          ctx,
          dk.x + 14,
          dk.y + 22,
          `VISUALIZER DOCK (${Math.round(dk.w)}x${Math.round(dk.h)})`,
          "#10b981"
        );
      }
    }

    ctx.restore();
  }

  /**
   * High-Resolution, Large & Punchy Zone Badge
   * Scaled for 1080p and high-DPI displays so creators can easily read metrics.
   */
  private drawBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    text: string,
    accentColor: string
  ): void {
    ctx.save();
    ctx.font = "700 14px 'Space Mono', monospace";
    const textW = ctx.measureText(text).width;
    const padX = 12;
    const badgeW = textW + padX * 2 + 12;
    const badgeH = 26;

    ctx.fillStyle = "rgba(9, 9, 11, 0.92)";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x, y - 17, badgeW, badgeH, 6);
    ctx.fill();
    ctx.stroke();

    // Glowing Dot
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + 10, y - 4, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Text
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(text, x + 20, y);
    ctx.restore();
  }

  public clone(): GridGuidelinesEffect {
    const c = new GridGuidelinesEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
