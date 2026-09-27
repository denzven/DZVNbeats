import { FrameContext, VideoEffect } from "../../types";

export class TrackInfoEffect implements VideoEffect {
  public id = "hud-track-info";
  public name = "Track Typography & HUD";
  public description =
    "Modular beat info and metadata arrangement engine with multiple layout styles (Classic Vinyl, Lower-Third, Spotify Card, Cyber HUD, Billboard, Minimal Dock, Corner Stamp).";
  public category = "hud" as const;
  public enabled = true;
  public order = 70;

  public options = {
    layoutStyle: "classic" as
      | "classic"
      | "lower-third"
      | "spotify-pill"
      | "tech-hud"
      | "billboard"
      | "minimal-dock"
      | "corner-stamp",
    producerCredit: "PROD. BY DZVN",
    showBpmKey: true,
    showTimer: true,
    showAudioSpecs: true,
    showSocialWatermark: true,
    socialWatermarkText: "✦ DZVNBEATS.COM ✦",
    badgeStyle: "glass" as "glass" | "solid" | "outline",
    accentColor: "#fbbf24",
    titleFont: "outfit" as "outfit" | "jakarta" | "mono",
  };

  public schema = [
    {
      key: "layoutStyle",
      label: "Beat Info Arrangement Style",
      type: "select" as const,
      default: "classic",
      options: [
        { label: "Classic Vinyl Stage (Header & Flank)", value: "classic" },
        { label: "Modern Lower-Third (Broadcast Card)", value: "lower-third" },
        { label: "Spotify Glass Widget (Now-Playing Pill)", value: "spotify-pill" },
        { label: "Cyberpunk Tech HUD (Telemetry & Brackets)", value: "tech-hud" },
        { label: "Centered Billboard (Cinematic Poster)", value: "billboard" },
        { label: "Minimalist Dock Bar (Single-Line Strip)", value: "minimal-dock" },
        { label: "Editorial Corner Stamp (Catalog Badge)", value: "corner-stamp" },
      ],
    },
    {
      key: "producerCredit",
      label: "Producer Tagline",
      type: "select" as const,
      default: "PROD. BY DZVN",
      options: [
        { label: "PROD. BY DZVN", value: "PROD. BY DZVN" },
        { label: "DZVN BEATS EXCLUSIVE", value: "DZVN BEATS EXCLUSIVE" },
        { label: "PROD. DZVN", value: "PROD. DZVN" },
        { label: "FREE FOR NON-PROFIT", value: "FREE FOR NON-PROFIT" },
        { label: "BEATS BY DZVN", value: "BEATS BY DZVN" },
        { label: "DZVNBEATS.COM", value: "DZVNBEATS.COM" },
      ],
    },
    {
      key: "titleFont",
      label: "Typography Style",
      type: "select" as const,
      default: "outfit",
      options: [
        { label: "Outfit Display (Bold & Punchy)", value: "outfit" },
        { label: "Plus Jakarta (Clean Geometric)", value: "jakarta" },
        { label: "Space Mono (Technical / Modern)", value: "mono" },
      ],
    },
    {
      key: "badgeStyle",
      label: "Metadata Badges Style",
      type: "select" as const,
      default: "glass",
      options: [
        { label: "Glassmorphic Frosted Pill", value: "glass" },
        { label: "Solid Contrast Pill", value: "solid" },
        { label: "Minimal Wireframe Outline", value: "outline" },
      ],
    },
    {
      key: "showBpmKey",
      label: "Show BPM & Key Badge",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showTimer",
      label: "Show Timestamp & Progress",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showAudioSpecs",
      label: "Show Hi-Res Audio Specs Badge",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "showSocialWatermark",
      label: "Show Social / Web Watermark",
      type: "boolean" as const,
      default: true,
    },
    {
      key: "accentColor",
      label: "Accent Color",
      type: "color" as const,
      default: "#fbbf24",
    },
  ];

  private getTitleFontFamily(): string {
    switch (this.options.titleFont) {
      case "jakarta":
        return "'Plus Jakarta Sans', sans-serif";
      case "mono":
        return "'Space Mono', monospace";
      case "outfit":
      default:
        return "'Outfit', 'Plus Jakarta Sans', sans-serif";
    }
  }

  /**
   * Robust text truncation ensuring text strictly stays within maxWidth
   */
  private truncateToWidth(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    addEllipsis = true,
    forceEllipsis = false
  ): string {
    const ellipsis = addEllipsis ? "..." : "";
    const ellW = addEllipsis ? ctx.measureText("...").width : 0;
    const availW = Math.max(0, maxWidth - ellW);

    if (!forceEllipsis && ctx.measureText(text).width <= maxWidth) {
      return text;
    }

    let low = 0;
    let high = text.length;
    let best = "";

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const sub = text.slice(0, mid).trim();
      if (ctx.measureText(sub).width <= availW) {
        best = sub;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return (best || text.slice(0, 1)) + ellipsis;
  }

  /**
   * Robust multi-line text wrapping that guarantees bounds enforcement and ellipsis on overflow
   */
  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines = 2
  ): string[] {
    if (!text) return [""];
    const words = text.trim().split(/\s+/);
    if (words.length === 0) return [""];

    const lines: string[] = [];
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (!currentLine) {
          currentLine = this.truncateToWidth(ctx, word, maxWidth, true, false);
          lines.push(currentLine);
          currentLine = "";
        } else {
          lines.push(currentLine);
          if (lines.length === maxLines) {
            break;
          }
          currentLine = word;
        }
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    // Ensure last line doesn't overflow maxWidth and adds ellipsis if more words exist
    if (lines.length > 0) {
      const lastIdx = lines.length - 1;
      const lastLine = lines[lastIdx];
      const wordsRendered = lines.reduce(
        (acc, l) => acc + l.replace(/\.\.\.$/, "").trim().split(/\s+/).filter(Boolean).length,
        0
      );
      const hasMoreWords = wordsRendered < words.length;

      if (ctx.measureText(lastLine).width > maxWidth) {
        lines[lastIdx] = this.truncateToWidth(ctx, lastLine, maxWidth, true, false);
      } else if (hasMoreWords && lines.length === maxLines) {
        lines[lastIdx] = this.truncateToWidth(ctx, lastLine, maxWidth, true, true);
      }
    }

    return lines.slice(0, maxLines);
  }

  /**
   * Unified tactile badge renderer supporting Glass, Solid, and Wireframe Outline styles
   */
  private drawBadge(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    text: string,
    isPrimary: boolean,
    accentColor: string
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);

    switch (this.options.badgeStyle) {
      case "solid":
        ctx.fillStyle = isPrimary ? accentColor : "rgba(28, 28, 35, 0.95)";
        ctx.strokeStyle = isPrimary ? accentColor : "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isPrimary ? "#09090b" : "#f4f4f5";
        break;

      case "outline":
        ctx.fillStyle = "rgba(10, 10, 14, 0.4)";
        ctx.strokeStyle = isPrimary ? accentColor : "rgba(255, 255, 255, 0.38)";
        ctx.lineWidth = 1.6;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isPrimary ? accentColor : "#ffffff";
        break;

      case "glass":
      default:
        ctx.fillStyle = isPrimary ? "rgba(32, 32, 40, 0.88)" : "rgba(18, 18, 22, 0.76)";
        ctx.strokeStyle = isPrimary ? accentColor : "rgba(255, 255, 255, 0.22)";
        ctx.lineWidth = 1.4;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isPrimary ? accentColor : "#f4f4f5";
        break;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + w / 2, y + h / 2 + 1);
    ctx.restore();
  }

  /**
   * Fallback thumbnail generator to prevent blank black boxes when coverImage is loading
   */
  private drawCoverThumbnail(
    ctx: CanvasRenderingContext2D,
    coverImage: HTMLImageElement | null,
    x: number,
    y: number,
    size: number,
    radius: number,
    accentColor: string
  ): void {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.clip();

    if (coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
      ctx.drawImage(coverImage, x, y, size, size);
    } else {
      const grad = ctx.createLinearGradient(x, y, x + size, y + size);
      grad.addColorStop(0, "#272733");
      grad.addColorStop(1, "#111116");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, size, size);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, radius);
    ctx.stroke();
  }

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { aspectRatio } = frameCtx;
    const isLandscape = aspectRatio === "16:9";

    ctx.save();

    switch (this.options.layoutStyle) {
      case "lower-third":
        if (isLandscape) {
          this.renderLowerThirdLandscape(ctx, frameCtx);
        } else {
          this.renderLowerThirdPortrait(ctx, frameCtx);
        }
        break;

      case "spotify-pill":
        if (isLandscape) {
          this.renderSpotifyPillLandscape(ctx, frameCtx);
        } else {
          this.renderSpotifyPillPortrait(ctx, frameCtx);
        }
        break;

      case "tech-hud":
        if (isLandscape) {
          this.renderTechHudLandscape(ctx, frameCtx);
        } else {
          this.renderTechHudPortrait(ctx, frameCtx);
        }
        break;

      case "billboard":
        if (isLandscape) {
          this.renderBillboardLandscape(ctx, frameCtx);
        } else {
          this.renderBillboardPortrait(ctx, frameCtx);
        }
        break;

      case "minimal-dock":
        if (isLandscape) {
          this.renderMinimalDockLandscape(ctx, frameCtx);
        } else {
          this.renderMinimalDockPortrait(ctx, frameCtx);
        }
        break;

      case "corner-stamp":
        if (isLandscape) {
          this.renderCornerStampLandscape(ctx, frameCtx);
        } else {
          this.renderCornerStampPortrait(ctx, frameCtx);
        }
        break;

      case "classic":
      default:
        if (isLandscape) {
          this.renderClassicLandscape(ctx, frameCtx);
        } else {
          this.renderClassicPortrait(ctx, frameCtx);
        }
        break;
    }

    ctx.restore();
  }

  // =========================================================================
  // 1. CLASSIC VINYL STAGE ARRANGEMENT
  // =========================================================================
  private renderClassicLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();
    const headerZone = grid.header;
    const hasHero =
      frameCtx.activeEffects?.some((id) => id.startsWith("hero-")) ?? false;

    // 1. Top Left Header: Producer Tag Capsule
    const pillW = 240;
    const pillH = 42;
    ctx.fillStyle = "rgba(18, 18, 20, 0.88)";
    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(headerZone.x, headerZone.y + 6, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.options.accentColor;
    ctx.shadowColor = this.options.accentColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(headerZone.x + 22, headerZone.y + 6 + pillH / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 15px ${titleFontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      this.options.producerCredit,
      headerZone.x + 38,
      headerZone.y + 6 + pillH / 2
    );

    // Top Right: Timer & Hi-Res Specs Badge
    if (this.options.showTimer && duration > 0) {
      const curM = Math.floor(time / 60);
      const curS = Math.floor(time % 60).toString().padStart(2, "0");
      const totM = Math.floor(duration / 60);
      const totS = Math.floor(duration % 60).toString().padStart(2, "0");
      const timeText = `${curM}:${curS} / ${totM}:${totS}`;

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.font = "700 18px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
      ctx.fillText(timeText, headerZone.x + headerZone.w, headerZone.y + 27);

      if (this.options.showAudioSpecs) {
        const badgeW = 140;
        const badgeH = 34;
        const timeW = ctx.measureText(timeText).width;
        const badgeX = headerZone.x + headerZone.w - timeW - badgeW - 20;

        this.drawBadge(
          ctx,
          badgeX,
          headerZone.y + 10,
          badgeW,
          badgeH,
          8,
          "320K • 24-BIT",
          true,
          this.options.accentColor
        );
      }
    }

    // 2. Track Title & Badges
    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";

    if (hasHero) {
      // Anchored gracefully on the right stage
      const titleX = 1080;
      const titleY = 340;
      const maxTitleWidth = 740;

      ctx.font = `900 52px ${titleFontFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      const titleLines = this.wrapText(ctx, titleText, maxTitleWidth, 2);
      const lineHeight = 64;

      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i], titleX, titleY + i * lineHeight);
      }
      ctx.shadowColor = "transparent";

      if (this.options.showBpmKey) {
        let badgeStartX = titleX;
        const badgeY = titleY + (titleLines.length - 1) * lineHeight + 40;
        const badges = [
          `${beat?.bpm || 120} BPM`,
          beat?.key || "C MINOR",
          beat?.beatType ? beat.beatType.toUpperCase() : "EXCLUSIVE",
        ];

        ctx.font = "700 16px 'Space Mono', monospace";

        for (let i = 0; i < badges.length; i++) {
          const txt = badges[i];
          const txtW = ctx.measureText(txt).width;
          const pW = txtW + 28;
          const pH = 42;

          this.drawBadge(
            ctx,
            badgeStartX,
            badgeY,
            pW,
            pH,
            10,
            txt,
            i === 0,
            this.options.accentColor
          );

          badgeStartX += pW + 12;
        }
      }
    } else {
      // Centered typography when no hero stage is active
      const cx = grid.width / 2;
      const titleY = 460;
      const maxTitleWidth = 1200;

      ctx.font = `900 56px ${titleFontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";

      const titleLines = this.wrapText(ctx, titleText, maxTitleWidth, 2);
      const lineHeight = 68;

      ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < titleLines.length; i++) {
        ctx.fillText(titleLines[i], cx, titleY + i * lineHeight);
      }
      ctx.shadowColor = "transparent";

      if (this.options.showBpmKey) {
        const badges = [
          `${beat?.bpm || 120} BPM`,
          beat?.key || "C MINOR",
          beat?.beatType ? beat.beatType.toUpperCase() : "EXCLUSIVE",
        ];

        ctx.font = "700 16px 'Space Mono', monospace";
        const badgeWidths = badges.map((b) => ctx.measureText(b).width + 30);
        const gap = 12;
        const totalRowW =
          badgeWidths.reduce((a, b) => a + b, 0) + (badges.length - 1) * gap;

        let curX = cx - totalRowW / 2;
        const badgeY = titleY + (titleLines.length - 1) * lineHeight + 42;
        const pH = 42;

        for (let i = 0; i < badges.length; i++) {
          const txt = badges[i];
          const pW = badgeWidths[i];

          this.drawBadge(
            ctx,
            curX,
            badgeY,
            pW,
            pH,
            10,
            txt,
            i === 0,
            this.options.accentColor
          );

          curX += pW + gap;
        }
      }
    }

    // 3. Social Watermark (docked subtly in bottom right safe area)
    if (this.options.showSocialWatermark) {
      ctx.font = `700 13px 'Space Mono', monospace`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(
        this.options.socialWatermarkText,
        grid.safeBounds.x + grid.safeBounds.w,
        grid.safeBounds.y + grid.safeBounds.h
      );
    }
  }

  private renderClassicPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();
    const cx = 540;

    // 1. Tier 1 Top Pill
    const topPillY = 190;
    const topPillW = 460;
    const topPillH = 54;

    ctx.fillStyle = "rgba(18, 18, 20, 0.88)";
    ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx - topPillW / 2, topPillY, topPillW, topPillH, topPillH / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.options.accentColor;
    ctx.shadowColor = this.options.accentColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx - topPillW / 2 + 28, topPillY + topPillH / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.fillStyle = "#ffffff";
    ctx.font = `800 18px ${titleFontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `DZVN BEATS  •  ${this.options.producerCredit}`,
      cx + 10,
      topPillY + topPillH / 2 + 1
    );

    // 2. Tier 3 Title
    const titleStartY = 1440;
    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";

    ctx.font = `900 62px ${titleFontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const titleLines = this.wrapText(ctx, titleText, 860, 2);
    const lineHeight = 74;

    ctx.shadowColor = "rgba(0, 0, 0, 0.98)";
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = "#ffffff";

    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], cx, titleStartY + i * lineHeight);
    }
    ctx.shadowColor = "transparent";

    // 3. Badges
    const badgesBaseY = titleStartY + (titleLines.length - 1) * lineHeight + 54;

    if (this.options.showBpmKey) {
      const badges = [
        `${beat?.bpm || 120} BPM`,
        beat?.key || "C MINOR",
        beat?.beatType ? beat.beatType.toUpperCase() : "FREE",
      ];

      ctx.font = "700 19px 'Space Mono', monospace";
      const badgeWidths = badges.map((b) => ctx.measureText(b).width + 36);
      const gap = 14;
      const totalRowW =
        badgeWidths.reduce((a, b) => a + b, 0) + (badges.length - 1) * gap;

      let curX = cx - totalRowW / 2;
      const pH = 48;

      for (let i = 0; i < badges.length; i++) {
        const txt = badges[i];
        const pW = badgeWidths[i];

        this.drawBadge(
          ctx,
          curX,
          badgesBaseY,
          pW,
          pH,
          12,
          txt,
          i === 0,
          this.options.accentColor
        );

        curX += pW + gap;
      }
    }

    // 4. CTA Pill
    if (this.options.showSocialWatermark) {
      const ctaY = 1690;
      const ctaW = 480;
      const ctaH = 58;

      ctx.fillStyle = "rgba(18, 18, 20, 0.92)";
      ctx.strokeStyle = "rgba(251, 191, 36, 0.55)";
      ctx.lineWidth = 1.6;
      ctx.shadowColor = "rgba(251, 191, 36, 0.3)";
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.roundRect(cx - ctaW / 2, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = this.options.accentColor;
      ctx.font = `800 19px ${titleFontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.options.socialWatermarkText, cx, ctaY + ctaH / 2 + 1);
    }
  }

  // =========================================================================
  // 2. MODERN LOWER-THIRD BROADCAST CARD
  // =========================================================================
  private renderLowerThirdLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, coverImage, grid, audio } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const cardX = grid.safeBounds.x + 20;
    const cardY = grid.height - 180;
    const cardW = Math.min(grid.safeBounds.w - 40, 960);
    const cardH = 130;
    const thumbSize = 98;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;

    const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    bgGrad.addColorStop(0, "rgba(16, 16, 20, 0.94)");
    bgGrad.addColorStop(1, "rgba(24, 24, 30, 0.88)");
    ctx.fillStyle = bgGrad;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.4;

    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Progress Strip
    const progress = duration > 0 ? Math.min(1, time / duration) : 0;
    ctx.fillStyle = this.options.accentColor;
    ctx.shadowColor = this.options.accentColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(cardX + 16, cardY + cardH - 5, (cardW - 32) * progress, 3, 1.5);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // 1. Cover Art Thumbnail (with fallback)
    const thumbX = cardX + 16;
    const thumbY = cardY + 16;
    this.drawCoverThumbnail(
      ctx,
      coverImage,
      thumbX,
      thumbY,
      thumbSize,
      14,
      this.options.accentColor
    );

    // 2. Info Block
    const contentX = thumbX + thumbSize + 22;
    const maxTitleW = cardW - thumbSize - 250;

    ctx.fillStyle = this.options.accentColor;
    ctx.font = `800 13px 'Space Mono', monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(this.options.producerCredit.toUpperCase(), contentX, cardY + 36);

    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 28px ${titleFontFamily}`;
    const wrapped = this.wrapText(ctx, titleText, maxTitleW, 1);
    ctx.fillText(wrapped[0], contentX, cardY + 70);

    if (this.options.showBpmKey) {
      const bpm = `${beat?.bpm || 120} BPM`;
      const key = beat?.key || "C MINOR";
      ctx.font = "700 12px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText(`⚡ ${bpm}   •   ♫ ${key}`, contentX, cardY + 98);
    }

    // 3. Audio & Timer Block
    const rightX = cardX + cardW - 24;
    ctx.textAlign = "right";

    if (this.options.showTimer && duration > 0) {
      const curM = Math.floor(time / 60);
      const curS = Math.floor(time % 60).toString().padStart(2, "0");
      const totM = Math.floor(duration / 60);
      const totS = Math.floor(duration % 60).toString().padStart(2, "0");
      ctx.font = "700 20px 'Space Mono', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${curM}:${curS} / ${totM}:${totS}`, rightX, cardY + 48);
    }

    const kickHit = audio?.isKick || (audio?.calibrated?.kickTransient ?? 0) > 0.6;
    ctx.fillStyle = kickHit ? "#ef4444" : this.options.accentColor;
    ctx.beginPath();
    ctx.arc(rightX - 120, cardY + 42, 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (this.options.showAudioSpecs) {
      ctx.font = "700 11px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      ctx.fillText("320 KBPS • LOSSLESS 24-BIT", rightX, cardY + 74);
    }

    if (this.options.showSocialWatermark) {
      ctx.font = "800 11px 'Space Mono', monospace";
      ctx.fillStyle = this.options.accentColor;
      ctx.fillText(this.options.socialWatermarkText, rightX, cardY + 98);
    }
  }

  private renderLowerThirdPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, coverImage, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const cardW = 920;
    const cardH = 170;
    const cardX = grid.width / 2 - cardW / 2;
    const cardY = grid.height - 290;
    const thumbSize = 130;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = "rgba(14, 14, 18, 0.94)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const progress = duration > 0 ? Math.min(1, time / duration) : 0;
    ctx.fillStyle = this.options.accentColor;
    ctx.beginPath();
    ctx.roundRect(cardX + 20, cardY + cardH - 6, (cardW - 40) * progress, 3.5, 2);
    ctx.fill();

    const thumbX = cardX + 20;
    const thumbY = cardY + 20;
    this.drawCoverThumbnail(
      ctx,
      coverImage,
      thumbX,
      thumbY,
      thumbSize,
      18,
      this.options.accentColor
    );

    const textX = thumbX + thumbSize + 24;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = this.options.accentColor;
    ctx.font = `800 15px 'Space Mono', monospace`;
    ctx.fillText(this.options.producerCredit.toUpperCase(), textX, cardY + 44);

    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 32px ${titleFontFamily}`;
    const wrapped = this.wrapText(ctx, titleText, cardW - thumbSize - 60, 1);
    ctx.fillText(wrapped[0], textX, cardY + 84);

    if (this.options.showBpmKey) {
      ctx.font = "700 16px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillText(
        `⚡ ${beat?.bpm || 120} BPM   •   ♫ ${beat?.key || "C MINOR"}`,
        textX,
        cardY + 120
      );
    }
  }

  // =========================================================================
  // 3. SPOTIFY / STREAMING NOW-PLAYING GLASS PILL
  // =========================================================================
  private renderSpotifyPillLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, coverImage, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const pillW = 540;
    const pillH = 100;
    const pillX = grid.width - pillW - 60;
    const pillY = grid.height - pillH - 45;
    const thumbSize = 68;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = "rgba(18, 18, 22, 0.92)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 24);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const thumbX = pillX + 16;
    const thumbY = pillY + (pillH - thumbSize) / 2;
    this.drawCoverThumbnail(
      ctx,
      coverImage,
      thumbX,
      thumbY,
      thumbSize,
      12,
      this.options.accentColor
    );

    const textX = thumbX + thumbSize + 18;
    const maxTextW = pillW - thumbSize - 60;

    const titleText = beat?.title || "Untitled Beat";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 19px ${titleFontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const wrapped = this.wrapText(ctx, titleText, maxTextW, 1);
    ctx.fillText(wrapped[0], textX, pillY + 34);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = `600 13px ${titleFontFamily}`;
    ctx.fillText(this.options.producerCredit, textX, pillY + 54);

    const barW = maxTextW;
    const barH = 4;
    const barX = textX;
    const barY = pillY + 74;
    const progress = duration > 0 ? Math.min(1, time / duration) : 0;

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.fill();

    ctx.fillStyle = this.options.accentColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(barX + barW * progress, barY + barH / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderSpotifyPillPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, coverImage, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const pillW = 860;
    const pillH = 140;
    const pillX = grid.width / 2 - pillW / 2;
    const pillY = grid.height - 300;
    const thumbSize = 98;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 10;

    ctx.fillStyle = "rgba(16, 16, 20, 0.94)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 28);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    const thumbX = pillX + 22;
    const thumbY = pillY + (pillH - thumbSize) / 2;
    this.drawCoverThumbnail(
      ctx,
      coverImage,
      thumbX,
      thumbY,
      thumbSize,
      16,
      this.options.accentColor
    );

    const textX = thumbX + thumbSize + 22;
    const maxTextW = pillW - thumbSize - 60;

    const titleText = beat?.title || "Untitled Beat";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 26px ${titleFontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const wrapped = this.wrapText(ctx, titleText, maxTextW, 1);
    ctx.fillText(wrapped[0], textX, pillY + 46);

    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = `600 17px ${titleFontFamily}`;
    ctx.fillText(this.options.producerCredit, textX, pillY + 75);

    const barW = maxTextW;
    const barH = 5;
    const barX = textX;
    const barY = pillY + 104;
    const progress = duration > 0 ? Math.min(1, time / duration) : 0;

    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2.5);
    ctx.fill();

    ctx.fillStyle = this.options.accentColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * progress, barH, 2.5);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(barX + barW * progress, barY + barH / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // =========================================================================
  // 4. CYBERPUNK TECHNICAL TELEMETRY HUD
  // =========================================================================
  private renderTechHudLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, grid, audio } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();
    const safe = grid.safeBounds;

    const bracketSize = 32;
    ctx.strokeStyle = this.options.accentColor;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(safe.x, safe.y + bracketSize);
    ctx.lineTo(safe.x, safe.y);
    ctx.lineTo(safe.x + bracketSize, safe.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(safe.x + safe.w - bracketSize, safe.y);
    ctx.lineTo(safe.x + safe.w, safe.y);
    ctx.lineTo(safe.x + safe.w, safe.y + bracketSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(safe.x, safe.y + safe.h - bracketSize);
    ctx.lineTo(safe.x, safe.y + safe.h);
    ctx.lineTo(safe.x + bracketSize, safe.y + safe.h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(safe.x + safe.w - bracketSize, safe.y + safe.h);
    ctx.lineTo(safe.x + safe.w, safe.y + safe.h);
    ctx.lineTo(safe.x + safe.w, safe.y + safe.h - bracketSize);
    ctx.stroke();

    ctx.font = "700 13px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`[ SYS // DZVN-ENGINE 2.0 ]`, safe.x + 18, safe.y + 18);

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText(`SAMPLE: 48.0kHz • 24-BIT FLAC`, safe.x + 280, safe.y + 18);

    if (this.options.showTimer && duration > 0) {
      const curM = Math.floor(time / 60);
      const curS = Math.floor(time % 60).toString().padStart(2, "0");
      const totM = Math.floor(duration / 60);
      const totS = Math.floor(duration % 60).toString().padStart(2, "0");
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        `TIMECODE: ${curM}:${curS} / ${totM}:${totS}`,
        safe.x + safe.w - 18,
        safe.y + 18
      );
    }

    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    const titleX = safe.x + 20;
    const maxTitleW = safe.w - 320;

    ctx.font = `900 42px ${titleFontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";

    const titleLines = this.wrapText(ctx, titleText, maxTitleW, 2);
    const lineHeight = 50;
    const titleY = safe.y + safe.h - 90 - (titleLines.length - 1) * lineHeight;

    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], titleX, titleY + i * lineHeight);
    }

    if (this.options.showBpmKey) {
      const bpm = beat?.bpm || 120;
      const key = beat?.key || "C MINOR";
      const tags = `// BPM: ${bpm}  // KEY: ${key.toUpperCase()}  // STATUS: ${beat?.beatType?.toUpperCase() || "EXCLUSIVE"}`;
      ctx.font = "700 14px 'Space Mono', monospace";
      ctx.fillStyle = this.options.accentColor;
      ctx.fillText(tags, titleX, titleY + (titleLines.length - 1) * lineHeight + 34);
    }

    const meterX = safe.x + safe.w - 240;
    const meterY = safe.y + safe.h - 75;
    ctx.font = "700 11px 'Space Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fillText("AUDIO SPECTRUM TELEMETRY", meterX, meterY);

    const bands = [
      { label: "LOW", val: audio?.calibrated?.lows ?? audio?.bass ?? 0.5, color: "#f59e0b" },
      { label: "MID", val: audio?.calibrated?.mids ?? audio?.mids ?? 0.5, color: "#10b981" },
      { label: "HI", val: audio?.calibrated?.highs ?? audio?.highs ?? 0.5, color: "#06b6d4" },
    ];

    for (let i = 0; i < bands.length; i++) {
      const bx = meterX + i * 75;
      const by = meterY + 12;
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(bx, by, 65, 8);
      ctx.fillStyle = bands[i].color;
      ctx.fillRect(bx, by, 65 * Math.min(1, bands[i].val), 8);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillText(bands[i].label, bx, by + 20);
    }
  }

  private renderTechHudPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();
    const safe = grid.safeBounds;

    const bracketSize = 28;
    ctx.strokeStyle = this.options.accentColor;
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(safe.x, safe.y + bracketSize);
    ctx.lineTo(safe.x, safe.y);
    ctx.lineTo(safe.x + bracketSize, safe.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(safe.x + safe.w - bracketSize, safe.y);
    ctx.lineTo(safe.x + safe.w, safe.y);
    ctx.lineTo(safe.x + safe.w, safe.y + bracketSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(safe.x, safe.y + safe.h - bracketSize);
    ctx.lineTo(safe.x, safe.y + safe.h);
    ctx.lineTo(safe.x + bracketSize, safe.y + safe.h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(safe.x + safe.w - bracketSize, safe.y + safe.h);
    ctx.lineTo(safe.x + safe.w, safe.y + safe.h);
    ctx.lineTo(safe.x + safe.w, safe.y + safe.h - bracketSize);
    ctx.stroke();

    ctx.font = "700 16px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`[ SYS // DZVN-ENGINE 2.0 ]`, grid.width / 2, safe.y + 36);

    if (this.options.showTimer && duration > 0) {
      const curM = Math.floor(time / 60);
      const curS = Math.floor(time % 60).toString().padStart(2, "0");
      const totM = Math.floor(duration / 60);
      const totS = Math.floor(duration % 60).toString().padStart(2, "0");
      ctx.font = "700 13px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fillText(
        `TIMECODE: ${curM}:${curS} / ${totM}:${totS}`,
        grid.width / 2,
        safe.y + 64
      );
    }

    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    ctx.font = `900 52px ${titleFontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    const titleLines = this.wrapText(ctx, titleText, 860, 2);
    const lineHeight = 58;
    const titleY = safe.y + safe.h - 130 - (titleLines.length - 1) * lineHeight;

    for (let i = 0; i < titleLines.length; i++) {
      ctx.fillText(titleLines[i], grid.width / 2, titleY + i * lineHeight);
    }

    if (this.options.showBpmKey) {
      const bpm = beat?.bpm || 120;
      const key = beat?.key || "C MINOR";
      ctx.font = "700 20px 'Space Mono', monospace";
      ctx.fillStyle = this.options.accentColor;
      ctx.fillText(
        `// BPM: ${bpm}  // KEY: ${key.toUpperCase()}`,
        grid.width / 2,
        titleY + (titleLines.length - 1) * lineHeight + 48
      );
    }
  }

  // =========================================================================
  // 5. CENTERED BILLBOARD / CINEMATIC POSTER
  // =========================================================================
  private renderBillboardLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();
    const cx = grid.width / 2;
    const baseY = grid.height - 220;

    ctx.font = `800 15px 'Space Mono', monospace`;
    ctx.fillStyle = this.options.accentColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`—  ${this.options.producerCredit.toUpperCase()}  —`, cx, baseY);

    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    ctx.font = `900 64px ${titleFontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 6;

    const lines = this.wrapText(ctx, titleText, 1400, 2);
    const lineHeight = 76;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx, baseY + 66 + i * lineHeight);
    }
    ctx.shadowColor = "transparent";

    if (this.options.showBpmKey) {
      const badgesY = baseY + 66 + (lines.length - 1) * lineHeight + 44;
      const badges = [
        `${beat?.bpm || 120} BPM`,
        beat?.key || "C MINOR",
        beat?.beatType ? beat.beatType.toUpperCase() : "EXCLUSIVE",
      ];
      ctx.font = "700 15px 'Space Mono', monospace";
      const badgeStr = badges.join("   •   ");
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText(badgeStr, cx, badgesY);
    }

    if (this.options.showSocialWatermark) {
      const ctaY = baseY + 66 + (lines.length - 1) * lineHeight + 78;
      ctx.font = "700 12px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fillText(this.options.socialWatermarkText, cx, ctaY);
    }
  }

  private renderBillboardPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();
    const cx = grid.width / 2;
    const baseY = grid.height - 380;

    ctx.font = `800 18px 'Space Mono', monospace`;
    ctx.fillStyle = this.options.accentColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`—  ${this.options.producerCredit.toUpperCase()}  —`, cx, baseY);

    const titleText = beat?.title?.toUpperCase() || "UNTITLED BEAT";
    ctx.font = `900 68px ${titleFontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 8;
    const lines = this.wrapText(ctx, titleText, 900, 2);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx, baseY + 75 + i * 80);
    }
    ctx.shadowColor = "transparent";

    if (this.options.showBpmKey) {
      const badgesY = baseY + 75 + (lines.length - 1) * 80 + 60;
      const badges = [
        `${beat?.bpm || 120} BPM`,
        beat?.key || "C MINOR",
        beat?.beatType ? beat.beatType.toUpperCase() : "EXCLUSIVE",
      ];
      ctx.font = "700 18px 'Space Mono', monospace";
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText(badges.join("   •   "), cx, badgesY);
    }
  }

  // =========================================================================
  // 6. MINIMALIST DOCK BAR (SINGLE-LINE STRIP)
  // =========================================================================
  private renderMinimalDockLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const barW = Math.min(grid.safeBounds.w - 80, 1100);
    const barH = 50;
    const barX = grid.width / 2 - barW / 2;
    const barY = grid.height - 75;

    ctx.save();
    ctx.fillStyle = "rgba(16, 16, 22, 0.88)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, barH / 2);
    ctx.fill();
    ctx.stroke();

    // Glowing Live Dot
    ctx.fillStyle = this.options.accentColor;
    ctx.shadowColor = this.options.accentColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(barX + 22, barY + barH / 2, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Producer Tag & Title (Truncated so it never overlaps right-side badges)
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 15px ${titleFontFamily}`;
    const rawTitle = `${beat?.title?.toUpperCase() || "UNTITLED"}  •  ${this.options.producerCredit}`;
    const maxTitleW = barW - 320;
    const titleText = this.truncateToWidth(ctx, rawTitle, maxTitleW, true);
    ctx.fillText(titleText, barX + 38, barY + barH / 2 + 1);

    // Badges & Time (Right side)
    const rightX = barX + barW - 20;
    ctx.textAlign = "right";

    let timeText = "";
    if (this.options.showTimer && duration > 0) {
      const curM = Math.floor(time / 60);
      const curS = Math.floor(time % 60).toString().padStart(2, "0");
      timeText = `${curM}:${curS}`;
    }

    const bpmText = `${beat?.bpm || 120} BPM`;
    const rightInfo = timeText ? `${bpmText}   |   ${timeText}` : bpmText;
    ctx.font = "700 13px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.fillText(rightInfo, rightX, barY + barH / 2 + 1);

    ctx.restore();
  }

  private renderMinimalDockPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, time, duration, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const barW = 900;
    const barH = 68;
    const barX = grid.width / 2 - barW / 2;
    const barY = grid.height - 180;

    ctx.save();
    ctx.fillStyle = "rgba(16, 16, 22, 0.92)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, barH / 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.options.accentColor;
    ctx.shadowColor = this.options.accentColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(barX + 28, barY + barH / 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 19px ${titleFontFamily}`;
    const rawTitle = beat?.title?.toUpperCase() || "UNTITLED";
    const maxTitleW = barW - 320;
    const titleText = this.truncateToWidth(ctx, rawTitle, maxTitleW, true);
    ctx.fillText(titleText, barX + 46, barY + barH / 2 + 1);

    const rightX = barX + barW - 24;
    ctx.textAlign = "right";
    let timeText = "";
    if (this.options.showTimer && duration > 0) {
      const curM = Math.floor(time / 60);
      const curS = Math.floor(time % 60).toString().padStart(2, "0");
      timeText = `${curM}:${curS}`;
    }
    const bpmText = `${beat?.bpm || 120} BPM`;
    const rightInfo = timeText ? `${bpmText}  |  ${timeText}` : bpmText;
    ctx.font = "700 16px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.fillText(rightInfo, rightX, barY + barH / 2 + 1);

    ctx.restore();
  }

  // =========================================================================
  // 7. EDITORIAL CORNER STAMP (CATALOG BADGE)
  // =========================================================================
  private renderCornerStampLandscape(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const stampW = 280;
    const stampH = 120;
    const stampX = grid.safeBounds.x + grid.safeBounds.w - stampW;
    const stampY = grid.safeBounds.y + 10;

    ctx.save();
    ctx.fillStyle = "rgba(18, 18, 24, 0.9)";
    ctx.strokeStyle = this.options.accentColor;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.rect(stampX, stampY, stampW, stampH);
    ctx.fill();
    ctx.stroke();

    // Inner Stamp Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(stampX + 6, stampY + 6, stampW - 12, stampH - 12);

    // Header Catalog No.
    ctx.font = "700 11px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`CAT NO. DZVN-${beat?.bpm || 120}`, stampX + 14, stampY + 24);

    // Track Title (Truncated if necessary)
    const rawTitle = beat?.title?.toUpperCase() || "UNTITLED";
    const titleText = this.truncateToWidth(ctx, rawTitle, stampW - 28, true);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 16px ${titleFontFamily}`;
    ctx.fillText(titleText, stampX + 14, stampY + 48);

    // Key & BPM
    ctx.font = "700 12px 'Space Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(`${beat?.bpm || 120} BPM • ${beat?.key || "C MIN"}`, stampX + 14, stampY + 70);

    // Producer Signature
    ctx.font = "700 10px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.fillText(this.options.producerCredit, stampX + 14, stampY + 92);

    ctx.restore();
  }

  private renderCornerStampPortrait(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { beat, grid } = frameCtx;
    const titleFontFamily = this.getTitleFontFamily();

    const stampW = 340;
    const stampH = 140;
    const stampX = grid.width / 2 - stampW / 2;
    const stampY = grid.safeBounds.y + 20;

    ctx.save();
    ctx.fillStyle = "rgba(18, 18, 24, 0.92)";
    ctx.strokeStyle = this.options.accentColor;
    ctx.lineWidth = 1.6;

    ctx.beginPath();
    ctx.rect(stampX, stampY, stampW, stampH);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(stampX + 8, stampY + 8, stampW - 16, stampH - 16);

    ctx.font = "700 12px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(`CATALOG: DZVN-RECORDS // ${beat?.bpm || 120} BPM`, stampX + 18, stampY + 30);

    const rawTitle = beat?.title?.toUpperCase() || "UNTITLED";
    const titleText = this.truncateToWidth(ctx, rawTitle, stampW - 36, true);
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 20px ${titleFontFamily}`;
    ctx.fillText(titleText, stampX + 18, stampY + 60);

    ctx.font = "700 14px 'Space Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fillText(
      `${beat?.bpm || 120} BPM • KEY: ${beat?.key || "C MIN"}`,
      stampX + 18,
      stampY + 86
    );

    ctx.font = "700 12px 'Space Mono', monospace";
    ctx.fillStyle = this.options.accentColor;
    ctx.fillText(this.options.producerCredit, stampX + 18, stampY + 112);

    ctx.restore();
  }

  public clone(): TrackInfoEffect {
    const c = new TrackInfoEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
