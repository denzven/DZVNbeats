import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");

const WEBSITE_ORIGIN = "https://denzven.github.io/DZVNbeats/";

export function generateYouTubeMetadata(beat, options = {}) {
  const artistVibe =
    options.artist ||
    (beat.tags && beat.tags.length > 0
      ? beat.tags.join(" x ")
      : "Travis Scott x Drake");

  const title = beat.title || "Untitled";
  const bpm = beat.bpm || 120;
  const key = beat.key || "C minor";
  const beatId = beat.id;
  const year = new Date().getFullYear();

  // 1. Title following exact template:
  // [FREE] "Title" | [Artist] x [Artist] Type Beat | DZVNbeats
  const freePrefix = beat.beatType === "Exclusive" ? "[EXCLUSIVE]" : "[FREE]";
  const videoTitle = `${freePrefix} "${title}" | ${artistVibe} Type Beat | DZVNbeats`;

  // Direct Beat Store Purchase URL
  const purchaseUrl = `${WEBSITE_ORIGIN}beat/${encodeURIComponent(beatId)}/`;
  const storeUrl = WEBSITE_ORIGIN;

  // 2. High-Reach Keyword Tag Bucket
  const keywords = [
    `${title.toLowerCase()} type beat`,
    `${artistVibe.toLowerCase()} type beat`,
    `free ${artistVibe.toLowerCase()} type beat`,
    `${artistVibe.toLowerCase()} type beat ${year}`,
    `${title.toLowerCase()}`,
    `${bpm} bpm type beat`,
    `${key.toLowerCase()} type beat`,
    "type beat",
    `type beat ${year}`,
    "free type beat",
    `free type beat ${year}`,
    "trap beat",
    "rap beat",
    "hard trap beat",
    "rap instrumental",
    "instrumental 2026",
    "DZVNbeats",
    "dzvn",
    "prod by dzvn",
  ];

  const cleanTags = Array.from(new Set(keywords));
  const tagString = cleanTags.join(", ");

  // 3. User's exact Description Template with dynamic variables
  const description = `${freePrefix} "${title}" | ${artistVibe} Type Beat | DZVNbeats

🛒 Purchase untagged / high-quality leases here: ${purchaseUrl}
🌐 Full Beat Store: ${storeUrl}

⚡ BEAT DETAILS:
• BPM: ${bpm}
• Key: ${key}
• Producer: DZVN (@DZVNbeats)

⚠️ USAGE TERMS:
* The free version of this beat is for non-profit / evaluation purposes only.
* You may upload your track to YouTube or SoundCloud, but it cannot be monetized. 
* Free downloads cannot be uploaded to streaming platforms (Spotify, Apple Music, etc.). 
* To release your song commercially, please purchase a lease from the link above.
* Credit required: Please include (Prod. DZVNbeats) in the title and description.
* License link: ${WEBSITE_ORIGIN}#/licensing

👇 CONNECT WITH DZVN:
Instagram: https://www.instagram.com/dzvn_editsss
Subscribe for new beats weekly: https://www.youtube.com/@dzvnbeats?sub_confirmation=1&feature=subscribe

© DZVNbeats. All rights reserved.

---
[Ignore Tags]
${tagString}`;

  return {
    title: videoTitle,
    description: description,
    tags: cleanTags,
    categoryId: "10", // 10 = Music on YouTube
    privacyStatus: options.privacy || "public",
    purchaseUrl: purchaseUrl,
  };
}

function main() {
  if (!fs.existsSync(beatsJsonPath)) {
    console.error("❌ beats.json not found. Run 'npm run generate-manifest' first.");
    process.exit(1);
  }
  const beats = JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
  const args = process.argv.slice(2);
  const targetSlug = args.find((a) => !a.startsWith("-")) || beats[0].id;

  const beat = beats.find(
    (b) =>
      b.id.toLowerCase() === targetSlug.toLowerCase() ||
      b.title.toLowerCase() === targetSlug.toLowerCase(),
  );

  if (!beat) {
    console.error(`❌ Beat '${targetSlug}' not found.`);
    process.exit(1);
  }

  const artistArg = args.find((a) => a.startsWith("--artist="));
  const artist = artistArg ? artistArg.split("=")[1] : undefined;

  const meta = generateYouTubeMetadata(beat, { artist });

  console.log("============================================================");
  console.log("📺 YOUTUBE METADATA PREVIEW (DZVN TEMPLATE)");
  console.log("============================================================\n");
  console.log(`📌 TITLE (${meta.title.length} chars):\n${meta.title}\n`);
  console.log(`🏷️ TAGS (${meta.tags.length} tags):\n${meta.tags.join(", ")}\n`);
  console.log(`📝 DESCRIPTION:\n${meta.description}\n`);
  console.log("============================================================\n");
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("youtube-metadata.js") ||
    process.argv[1].includes("youtube-metadata"))
) {
  main();
}
