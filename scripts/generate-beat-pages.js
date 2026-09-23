import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");
const publicBeatDir = path.join(rootDir, "public", "beat");
const publicDir = path.join(rootDir, "public");

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

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// 1. Generate Individual Beat Landing Pages
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
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
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
        var parts = path.split("/").filter(Boolean);
        var base = "/";
        if (
          window.location.hostname.endsWith("github.io") ||
          (parts[0] && parts[0].toLowerCase() === "dzvnbeats")
        ) {
          base = "/" + (parts[0] || "DZVNbeats") + "/";
        }
        var target = base + "#/beats?play=" + encodeURIComponent("${beat.id}");
        window.location.replace(target);
      })();
    </script>
    <meta http-equiv="refresh" content="0; url=${PRODUCTION_BASE}#/beats?play=${encodeURIComponent(beat.id)}" />
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
      <a id="redirect-link" class="play-btn" href="${PRODUCTION_BASE}#/beats?play=${encodeURIComponent(beat.id)}">
        ▶ Play on DZVNbeats
      </a>
      <div class="note">Redirecting to studio player...</div>
    </div>
    <script>
      var path = window.location.pathname;
      var parts = path.split("/").filter(Boolean);
      var base = "/";
      if (
        window.location.hostname.endsWith("github.io") ||
        (parts[0] && parts[0].toLowerCase() === "dzvnbeats")
      ) {
        base = "/" + (parts[0] || "DZVNbeats") + "/";
      }
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

  // Also generate Sitemap and Static Policy Pages
  generateSitemap(beats);
  generateStaticPolicyPages(beats);
}

// 2. Generate XML Sitemap with Google Image & Video extension tags
export function generateSitemap(beats = []) {
  console.log("[SEO Generator] Generating public/sitemap.xml...");
  const today = new Date().toISOString().split("T")[0];

  const coreRoutes = [
    {
      loc: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}`,
      changefreq: "daily",
      priority: "1.0",
      image: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}banner.png`,
      imageTitle: "DZVNbeats - Premium Type Beats & Rap Beats For Sale",
    },
    {
      loc: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}beats/`,
      changefreq: "daily",
      priority: "0.9",
      image: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}banner.png`,
      imageTitle: "DZVNbeats Beat Store Catalog & Instrumentals",
    },
    {
      loc: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}licensing/`,
      changefreq: "weekly",
      priority: "0.8",
    },
    {
      loc: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}privacy/`,
      changefreq: "monthly",
      priority: "0.5",
    },
    {
      loc: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}terms/`,
      changefreq: "monthly",
      priority: "0.5",
    },
    {
      loc: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}refund/`,
      changefreq: "monthly",
      priority: "0.5",
    },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Core Site & Policy Routes -->
`;

  for (const route of coreRoutes) {
    xml += `  <url>
    <loc>${escapeXml(route.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
`;
    if (route.image) {
      xml += `    <image:image>
      <image:loc>${escapeXml(route.image)}</image:loc>
      <image:title>${escapeXml(route.imageTitle || "DZVNbeats")}</image:title>
    </image:image>
`;
    }
    xml += `  </url>
`;
  }

  xml += `
  <!-- Individual Beat Pages with Artwork -->
`;

  for (const beat of beats) {
    const canonicalBeatUrl = `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}beat/${encodeURIComponent(beat.id)}/`;
    const coverFilename = beat.coverArt ? path.basename(beat.coverArt) : null;
    const coverUrl = coverFilename
      ? `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}covers/${coverFilename}`
      : `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}banner.png`;

    xml += `  <url>
    <loc>${escapeXml(canonicalBeatUrl)}</loc>
    <lastmod>${beat.createdAt || today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${escapeXml(coverUrl)}</image:loc>
      <image:title>${escapeXml(beat.title)} - Type Beat Artwork</image:title>
      <image:caption>${escapeXml(beat.title)} produced by DZVN</image:caption>
    </image:image>
  </url>
`;
  }

  xml += `</urlset>
`;

  const sitemapPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(sitemapPath, xml, "utf-8");
  console.log(`✅ [SEO Generator] Successfully generated public/sitemap.xml with ${coreRoutes.length + beats.length} URLs.`);
}

// 3. Generate Static Pre-rendered Fallback Landing Pages for Headless Crawlers (GitHub Pages)
export function generateStaticPolicyPages(beats = []) {
  console.log("[SEO Generator] Generating static crawler fallback pages (/privacy, /terms, /refund, /licensing, /beats)...");

  const pagesToGenerate = [
    {
      dirName: "beats",
      title: "Beats Catalog & Type Beats For Sale | DZVNbeats",
      description: "Browse high-quality trap, drill, and R&B type beats produced by DZVN. Audition, download free tagged beats, or purchase affordable commercial leases.",
      canonical: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}beats/`,
      spaRoute: "#/beats",
      headline: "DZVNbeats Studio Catalog",
      contentHtml: `
        <p>Explore all available instrumentals produced by DZVN. High-energy trap, melodic drill, and ambient R&amp;B type beats available for instant free tagged MP3 download and commercial untagged WAV licensing.</p>
        <h2>Available Beats:</h2>
        <ul>
          ${beats.map(b => `<li><strong>${escapeHtml(b.title)}</strong> • ${b.bpm || "140"} BPM • ${escapeHtml(b.key || "C Minor")} • <a href="${PRODUCTION_BASE}beat/${encodeURIComponent(b.id)}/">Listen to ${escapeHtml(b.title)}</a></li>`).join("\n          ")}
        </ul>
      `,
    },
    {
      dirName: "licensing",
      title: "Beat Licensing & Legal Terms | DZVNbeats",
      description: "Transparent beat licensing terms and official PDF agreements for DZVNbeats. 3 tiers: Free (Tagged), Basic Lease (₹200), and Exclusive Contract (₹1,000).",
      canonical: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}licensing/`,
      spaRoute: "#/licensing",
      headline: "Licensing & Legal Terms",
      contentHtml: `
        <p>Transparent, legally binding beat licenses under the Indian Copyright Act, 1957 and Indian Contract Act, 1872. Operated by music producer Denzven Vadakkan (DZVN / DZVNbeats) in Mumbai, Maharashtra, India.</p>
        <h2>Licensing Tiers:</h2>
        <ul>
          <li><strong>Free (Tagged) - ₹0:</strong> Non-commercial evaluation, demo creation, non-monetized streaming.</li>
          <li><strong>Basic Lease - ₹200:</strong> 50,000 commercial audio streams, 1 monetized music video, untagged WAV delivery.</li>
          <li><strong>Exclusive Contract - ₹1,000:</strong> Sole ownership transfer, track stems, unlimited distribution, Culture-First 100% artist recoupment up to ₹2,000.</li>
        </ul>
        <p>Download official signed PDF agreements directly from the studio license center.</p>
      `,
    },
    {
      dirName: "privacy",
      title: "Privacy Policy | DZVNbeats",
      description: "DZVNbeats Privacy Policy. Transparent data handling, zero ad tracking, client-side browser storage, and IT Act 2000 compliance.",
      canonical: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}privacy/`,
      spaRoute: "#/privacy",
      headline: "DZVNbeats Privacy Policy",
      contentHtml: `
        <p>DZVNbeats is operated by music producer Denzven Vadakkan in Mumbai, Maharashtra, India. We prioritize privacy, data autonomy, and digital ethics.</p>
        <h2>Key Data Practices:</h2>
        <ul>
          <li><strong>Zero Advertising Tracking:</strong> We do not deploy third-party advertising cookies or cross-site profiling trackers.</li>
          <li><strong>Client-Side Storage:</strong> Audio player state and volume preferences remain local to your browser storage.</li>
          <li><strong>Inquiry Data:</strong> Contact details submitted for beat licensing are used exclusively to execute agreements and deliver audio stems.</li>
          <li><strong>Statutory Compliance:</strong> Compliant with the Information Technology Act, 2000 and global data protection principles.</li>
        </ul>
        <p>Grievance Officer Contact: dzvn.beats@gmail.com</p>
      `,
    },
    {
      dirName: "terms",
      title: "Terms of Service | DZVNbeats",
      description: "Terms of Service for DZVNbeats. Binding legal covenants, acceptable use, Content ID registration prohibitions, liability limitations, and Mumbai jurisdiction.",
      canonical: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}terms/`,
      spaRoute: "#/terms",
      headline: "Terms of Service",
      contentHtml: `
        <p>These Terms of Service govern your use of DZVNbeats and all licensing agreements entered into with Denzven Vadakkan (DZVN / DZVNbeats).</p>
        <h2>Key Terms &amp; Restrictions:</h2>
        <ul>
          <li><strong>Intellectual Property:</strong> All beats and arrangements are protected under the Indian Copyright Act, 1957.</li>
          <li><strong>Content ID Prohibition:</strong> Licensees of Free (Tagged) and Basic Leases are strictly prohibited from submitting songs to YouTube Content ID or acoustic fingerprinting.</li>
          <li><strong>Mandatory Credit:</strong> Commercial releases must state "(Prod. DZVN)" or "(Prod. by DZVNbeats)".</li>
          <li><strong>Limitation of Liability:</strong> Total liability capped strictly to the actual license fee paid under Sections 73 &amp; 74 of the Indian Contract Act, 1872.</li>
          <li><strong>Jurisdiction:</strong> Exclusive jurisdiction of the competent civil courts in Mumbai, Maharashtra, India.</li>
        </ul>
      `,
    },
    {
      dirName: "refund",
      title: "Refund & Cancellation Policy | DZVNbeats",
      description: "DZVNbeats Refund & Cancellation Policy for digital audio goods, WAV files, track stems, and licensing agreements.",
      canonical: `${PRODUCTION_ORIGIN}${PRODUCTION_BASE}refund/`,
      spaRoute: "#/refund",
      headline: "Refund & Cancellation Policy",
      contentHtml: `
        <p>DZVNbeats provides intangible digital goods (uncompressed 24-bit WAV audio files, separated stem archives, and legal licensing contracts).</p>
        <h2>Digital Goods Policy:</h2>
        <ul>
          <li><strong>General Rule:</strong> Digital download sales are final once delivered electronically.</li>
          <li><strong>Eligible Exceptions:</strong> Accidental duplicate transactions, corrupt audio files unresolved within 48 hours, or non-delivery of purchased files.</li>
          <li><strong>How to Claim:</strong> Email dzvn.beats@gmail.com within 7 days of transaction with your proof of payment.</li>
        </ul>
      `,
    },
  ];

  for (const page of pagesToGenerate) {
    const targetFolder = path.join(publicDir, page.dirName);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
    <link rel="icon" type="image/png" href="../favicon.png" />
    <link rel="canonical" href="${page.canonical}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="DZVNbeats" />
    <meta property="og:url" content="${page.canonical}" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:image" content="${PRODUCTION_ORIGIN}${PRODUCTION_BASE}banner.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${PRODUCTION_ORIGIN}${PRODUCTION_BASE}banner.png" />

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": ${JSON.stringify(page.headline)},
      "description": ${JSON.stringify(page.description)},
      "url": "${page.canonical}",
      "publisher": {
        "@type": "Organization",
        "name": "DZVNbeats",
        "url": "${PRODUCTION_ORIGIN}${PRODUCTION_BASE}",
        "logo": "${PRODUCTION_ORIGIN}${PRODUCTION_BASE}pwa-192x192.png"
      }
    }
    </script>

    <!-- Instant SPA Redirect for Human Users -->
    <script>
      (function() {
        var base = "/";
        var parts = window.location.pathname.split("/").filter(Boolean);
        if (
          window.location.hostname.endsWith("github.io") ||
          (parts[0] && parts[0].toLowerCase() === "dzvnbeats")
        ) {
          base = "/" + (parts[0] || "DZVNbeats") + "/";
        }
        window.location.replace(base + "${page.spaRoute}");
      })();
    </script>
    <meta http-equiv="refresh" content="0; url=${PRODUCTION_BASE}${page.spaRoute}" />

    <style>
      body {
        margin: 0;
        background: #09090b;
        color: #f4f4f5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        padding: 40px 20px;
        line-height: 1.6;
        display: flex;
        justify-content: center;
      }
      .content {
        max-width: 720px;
        width: 100%;
        background: #18181b;
        border: 1px solid #27272a;
        border-radius: 16px;
        padding: 32px;
      }
      h1 { font-size: 1.8rem; margin-top: 0; color: #fff; }
      h2 { font-size: 1.25rem; color: #e4e4e7; margin-top: 24px; border-bottom: 1px solid #27272a; padding-bottom: 8px; }
      p, li { color: #a1a1aa; font-size: 0.95rem; }
      a { color: #34d399; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .btn {
        display: inline-block;
        background: #fff;
        color: #09090b;
        font-weight: 700;
        padding: 10px 18px;
        border-radius: 8px;
        margin-top: 16px;
      }
    </style>
  </head>
  <body>
    <main class="content">
      <h1>${escapeHtml(page.headline)}</h1>
      ${page.contentHtml}
      <p style="margin-top: 24px;">
        <a class="btn" href="${PRODUCTION_BASE}${page.spaRoute}">Open in Studio App →</a>
      </p>
    </main>
  </body>
</html>
`;

    fs.writeFileSync(path.join(targetFolder, "index.html"), html, "utf-8");
  }

  console.log("✅ [SEO Generator] Generated static fallback pages for /beats, /licensing, /privacy, /terms, /refund.");
}

// Run directly if invoked from command line
if (process.argv[1] && process.argv[1].endsWith("generate-beat-pages.js")) {
  generateBeatPages();
}
