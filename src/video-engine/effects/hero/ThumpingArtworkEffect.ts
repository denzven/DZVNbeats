import { FrameContext, VideoEffect } from "../../types";
import { GridSystem } from "../../GridSystem";

export class ThumpingArtworkEffect implements VideoEffect {
  public id = "hero-thumping-art";
  public name = "Audio-Reactive Thumping Artwork";
  public description = "Speaker cone excursion physics that bounces and thumps to the sub-bass and kick drums, with pulsating neon halo.";
  public category = "hero" as const;
  public enabled = false; // Enabled by default in Shorts preset
  public order = 35;

  private currentScale = 1.0;
  private velocity = 0;

  public options = {
    thumpStrength: 0.12, // Maximum scale expansion
    glowIntensity: 0.8,
    glowColor: "#f59e0b", // Amber glow default
    cornerRadius: 24,
    sizeScale: 1.0, // Scaled directly from hero grid section
  };

  public schema = [
    {
      key: "thumpStrength",
      label: "Thump Excursion Strength",
      type: "number" as const,
      default: 0.12,
      min: 0.02,
      max: 0.25,
      step: 0.01,
    },
    {
      key: "glowColor",
      label: "Glow Color",
      type: "color" as const,
      default: "#f59e0b",
    },
    {
      key: "sizeScale",
      label: "Card Size Scale",
      type: "number" as const,
      default: 1.0,
      min: 0.6,
      max: 1.15,
      step: 0.05,
    },
  ];

  public render(ctx: CanvasRenderingContext2D, frameCtx: FrameContext): void {
    const { audio, coverImage, beat, width, height, aspectRatio } = frameCtx;

    // Physics spring model for realistic speaker driver movement
    const targetScale = 1.0 + (audio.isKick ? this.options.thumpStrength : 0) + audio.subBass * (this.options.thumpStrength * 0.6);
    const stiffness = 0.35;
    const damping = 0.68;

    const force = (targetScale - this.currentScale) * stiffness;
    this.velocity = (this.velocity + force) * damping;
    this.currentScale += this.velocity;

    // Card dimensions scaled directly to the Hero Grid Section
    const isVinylActive = frameCtx.activeEffects?.includes("hero-vinyl-deck") ?? false;
    const hero = GridSystem.getHeroCardGeometry(width, height, aspectRatio, isVinylActive);

    const cardSize = hero.size * this.options.sizeScale * this.currentScale;
    const cx = hero.cx;
    const cy = hero.cy;
    const cornerRadius = hero.cornerRadius;

    const x = cx - cardSize / 2;
    const y = cy - cardSize / 2;

    ctx.save();

    // 1. Dynamic Audio-Reactive Neon Aura / Backlight
    const glowEnergy = Math.min(1.0, audio.subBass * 1.2 + audio.bass * 0.6);
    const blurRadius = 24 + glowEnergy * 40 * this.options.glowIntensity;

    ctx.save();
    ctx.shadowColor = this.options.glowColor;
    ctx.shadowBlur = blurRadius;
    ctx.fillStyle = `rgba(245, 158, 11, ${0.15 + glowEnergy * 0.45})`;
    ctx.beginPath();
    ctx.roundRect(x, y, cardSize, cardSize, cornerRadius);
    ctx.fill();
    ctx.restore();

    // 2. Heavy Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 16;

    // 3. Draw Artwork Card
    ctx.beginPath();
    ctx.roundRect(x, y, cardSize, cardSize, cornerRadius);
    ctx.fillStyle = "#18181b";
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, cardSize, cardSize, cornerRadius);
    ctx.clip();

    if (coverImage && coverImage.complete && coverImage.naturalWidth > 0) {
      ctx.drawImage(coverImage, x, y, cardSize, cardSize);
    } else {
      const grad = ctx.createLinearGradient(x, y, x + cardSize, y + cardSize);
      grad.addColorStop(0, "#27272a");
      grad.addColorStop(1, "#09090b");
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.floor(cardSize * 0.1)}px 'Outfit', Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(beat?.title || "BEAT", cx, cy);
    }

    // Specular light sheen across top edge
    const sheen = ctx.createLinearGradient(x, y, x + cardSize, y + cardSize * 0.6);
    sheen.addColorStop(0, "rgba(255, 255, 255, 0.18)");
    sheen.addColorStop(0.3, "rgba(255, 255, 255, 0.03)");
    sheen.addColorStop(1, "transparent");
    ctx.fillStyle = sheen;
    ctx.fill();

    ctx.restore();

    // 4. Subtle glowing border
    ctx.beginPath();
    ctx.roundRect(x, y, cardSize, cardSize, cornerRadius);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 + glowEnergy * 0.35})`;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.restore();
  }

  public clone(): ThumpingArtworkEffect {
    const c = new ThumpingArtworkEffect();
    c.enabled = this.enabled;
    c.options = { ...this.options };
    return c;
  }
}
