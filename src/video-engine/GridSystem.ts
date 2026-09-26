import { AspectRatio, CanvasGrid, GridSection, GridThirds, GridZone } from "./types";

export class GridSystem {
  /**
   * Compute safe-zones and layout slot coordinates for the active resolution and aspect ratio
   */
  public static computeGrid(
    width: number,
    height: number,
    aspectRatio: AspectRatio
  ): CanvasGrid {
    if (aspectRatio === "16:9") {
      return this.computeLandscapeGrid(width, height);
    } else {
      return this.computePortraitGrid(width, height);
    }
  }

  private static makeZone(x: number, y: number, w: number, h: number): GridZone {
    return {
      x,
      y,
      w,
      h,
      cx: x + w / 2,
      cy: y + h / 2,
    };
  }

  private static computeLandscapeGrid(width: number, height: number): CanvasGrid {
    // 16:9 (1920x1080 baseline)
    const marginX = width * 0.05;
    const availW = width - marginX * 2;

    // Rule of Thirds
    const x1 = width / 3; // 640px
    const x2 = (width * 2) / 3; // 1280px
    const y1 = height / 3; // 360px
    const y2 = (height * 2) / 3; // 720px

    const thirds: GridThirds = {
      x1,
      x2,
      y1,
      y2,
      powerPoints: [
        { x: x1, y: y1, label: "Top-Left Power Point (640, 360)" },
        { x: x2, y: y1, label: "Top-Right Power Point (1280, 360)" },
        { x: x1, y: y2, label: "Bottom-Left Power Point (640, 720)" },
        { x: x2, y: y2, label: "Bottom-Right Power Point (1280, 720)" },
      ],
    };

    // The 3 Compositional Sections (Columns)
    const sections: GridSection[] = [
      {
        id: "section-hero-left",
        name: "Part 1: Left Anchor (Album Sleeve)",
        role: "Album jacket base & pocket opening",
        zone: this.makeZone(0, 0, 700, height),
        accentColor: "#f59e0b",
      },
      {
        id: "section-center-spin",
        name: "Part 2: Center Platter (Rotation & Arm)",
        role: "Vinyl rotation, tonearm swing, and audio-reactive grooves",
        zone: this.makeZone(700, 0, 360, height),
        accentColor: "#eab308",
      },
      {
        id: "section-info-right",
        name: "Part 3: Right Stage (Typography & Dock)",
        role: "Cinematic track title, BPM/Key badges, and docked audio visualizer",
        zone: this.makeZone(1060, 0, width - 1060, height),
        accentColor: "#06b6d4",
      },
    ];

    const header = this.makeZone(marginX, height * 0.04, availW, height * 0.09);
    const heroStage = this.makeZone(marginX, height * 0.14, availW, height * 0.65);

    // Three hero slots inside the stage, balanced symmetrically without overlapping typography
    const slotSize = Math.min(heroStage.h * 0.82, 440);
    const sleeveX = heroStage.x + 124; // ~220px: anchored comfortably in left third

    // slotLeft: Sleeve jacket position
    const slotLeft = this.makeZone(
      sleeveX,
      heroStage.cy - slotSize / 2,
      slotSize,
      slotSize
    );

    // slotCenter: Vinyl record active spin position (~770px)
    const vinylCenterX = sleeveX + slotSize * 1.25;
    const slotCenter = this.makeZone(
      vinylCenterX - slotSize / 2,
      heroStage.cy - slotSize / 2,
      slotSize,
      slotSize
    );

    // slotRight: Tonearm plinth mount zone (~966px to 1004px)
    const vinylRadius = slotSize * 0.475;
    const pivotX = vinylCenterX + vinylRadius * 0.94;
    const pivotY = heroStage.cy - vinylRadius * 0.68;
    const slotRight = this.makeZone(
      pivotX - 38,
      pivotY - 48,
      76,
      120
    );

    const dock = this.makeZone(marginX, height * 0.81, availW, height * 0.15);
    const safeBounds = this.makeZone(
      width * 0.04,
      height * 0.04,
      width * 0.92,
      height * 0.92
    );

    return {
      aspectRatio: "16:9",
      width,
      height,
      thirds,
      sections,
      header,
      heroStage,
      slotLeft,
      slotCenter,
      slotRight,
      dock,
      safeBounds,
    };
  }

  private static computePortraitGrid(width: number, height: number): CanvasGrid {
    // 9:16 Shorts/Reels/TikTok (1080x1920 baseline)
    const marginX = width * 0.08;
    const safeW = width - marginX * 2; // 907px safe width centered at cx = 540px

    // Rule of Thirds (Stacked Tiers)
    const x1 = width / 3; // 360px
    const x2 = (width * 2) / 3; // 720px
    const y1 = height / 3; // 640px
    const y2 = (height * 2) / 3; // 1280px

    const thirds: GridThirds = {
      x1,
      x2,
      y1,
      y2,
      powerPoints: [
        { x: x1, y: y1, label: "Top-Left Power Point (360, 640)" },
        { x: x2, y: y1, label: "Top-Right Power Point (720, 640)" },
        { x: x1, y: y2, label: "Bottom-Left Power Point (360, 1280)" },
        { x: x2, y: y2, label: "Bottom-Right Power Point (720, 1280)" },
      ],
    };

    // The 3 Compositional Sections (Horizontal Tiers)
    const sections: GridSection[] = [
      {
        id: "section-top-header",
        name: "Tier 1: Top 1/3 (Brand & Ambient Glow)",
        role: "Brand capsule pill, upper aura glow, floating bokeh particles",
        zone: this.makeZone(0, 0, width, y1),
        accentColor: "#a855f7",
      },
      {
        id: "section-hero-stage",
        name: "Tier 2: Middle 1/3 (Hero Stage)",
        role: "Artwork card / turntable platter, centered squarely on optical focal point (540, 960)",
        zone: this.makeZone(0, y1, width, y2 - y1),
        accentColor: "#f59e0b",
      },
      {
        id: "section-bottom-info",
        name: "Tier 3: Bottom 1/3 (Dynamics & Info)",
        role: "Visualizer dock wave, punchy track typography, BPM badges, CTA pill",
        zone: this.makeZone(0, y2, width, height - y2),
        accentColor: "#10b981",
      },
    ];

    const header = this.makeZone(marginX, height * 0.08, safeW, height * 0.08);
    const heroStage = this.makeZone(marginX, y1 + (y2 - y1 - 600) / 2, safeW, 600);

    const slotSize = Math.min(safeW * 0.86, 540);
    const slotCenter = this.makeZone(
      width / 2 - slotSize / 2,
      height / 2 - slotSize / 2,
      slotSize,
      slotSize
    );
    const slotLeft = slotCenter;
    const slotRight = slotCenter;

    // Visualizer Dock located at top of Tier 3
    const dock = this.makeZone(marginX, y2 + 10, safeW, 110);

    // Safe bounds: covers safe interaction zone
    const safeBounds = this.makeZone(
      marginX,
      height * 0.07,
      safeW,
      height * 0.82
    );

    return {
      aspectRatio: "9:16",
      width,
      height,
      thirds,
      sections,
      header,
      heroStage,
      slotLeft,
      slotCenter,
      slotRight,
      dock,
      safeBounds,
    };
  }

  /**
   * Shared geometric calculation for vinyl sleeve, disc, and tonearm coordinates.
   * Guarantees 100% alignment between VinylRecordEffect and RadialHaloEffect across all aspect ratios.
   */
  public static getVinylGeometry(
    width: number,
    height: number,
    aspectRatio: AspectRatio,
    time: number,
    introDuration = 2.8,
    forceOpened = false
  ): {
    sleeveX: number;
    sleeveY: number;
    sleeveSize: number;
    vinylCenterX: number;
    vinylCenterY: number;
    vinylRadius: number;
    slideProgress: number;
    tonearmProgress: number;
    isLandscape: boolean;
  } {
    const isLandscape = aspectRatio === "16:9";
    const grid = this.computeGrid(width, height, aspectRatio);

    let introT = 1.0;
    if (!forceOpened) {
      introT = Math.min(1.0, Math.max(0.0, time / introDuration));
    }

    // Phase 1: Sleeve entry subtle scale
    const sleeveEntryT = Math.min(1.0, introT / 0.25);
    const sleeveScale = 0.94 + 0.06 * Math.sin((sleeveEntryT * Math.PI) / 2);

    // Phase 2: Vinyl Disc Slide Out (0.2 - 0.85 introT)
    let slideProgress = 0.0;
    if (forceOpened) {
      slideProgress = 1.0;
    } else if (introT > 0.2) {
      const rawSlide = Math.min(1.0, (introT - 0.2) / 0.65);
      slideProgress = 1 - Math.pow(1 - rawSlide, 3);
    }

    // Phase 3: Tonearm Swing & Drop (0.75 - 1.0 introT)
    let tonearmProgress = 0.0;
    if (forceOpened) {
      tonearmProgress = 1.0;
    } else if (introT > 0.75) {
      tonearmProgress = Math.min(1.0, (introT - 0.75) / 0.25);
    }

    if (isLandscape) {
      // 16:9: Sleeve on left, vinyl sliding out with realistic pocket overlap, leaving the right 45% clear for typography
      const sleeveSize = Math.min(grid.heroStage.h * 0.82, 440) * sleeveScale;
      const sleeveX = grid.heroStage.x + 124; // ~220px: anchored in left column
      const sleeveY = grid.heroStage.cy - sleeveSize / 2;

      const vinylRadius = sleeveSize * 0.475;
      const startVinylX = sleeveX + sleeveSize / 2; // completely inside sleeve
      const targetVinylX = sleeveX + sleeveSize * 1.25; // emerges smoothly into center (~770px)

      const vinylCenterX = startVinylX + (targetVinylX - startVinylX) * slideProgress;
      const vinylCenterY = sleeveY + sleeveSize / 2;

      return {
        sleeveX,
        sleeveY,
        sleeveSize,
        vinylCenterX,
        vinylCenterY,
        vinylRadius,
        slideProgress,
        tonearmProgress,
        isLandscape: true,
      };
    } else {
      // 9:16 Portrait: Centered horizontally at grid.heroStage.cx (540px)
      const sleeveSize = Math.min(grid.heroStage.w * 0.76, 520) * sleeveScale;
      const sleeveX = grid.heroStage.cx - sleeveSize / 2;
      const sleeveY = grid.heroStage.cy - sleeveSize * 0.32;

      const vinylRadius = sleeveSize * 0.46;
      const startVinylY = sleeveY + sleeveSize / 2;
      // In 9:16, vinyl slides upward from sleeve pocket
      const targetVinylY = sleeveY + sleeveSize / 2 - sleeveSize * 0.52;

      const vinylCenterX = grid.heroStage.cx;
      const vinylCenterY = startVinylY + (targetVinylY - startVinylY) * slideProgress;

      return {
        sleeveX,
        sleeveY,
        sleeveSize,
        vinylCenterX,
        vinylCenterY,
        vinylRadius,
        slideProgress,
        tonearmProgress,
        isLandscape: false,
      };
    }
  }

  /**
   * Hero Card Section: Scaled dimensions and alignment for ThumpingArtworkEffect & square hero elements.
   * Aligns with the vinyl sleeve when vinyl is present, or sits dead-center when standalone.
   */
  public static getHeroCardGeometry(
    width: number,
    height: number,
    aspectRatio: AspectRatio,
    isVinylActive = false
  ): {
    cx: number;
    cy: number;
    size: number;
    cornerRadius: number;
    isLandscape: boolean;
  } {
    const isLandscape = aspectRatio === "16:9";
    const grid = this.computeGrid(width, height, aspectRatio);

    if (isLandscape) {
      if (isVinylActive) {
        // Place on slotLeft so it matches the sleeve location
        const size = Math.min(grid.heroStage.h * 0.82, 440);
        const cx = grid.heroStage.x + 124 + size / 2;
        const cy = grid.heroStage.cy;
        return { cx, cy, size, cornerRadius: 18, isLandscape: true };
      } else {
        // Standalone hero card: Centered proudly on optical center cx (960px)
        const size = Math.min(grid.heroStage.h * 0.86, 520);
        return {
          cx: grid.heroStage.cx,
          cy: grid.heroStage.cy,
          size,
          cornerRadius: 24,
          isLandscape: true,
        };
      }
    } else {
      // 9:16 Portrait: Centered squarely at optical focal center (cx = 540, cy = 960) in Middle Tier 2
      const size = Math.min(grid.safeBounds.w * 0.62, 540);
      return {
        cx: width / 2,
        cy: height / 2,
        size,
        cornerRadius: 28,
        isLandscape: false,
      };
    }
  }

  /**
   * Dock Visualizer Section: Shared bounds and scaling contract for SpectrumBarsEffect and FluidWaveEffect.
   * Guarantees both visualizers occupy the exact same responsive area and baseline.
   */
  public static getDockGeometry(
    width: number,
    height: number,
    aspectRatio: AspectRatio,
    isVinylActive = false
  ): {
    cx: number;
    cy: number;
    width: number;
    height: number;
    maxHeight: number;
    isLandscape: boolean;
  } {
    const isLandscape = aspectRatio === "16:9";
    const grid = this.computeGrid(width, height, aspectRatio);

    if (isLandscape) {
      if (isVinylActive) {
        // Dock aligns neatly in the right column underneath the track typography in Part 3
        const dockLeft = 1080;
        const dockRight = grid.safeBounds.x + grid.safeBounds.w;
        const dockW = dockRight - dockLeft;
        return {
          cx: dockLeft + dockW / 2,
          cy: grid.dock.cy,
          width: dockW,
          height: grid.dock.h,
          maxHeight: Math.min(grid.dock.h * 0.78, 95),
          isLandscape: true,
        };
      } else {
        // Standalone: Spans symmetrically across the bottom dock
        const dockW = grid.dock.w * 0.86;
        return {
          cx: grid.dock.cx,
          cy: grid.dock.cy,
          width: dockW,
          height: grid.dock.h,
          maxHeight: Math.min(grid.dock.h * 0.78, 95),
          isLandscape: true,
        };
      }
    } else {
      // In 9:16, centered symmetrically at top of Tier 3
      return {
        cx: grid.dock.cx,
        cy: grid.dock.cy,
        width: grid.dock.w * 0.94,
        height: grid.dock.h,
        maxHeight: Math.min(grid.dock.h * 0.76, 85),
        isLandscape: false,
      };
    }
  }

  /**
   * Back-Aura Section: Unified halo positioning whether the hero is a Vinyl Record or Thumping Artwork.
   */
  public static getAuraGeometry(
    width: number,
    height: number,
    aspectRatio: AspectRatio,
    time: number,
    isVinylActive = false
  ): {
    cx: number;
    cy: number;
    baseRadius: number;
    isLandscape: boolean;
  } {
    const isLandscape = aspectRatio === "16:9";
    if (isVinylActive) {
      const vGeom = this.getVinylGeometry(width, height, aspectRatio, time);
      return {
        cx: vGeom.vinylCenterX,
        cy: vGeom.vinylCenterY,
        baseRadius: vGeom.vinylRadius,
        isLandscape,
      };
    } else {
      const hero = this.getHeroCardGeometry(width, height, aspectRatio, false);
      return {
        cx: hero.cx,
        cy: hero.cy,
        baseRadius: (hero.size / 2) * 1.05,
        isLandscape,
      };
    }
  }

  /**
   * Helper to draw safe-zone debug overlays for creator testing
   */
  public static drawDebugGrid(
    ctx: CanvasRenderingContext2D,
    grid: CanvasGrid
  ): void {
    ctx.save();
    ctx.lineWidth = 1.5;

    // 1. Diagonals (Subtle white dashed)
    ctx.setLineDash([4, 8]);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(grid.width, grid.height);
    ctx.moveTo(0, grid.height);
    ctx.lineTo(grid.width, 0);
    ctx.stroke();

    // 2. Rule of Thirds (Golden dashed lines + Power points)
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
    ctx.beginPath();
    // Vertical thirds
    ctx.moveTo(grid.thirds.x1, 0);
    ctx.lineTo(grid.thirds.x1, grid.height);
    ctx.moveTo(grid.thirds.x2, 0);
    ctx.lineTo(grid.thirds.x2, grid.height);
    // Horizontal thirds
    ctx.moveTo(0, grid.thirds.y1);
    ctx.lineTo(grid.width, grid.thirds.y1);
    ctx.moveTo(0, grid.thirds.y2);
    ctx.lineTo(grid.width, grid.thirds.y2);
    ctx.stroke();

    // Power point rings
    ctx.setLineDash([]);
    for (const pt of grid.thirds.powerPoints) {
      ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(251, 191, 36, 0.9)";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Safe bounds (cyan dashed)
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "rgba(6, 182, 212, 0.7)";
    ctx.strokeRect(grid.safeBounds.x, grid.safeBounds.y, grid.safeBounds.w, grid.safeBounds.h);

    // 4. Hero Stage & Slots (amber)
    ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
    ctx.strokeRect(grid.heroStage.x, grid.heroStage.y, grid.heroStage.w, grid.heroStage.h);
    ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    ctx.strokeRect(grid.slotLeft.x, grid.slotLeft.y, grid.slotLeft.w, grid.slotLeft.h);
    ctx.strokeRect(grid.slotCenter.x, grid.slotCenter.y, grid.slotCenter.w, grid.slotCenter.h);

    // 5. Dock (emerald)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.7)";
    ctx.strokeRect(grid.dock.x, grid.dock.y, grid.dock.w, grid.dock.h);

    ctx.restore();
  }
}
