import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicBeatsDir = path.join(__dirname, "public", "beats");
const publicCoversDir = path.join(__dirname, "public", "covers");
const publicBeatDir = path.join(__dirname, "public", "beat");
const srcDataDir = path.join(__dirname, "src", "data");
const outputFile = path.join(srcDataDir, "beats.json");
const cacheFile = path.join(srcDataDir, ".beats-manifest-cache.json");

// Ensure directories exist
if (!fs.existsSync(publicBeatsDir)) {
  fs.mkdirSync(publicBeatsDir, { recursive: true });
}
if (!fs.existsSync(publicCoversDir)) {
  fs.mkdirSync(publicCoversDir, { recursive: true });
}
if (!fs.existsSync(srcDataDir)) {
  fs.mkdirSync(srcDataDir, { recursive: true });
}

export async function generateManifest(options = {}) {
  const forceRebuild =
    options.force ||
    process.argv.includes("--force") ||
    process.argv.includes("-f");

  const audioExtensions = [".mp3", ".wav", ".m4a", ".ogg", ".flac"];
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

  const rawFiles = fs
    .readdirSync(publicBeatsDir)
    .filter((f) => !f.startsWith(".") && f !== "index.html");

  // Load disk cache if available
  let cache = { version: 1, files: {} };
  if (!forceRebuild && fs.existsSync(cacheFile)) {
    try {
      cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
      if (!cache.files) cache.files = {};
    } catch {
      cache = { version: 1, files: {} };
    }
  }

  // 1. Arrange Beats: Sort by explicit number prefix (01_, 02_) if present,
  // otherwise by file modified time descending (newest uploads first)
  const sortedFiles = rawFiles.sort((a, b) => {
    const numA = a.match(/^(\d+)[\s_-]/);
    const numB = b.match(/^(\d+)[\s_-]/);
    if (numA && numB) {
      return parseInt(numA[1], 10) - parseInt(numB[1], 10);
    }
    try {
      const statA = fs.statSync(path.join(publicBeatsDir, a));
      const statB = fs.statSync(path.join(publicBeatsDir, b));
      return statB.mtimeMs - statA.mtimeMs;
    } catch {
      return a.localeCompare(b);
    }
  });

  const beats = [];
  const usedBeatIds = new Set();
  const activeCoverFiles = new Set();
  const validAudioFiles = new Set();
  let cacheHits = 0;
  let cacheMisses = 0;

  for (let index = 0; index < sortedFiles.length; index++) {
    let file = sortedFiles[index];
    const ext = path.extname(file).toLowerCase();
    if (!audioExtensions.includes(ext)) continue;

    validAudioFiles.add(file);
    let originalFilePath = path.join(publicBeatsDir, file);

    // Sanitize web-unsafe URL characters (#, ?, %, spaces)
    let sanitizedFile = file
      .replace(/#/g, "sharp")
      .replace(/\?/g, "")
      .replace(/%/g, "")
      .replace(/\s+/g, "_");

    if (sanitizedFile !== file) {
      const sanitizedFilePath = path.join(publicBeatsDir, sanitizedFile);
      fs.renameSync(originalFilePath, sanitizedFilePath);
      console.log(
        `🔧 [Sanitizer] Renamed file '${file}' -> '${sanitizedFile}'`,
      );
      file = sanitizedFile;
      originalFilePath = sanitizedFilePath;
      validAudioFiles.delete(file);
      validAudioFiles.add(sanitizedFile);
    }

    const basename = path.basename(file, ext);
    let stats;
    try {
      stats = fs.statSync(originalFilePath);
    } catch (err) {
      console.warn(`Could not stat ${file}:`, err.message);
      continue;
    }

    // Check if this file can be served from cache
    const cachedEntry = cache.files[file];
    const isCached =
      !forceRebuild &&
      cachedEntry &&
      cachedEntry.mtimeMs === stats.mtimeMs &&
      cachedEntry.size === stats.size &&
      cachedEntry.beat &&
      (!cachedEntry.coverFilename ||
        fs.existsSync(path.join(publicCoversDir, cachedEntry.coverFilename)));

    if (isCached) {
      const cachedBeat = cachedEntry.beat;
      usedBeatIds.add(cachedBeat.id);
      if (cachedEntry.coverFilename) {
        activeCoverFiles.add(cachedEntry.coverFilename);
      }
      beats.push(cachedBeat);
      cacheHits++;
      continue;
    }

    // Need to parse / extract metadata for this file
    cacheMisses++;
    let embeddedMeta = null;
    try {
      embeddedMeta = await parseFile(originalFilePath);
    } catch (err) {
      console.warn(`[Metadata Note] No ID3 tags in ${file}:`, err.message);
    }

    const common = embeddedMeta?.common || {};

    // 2. Extract Track Title First (ID3 Title -> Clean Filename)
    let title = common.title ? common.title.trim() : null;
    if (!title) {
      title = basename
        .replace(/^DZVN_/i, "")
        .replace(/_\d+BPM.*/i, "")
        .replace(/[-_]/g, " ")
        .replace(/sharp/gi, "")
        .trim();
      title = title
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    // 3. Professional Beat ID System
    let cleanSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!cleanSlug) {
      cleanSlug = `beat-${index + 1}`;
    }

    // Handle duplicate titles safely with increment
    let beatId = cleanSlug;
    let collisionCount = 1;
    while (usedBeatIds.has(beatId)) {
      collisionCount++;
      beatId = `${cleanSlug}-${collisionCount}`;
    }
    usedBeatIds.add(beatId);

    // Legacy IDs mapped for backwards compatibility
    const legacyIds = [
      `beat-${index + 1}-${basename.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      `dzvn-${cleanSlug}`,
    ];

    // 4. Professional Cover Art Extraction & External Cover Discovery
    let coverArtUrl = null;
    let coverFilename = null;

    if (common.picture && common.picture.length > 0) {
      try {
        const picture = common.picture[0];
        const imageExt = picture.format?.includes("png") ? "png" : "jpg";
        coverFilename = `${beatId}-cover.${imageExt}`;
        const coverPath = path.join(publicCoversDir, coverFilename);

        let shouldWrite = true;
        if (fs.existsSync(coverPath)) {
          const existingData = fs.readFileSync(coverPath);
          if (Buffer.compare(existingData, picture.data) === 0) {
            shouldWrite = false;
          }
        }

        if (shouldWrite) {
          fs.writeFileSync(coverPath, picture.data);
          console.log(
            `🖼️ [Cover Art] Saved ID3 artwork for ${file} -> ${coverFilename}`,
          );
        }

        coverArtUrl = `./covers/${coverFilename}`;
        activeCoverFiles.add(coverFilename);
      } catch (imgErr) {
        console.warn(`Could not save cover image for ${file}:`, imgErr.message);
      }
    }

    // If no embedded artwork was found, search for adjacent or pre-existing image
    if (!coverArtUrl) {
      // 1. Check if user dropped matching image in public/beats (e.g. Song.jpg)
      for (const imgExt of imageExtensions) {
        const adjacentImgPath = path.join(publicBeatsDir, `${basename}${imgExt}`);
        if (fs.existsSync(adjacentImgPath)) {
          coverFilename = `${beatId}-cover${imgExt}`;
          const targetCoverPath = path.join(publicCoversDir, coverFilename);
          fs.copyFileSync(adjacentImgPath, targetCoverPath);
          coverArtUrl = `./covers/${coverFilename}`;
          activeCoverFiles.add(coverFilename);
          console.log(
            `🖼️ [Cover Art] Detected adjacent artwork ${basename}${imgExt} -> ${coverFilename}`,
          );
          break;
        }
      }

      // 2. Check if cover already exists in public/covers/ (e.g. beatid-cover.jpg)
      if (!coverArtUrl) {
        for (const imgExt of imageExtensions) {
          const existingCover = `${beatId}-cover${imgExt}`;
          if (fs.existsSync(path.join(publicCoversDir, existingCover))) {
            coverFilename = existingCover;
            coverArtUrl = `./covers/${coverFilename}`;
            activeCoverFiles.add(coverFilename);
            break;
          }
        }
      }
    }

    // 5. BPM Extraction
    let bpm = common.bpm ? Math.round(common.bpm) : null;
    if (!bpm) {
      const bpmMatch = basename.match(/(\d+)\s*BPM/i);
      if (bpmMatch) bpm = parseInt(bpmMatch[1], 10);
    }

    // 6. Key Signature Extraction
    let key = common.key || common.initialKey || null;
    if (!key) {
      const keyMatch = file.match(
        /([A-G](?:sharp|flat|[#b])?(?:min|minor|maj|major|mjr))/i,
      );
      if (keyMatch) {
        let parsedKey = keyMatch[1].toLowerCase();
        parsedKey = parsedKey.replace(/sharp/g, "#").replace(/flat/g, "b");
        const noteMatch = parsedKey.match(/^[a-g][#b]?/);
        if (noteMatch) {
          let note = noteMatch[0];
          let scale = parsedKey.substring(note.length);
          if (scale.startsWith("mjr") || scale.startsWith("maj")) {
            scale = "major";
          } else if (scale.startsWith("min")) {
            scale = "minor";
          }
          note = note.charAt(0).toUpperCase() + note.slice(1);
          key = `${note} ${scale}`;
          if (scale === "minor" && note.length > 1) key = `${note}${scale}`;
        }
      }
    }

    // 7. Genre / Tags
    let tags = [];
    if (common.genre && common.genre.length > 0) {
      tags = common.genre.map((g) => g.trim());
    }

    // 8. Track Duration & Timestamps
    const durationSec = embeddedMeta?.format?.duration
      ? Math.round(embeddedMeta.format.duration)
      : null;
    const formattedDuration = durationSec
      ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
      : undefined;

    let createdAt = undefined;
    try {
      createdAt = stats.mtime.toISOString().split("T")[0];
    } catch {}

    // Web-safe URL
    const webSafeUrl = `./beats/${encodeURIComponent(file)}`;

    // Parse specific DZVN metadata
    // Standard format: ..._[ava|sold]_[free|std|ex]_[Tagged|Untagged]
    let status = "Available";
    let beatType = "Standard";
    let isTagged = false;
    let price = 200; // Standard license: INR 200

    const metaMatch = basename.match(
      /_(ava|sold)_(free|std|ex)_(tagged|untagged)$/i,
    );
    if (metaMatch) {
      const parsedStatus = metaMatch[1].toLowerCase();
      const parsedType = metaMatch[2].toLowerCase();
      const parsedTagged = metaMatch[3].toLowerCase();

      status = parsedStatus === "sold" ? "Sold" : "Available";
      isTagged = parsedTagged === "tagged";

      if (parsedType === "free") {
        beatType = "Free";
        price = 0;
      } else if (parsedType === "ex") {
        beatType = "Exclusive";
        price = 1000;
      } else {
        beatType = "Standard";
        price = 200;
      }
    } else {
      // Smart fallback inferences
      const lowerBase = basename.toLowerCase();
      if (lowerBase.includes("_sold")) status = "Sold";
      if (lowerBase.includes("_free") || lowerBase.includes("free_")) {
        beatType = "Free";
        price = 0;
      } else if (lowerBase.includes("_exclusive") || lowerBase.includes("_ex_")) {
        beatType = "Exclusive";
        price = 1000;
      }
      if (lowerBase.includes("tagged")) isTagged = true;
    }

    const beatObj = {
      id: beatId,
      title: title || file,
      filename: file,
      url: webSafeUrl,
      coverArt: coverArtUrl,
      bpm: bpm || undefined,
      key: key || undefined,
      tags: tags.length > 0 ? tags : [],
      price: price,
      duration: formattedDuration,
      status: status,
      beatType: beatType,
      isTagged: isTagged,
      legacyIds: legacyIds,
      createdAt: createdAt,
    };

    beats.push(beatObj);

    // Update cache entry
    cache.files[file] = {
      mtimeMs: stats.mtimeMs,
      size: stats.size,
      coverFilename: coverFilename,
      beat: beatObj,
    };
  }

  // Clean stale deleted files from cache
  for (const cachedFile of Object.keys(cache.files)) {
    if (!validAudioFiles.has(cachedFile)) {
      delete cache.files[cachedFile];
    }
  }

  // Check if output JSON actually changed
  let manifestChanged = true;
  if (fs.existsSync(outputFile)) {
    try {
      const existingRaw = fs.readFileSync(outputFile, "utf-8");
      if (existingRaw.trim() === JSON.stringify(beats, null, 2).trim()) {
        manifestChanged = false;
      }
    } catch {}
  }

  // Check if any SEO landing page is missing
  let allSeoPagesExist = true;
  if (!manifestChanged && fs.existsSync(publicBeatDir)) {
    for (const b of beats) {
      if (!fs.existsSync(path.join(publicBeatDir, b.id, "index.html"))) {
        allSeoPagesExist = false;
        break;
      }
    }
  } else {
    allSeoPagesExist = false;
  }

  if (!manifestChanged && allSeoPagesExist && !forceRebuild) {
    console.log(
      `⚡ [Manifest Generator] Catalog manifest is up to date (${beats.length} beats, all cached). Skipping re-parse.`,
    );
    return beats;
  }

  // Write beats manifest
  fs.writeFileSync(outputFile, JSON.stringify(beats, null, 2));
  fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

  console.log(
    `✅ [Manifest Generator] Processed ${beats.length} beat(s) into src/data/beats.json (${cacheMisses} parsed, ${cacheHits} cached)`,
  );

  // Garbage Collection: Remove duplicate/orphaned cover art
  const existingCovers = fs.readdirSync(publicCoversDir);
  let cleanedCount = 0;
  for (const coverFile of existingCovers) {
    if (coverFile.startsWith(".")) continue;
    if (!activeCoverFiles.has(coverFile)) {
      try {
        fs.unlinkSync(path.join(publicCoversDir, coverFile));
        cleanedCount++;
        console.log(
          `🧹 [Cover Cleanup] Removed duplicate/orphaned cover: ${coverFile}`,
        );
      } catch (err) {
        console.warn(
          `Could not delete orphaned cover ${coverFile}:`,
          err.message,
        );
      }
    }
  }
  if (cleanedCount > 0) {
    console.log(
      `✨ [Cover Cleanup] Cleaned up ${cleanedCount} duplicate cover image(s).`,
    );
  }

  // Generate static SEO landing pages
  try {
    const { generateBeatPages } = await import(
      "./scripts/generate-beat-pages.js"
    );
    generateBeatPages();
  } catch (err) {
    console.warn(
      "⚠️ [SEO Generator] Could not generate beat SEO pages:",
      err.message,
    );
  }

  return beats;
}

// Run directly if invoked from command line
if (
  process.argv[1] &&
  (process.argv[1].endsWith("generate-manifest.js") ||
    process.argv[1].includes("generate-manifest"))
) {
  generateManifest();
}
