/**
 * ColorExtractor: High-performance ColorThief-style color quantization & palette extraction.
 * Extracts dominant, vibrant accent, complementary, dark, and light tones from any cover art.
 */

export interface ExtractedPalette {
  dominant: string;    // Most frequent prominent color
  accent: string;      // Most vibrant & saturated color (ideal for HUD & particle glow)
  secondary: string;   // Harmonious complementary/secondary tone
  dark: string;        // Deep ambient tone
  light: string;       // Luminous highlight tone
  palette: string[];   // Top 5 distinct aesthetic colors
  rawRgb: {
    dominant: [number, number, number];
    accent: [number, number, number];
    secondary: [number, number, number];
  };
}

const FALLBACK_PALETTE: ExtractedPalette = {
  dominant: "#f59e0b",
  accent: "#fbbf24",
  secondary: "#f97316",
  dark: "#18181b",
  light: "#fef08a",
  palette: ["#f59e0b", "#fbbf24", "#f97316", "#06b6d4", "#a855f7"],
  rawRgb: {
    dominant: [245, 158, 11],
    accent: [251, 191, 36],
    secondary: [249, 115, 22],
  },
};

const paletteCache = new Map<string, ExtractedPalette>();

export class ColorExtractor {
  /**
   * Extract palette from an HTMLImageElement or image URL
   */
  public static async extract(
    source: HTMLImageElement | string
  ): Promise<ExtractedPalette> {
    if (typeof source === "string") {
      if (paletteCache.has(source)) {
        return paletteCache.get(source)!;
      }

      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const res = this.extractFromImage(img);
          paletteCache.set(source, res);
          resolve(res);
        };
        img.onerror = () => {
          resolve(FALLBACK_PALETTE);
        };
        img.src = source;
      });
    } else {
      const srcKey = source.src;
      if (srcKey && paletteCache.has(srcKey)) {
        return paletteCache.get(srcKey)!;
      }
      const res = this.extractFromImage(source);
      if (srcKey) paletteCache.set(srcKey, res);
      return res;
    }
  }

  /**
   * Synchronous extraction from an already-loaded HTMLImageElement
   */
  public static extractFromImage(img: HTMLImageElement): ExtractedPalette {
    if (!img.complete || img.naturalWidth === 0) {
      return FALLBACK_PALETTE;
    }

    try {
      const canvas = document.createElement("canvas");
      const sampleSize = 80; // 80x80 gives 6,400 pixels for sub-millisecond analysis
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return FALLBACK_PALETTE;

      ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

      // 5-bit color quantization bucket map (32x32x32 = 32,768 bins)
      const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        // Skip transparent, extreme darks (black voids), and extreme lights (white blowouts)
        if (a < 128) continue;
        const maxVal = Math.max(r, g, b);
        const minVal = Math.min(r, g, b);
        if (maxVal < 18) continue; // nearly black
        if (minVal > 242) continue; // nearly white

        // Quantize RGB to 5-bit values (0-31)
        const qR = r >> 3;
        const qG = g >> 3;
        const qB = b >> 3;
        const key = (qR << 10) | (qG << 5) | qB;

        const bucket = buckets.get(key);
        if (bucket) {
          bucket.r += r;
          bucket.g += g;
          bucket.b += b;
          bucket.count++;
        } else {
          buckets.set(key, { r, g, b, count: 1 });
        }
      }

      if (buckets.size === 0) return FALLBACK_PALETTE;

      // Compute average RGB, HSL, and vibrancy score for each bucket
      interface ColorCandidate {
        rgb: [number, number, number];
        hex: string;
        count: number;
        h: number;
        s: number;
        l: number;
        vibrancy: number;
      }

      const candidates: ColorCandidate[] = [];

      for (const bucket of buckets.values()) {
        const avgR = Math.round(bucket.r / bucket.count);
        const avgG = Math.round(bucket.g / bucket.count);
        const avgB = Math.round(bucket.b / bucket.count);
        const [h, s, l] = this.rgbToHsl(avgR, avgG, avgB);

        // Vibrancy prioritizes colors with rich saturation and moderate lightness
        const vibrancy = s * (1 - Math.abs(l - 0.5) * 1.6) * Math.log10(bucket.count + 1);

        candidates.push({
          rgb: [avgR, avgG, avgB],
          hex: this.rgbToHex(avgR, avgG, avgB),
          count: bucket.count,
          h,
          s,
          l,
          vibrancy,
        });
      }

      // Sort by count for dominant color
      candidates.sort((a, b) => b.count - a.count);
      const dominantCandidate = candidates[0];

      // Sort by vibrancy for accent color
      const vibrantCandidates = [...candidates].sort((a, b) => b.vibrancy - a.vibrancy);
      // Prefer accent candidate with distinct saturation
      const accentCandidate =
        vibrantCandidates.find((c) => c.s > 0.35 && c.l > 0.25 && c.l < 0.75) ||
        vibrantCandidates[0] ||
        dominantCandidate;

      // Find secondary color with different hue (at least 35° separation)
      const secondaryCandidate =
        vibrantCandidates.find(
          (c) =>
            Math.abs(c.h - accentCandidate.h) > 35 &&
            Math.abs(c.h - accentCandidate.h) < 325 &&
            c.s > 0.25
        ) ||
        candidates.find((c) => c.hex !== dominantCandidate.hex && c.hex !== accentCandidate.hex) ||
        dominantCandidate;

      // Extract distinct 5-color palette
      const paletteSet = new Set<string>();
      paletteSet.add(accentCandidate.hex);
      paletteSet.add(dominantCandidate.hex);
      paletteSet.add(secondaryCandidate.hex);

      for (const c of vibrantCandidates) {
        if (paletteSet.size >= 5) break;
        // Avoid duplicate or near-identical colors
        const isDuplicate = Array.from(paletteSet).some((existingHex) => {
          const [er, eg, eb] = this.hexToRgb(existingHex);
          const dist = Math.hypot(c.rgb[0] - er, c.rgb[1] - eg, c.rgb[2] - eb);
          return dist < 38;
        });
        if (!isDuplicate) {
          paletteSet.add(c.hex);
        }
      }

      // Fill up to 5 colors if needed
      for (const c of candidates) {
        if (paletteSet.size >= 5) break;
        paletteSet.add(c.hex);
      }

      const paletteList = Array.from(paletteSet);

      // Deep dark & bright light tints
      const darkHex = this.adjustLightness(accentCandidate.rgb, 0.12);
      const lightHex = this.adjustLightness(accentCandidate.rgb, 0.88);

      return {
        dominant: dominantCandidate.hex,
        accent: accentCandidate.hex,
        secondary: secondaryCandidate.hex,
        dark: darkHex,
        light: lightHex,
        palette: paletteList,
        rawRgb: {
          dominant: dominantCandidate.rgb,
          accent: accentCandidate.rgb,
          secondary: secondaryCandidate.rgb,
        },
      };
    } catch (err) {
      console.warn("ColorExtractor warning:", err);
      return FALLBACK_PALETTE;
    }
  }

  // Helper conversions
  public static rgbToHex(r: number, g: number, b: number): string {
    return (
      "#" +
      [r, g, b]
        .map((x) => {
          const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  public static hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16),
      ];
    }
    return [
      parseInt(clean.slice(0, 2), 16) || 0,
      parseInt(clean.slice(2, 4), 16) || 0,
      parseInt(clean.slice(4, 6), 16) || 0,
    ];
  }

  public static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), s, l];
  }

  public static adjustLightness(rgb: [number, number, number], targetL: number): string {
    const [h, s] = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
    // Convert back to RGB with new lightness
    const c = (1 - Math.abs(2 * targetL - 1)) * Math.min(s, 0.85);
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = targetL - c / 2;

    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return this.rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }
}
