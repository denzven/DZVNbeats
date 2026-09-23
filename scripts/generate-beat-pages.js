import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");
const publicBeatDir = path.join(rootDir, "public", "beat");

const PRODUCTION_ORIGIN = "https://denzven.github.io";
const PRODUCTION_BASE = "/DZVNbeats/";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateBeatPages() {
  if (!fs.existsSync(beatsJsonPath)) {
    console.warn("[SEO Generator] src/data/beats.json not found. Skipping beat pages generation.");
    return;
  }

  const beats = JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
  console.log(`[SEO Generator] Generating rich SEO landing pages for ${beats.length} beat(s)...`);

  // Ensure public/beat directory exists
  if (!fs.existsSync(publicBeatDir)) {
    fs.mkdirSync(publicBeatDir, { recursive: true });
  }

  for (const beat of beats) {
    const beatFolder = path.join(publicBeatDir, beat.id);
    if (!fs.existsSync(beatFolder)) {
      fs.mkdirSync(beatFolder, { recursive: true });
    }

    const coverFilename = beat.coverArt ? path.basename(beat.coverArt) : null;
    const absoluteCoverUrl = coverFilename
      ? `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}covers/${coverFilename}`
      : `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}banner.png`;
    const relativeCoverUrl = coverFilename
      ? `../../covers/${coverFilename}`
      : `../../banner.png`;

    const absoluteAudioUrl = `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}beats/${encodeURIComponent(beat.filename)}`;
    const canonicalBeatUrl = `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}beat/${encodeURIComponent(beat.id)}/`;

    const titleFormatted = `${escapeHtml(beat.title)} - Type Beat | DZVNbeats`;
    const descFormatted = `🎵 ${escapeHtml(beat.title)} • ${beat.bpm ? beat.bpm + " BPM" : "140 BPM"}${
      beat.key ? " • " + escapeHtml(beat.key) : ""
    } • ${beat.beatType === "Free" ? "Free Download" : "₹" + beat.price + " Direct License"}. Listen now on DZVNbeats.`;

    const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${titleFormatted}</title>
    <meta name="description" content="${descFormatted}" />
    <link rel="icon" type="image/png" href="../../favicon.png" />
    <link rel="canonical" href="${canonicalBeatUrl}" />

    <!-- Open Graph / Facebook / Discord / WhatsApp -->
    <meta property="og:type" content="music.song" />
    <meta property="og:site_name" content="DZVNbeats" />
    <meta property="og:url" content="${canonicalBeatUrl}" />
    <meta property="og:title" content="${titleFormatted}" />
    <meta property="og:description" content="${descFormatted}" />
    <meta property="og:image" content="${absoluteCoverUrl}" />
    <meta property="og:image:secure_url" content="${absoluteCoverUrl}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="og:image:alt" content="${escapeHtml(beat.title)} Cover Artwork" />
    <meta property="music:musician" content="DZVN" />
    <meta property="music:song" content="${escapeHtml(beat.title)}" />
    <meta property="og:audio" content="${absoluteAudioUrl}" />
    <meta property="og:audio:type" content="audio/mpeg" />

    <!-- Twitter / X Cards -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@DZVNbeats" />
    <meta name="twitter:url" content="${canonicalBeatUrl}" />
    <meta name="twitter:title" content="${titleFormatted}" />
    <meta name="twitter:description" content="${descFormatted}" />
    <meta name="twitter:image" content="${absoluteCoverUrl}" />
    <meta name="twitter:image:alt" content="${escapeHtml(beat.title)} Cover Artwork" />

    <!-- Schema.org JSON-LD Structured Data for Google Rich Snippets -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "MusicRecording",
      "name": ${JSON.stringify(beat.title)},
      "byArtist": {
        "@type": "MusicGroup",
        "name": "DZVN",
        "url": "${PRODUCTION_ORIGIN}${PRODUCTION_BASE}"
      },
      "image": "${absoluteCoverUrl}",
      "audio": "${absoluteAudioUrl}",
      "description": ${JSON.stringify(descFormatted)},
      "genre": ${JSON.stringify(beat.tags && beat.tags.length > 0 ? beat.tags.join(", ") : "Hip Hop / Trap")},
      "offers": {
        "@type": "Offer",
        "price": ${beat.price || 0},
        "priceCurrency": "INR",
        "availability": ${JSON.stringify(beat.status === "Sold" ? "https://schema.org/Discontinued" : "https://schema.org/InStock")}
      }
    }
    </script>

    <!-- Instant Redirect into SPA with Auto-Play Parameter -->
    <script>
      (function() {
        var path = window.location.pathname;
        var base = path.replace(/\\/beat\\/[^\\/]+\\/?$/, "");
        if (!base.endsWith("/")) base += "/";
        var target = base + "#/beats?play=" + encodeURIComponent("${beat.id}");
        window.location.replace(target);
      })();
    </script>
    <meta http-equiv="refresh" content="0; url=../../#/beats?play=${encodeURIComponent(beat.id)}" />
    <style>
      body {
        margin: 0;
        background-color: #09090b;
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
        box-sizing: border-box;
      }
      .card {
        max-width: 400px;
        width: 100%;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 20px;
        padding: 24px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
      }
      .artwork {
        width: 180px;
        height: 180px;
        border-radius: 16px;
        object-fit: cover;
        margin: 0 auto 16px;
        border: 1px solid #3f3f46;
        display: block;
      }
      .title {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0 0 6px;
        color: #ffffff;
      }
      .meta {
        color: #a1a1aa;
        font-size: 0.85rem;
        font-family: monospace;
        margin: 0 0 20px;
      }
      .play-btn {
        display: inline-block;
        width: 100%;
        padding: 12px 20px;
        background: #ffffff;
        color: #09090b;
        font-weight: 700;
        font-size: 0.875rem;
        border-radius: 12px;
        text-decoration: none;
        box-sizing: border-box;
        transition: transform 0.15s ease;
      }
      .play-btn:hover {
        transform: scale(1.02);
      }
      .note {
        color: #71717a;
        font-size: 0.75rem;
        margin: 12px 0 0;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <img
        class="artwork"
        src="${relativeCoverUrl}"
        alt="${escapeHtml(beat.title)}"
        onerror="this.src='../../banner.png'"
      />
      <div class="title">${escapeHtml(beat.title)}</div>
      <div class="meta">${beat.bpm ? beat.bpm + " BPM" : "Studio Track"}${beat.key ? " • " + escapeHtml(beat.key) : ""}</div>
      <a id="redirect-link" class="play-btn" href="../../#/beats?play=${encodeURIComponent(beat.id)}">
        ▶ Play on DZVNbeats
      </a>
      <div class="note">Redirecting to studio player...</div>
    </div>
    <script>
      var path = window.location.pathname;
      var base = path.replace(/\\/beat\\/[^\\/]+\\/?$/, "");
      if (!base.endsWith("/")) base += "/";
      document.getElementById("redirect-link").href = base + "#/beats?play=" + encodeURIComponent("${beat.id}");
    </script>
  </body>
</html>
`;

    fs.writeFileSync(path.join(beatFolder, "index.html"), htmlContent);
  }

  // Garbage Collection: Delete old orphaned beat SEO folders
  const activeBeatIds = new Set(beats.map((b) => b.id));
  try {
    const existingFolders = fs
      .readdirSync(publicBeatDir)
      .filter((f) => fs.statSync(path.join(publicBeatDir, f)).isDirectory());

    let cleanedPagesCount = 0;
    for (const folder of existingFolders) {
      if (!activeBeatIds.has(folder)) {
        fs.rmSync(path.join(publicBeatDir, folder), { recursive: true, force: true });
        cleanedPagesCount++;
        console.log(`🧹 [SEO Cleanup] Removed orphaned beat folder: /public/beat/${folder}`);
      }
    }
    if (cleanedPagesCount > 0) {
      console.log(`✨ [SEO Cleanup] Cleaned up ${cleanedPagesCount} orphaned beat page(s).`);
    }
  } catch (cleanErr) {
    console.warn("Could not clean up orphaned beat folders:", cleanErr.message);
  }

  console.log(`✅ [SEO Generator] Generated ${beats.length} static SEO landing page(s) in public/beat/`);
}

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith("generate-beat-pages.js")) {
  generateBeatPages();
}
