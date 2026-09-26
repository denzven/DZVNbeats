import fs from "fs";
import path from "path";
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { fileURLToPath } from "url";
import { parseFile } from "music-metadata";
import { Jimp } from "jimp";
import { generateManifest } from "../generate-manifest.js";
import { verifyCatalog } from "./verify-catalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const publicBeatsDir = path.join(rootDir, "public", "beats");
const publicCoversDir = path.join(rootDir, "public", "covers");
const defaultLogoPath = path.join(rootDir, "public", "DZVNbeats_pfp.jpeg");
const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");

// Audio & Image Extensions
const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function cleanPath(p) {
  if (!p) return "";
  return p.trim().replace(/^['"]|['"]$/g, "");
}

function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--file=")) {
      options.file = cleanPath(arg.slice(7));
    } else if (arg === "--file" && args[i + 1]) {
      options.file = cleanPath(args[++i]);
    } else if (arg.startsWith("--title=")) {
      options.title = arg.slice(8).trim();
    } else if (arg === "--title" && args[i + 1]) {
      options.title = args[++i].trim();
    } else if (arg.startsWith("--bpm=")) {
      options.bpm = parseInt(arg.slice(6), 10);
    } else if (arg === "--bpm" && args[i + 1]) {
      options.bpm = parseInt(args[++i], 10);
    } else if (arg.startsWith("--key=")) {
      options.key = arg.slice(6).trim();
    } else if (arg === "--key" && args[i + 1]) {
      options.key = args[++i].trim();
    } else if (arg.startsWith("--tier=")) {
      options.tier = arg.slice(7).trim().toLowerCase();
    } else if (arg.startsWith("--status=")) {
      options.status = arg.slice(9).trim().toLowerCase();
    } else if (arg.startsWith("--tag=")) {
      options.tagged = arg.slice(6).trim().toLowerCase();
    } else if (arg.startsWith("--cover=")) {
      options.cover = cleanPath(arg.slice(8));
    } else if (arg === "--cover" && args[i + 1]) {
      options.cover = cleanPath(args[++i]);
    } else if (arg.startsWith("--tags=")) {
      options.tags = arg.slice(7).split(",").map((t) => t.trim()).filter(Boolean);
    } else if (!arg.startsWith("-") && !options.file) {
      options.file = cleanPath(arg);
    }
  }
  return options;
}

function findUncatalogedFiles() {
  if (!fs.existsSync(publicBeatsDir)) return [];
  let registeredFiles = new Set();
  if (fs.existsSync(beatsJsonPath)) {
    try {
      const beats = JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
      registeredFiles = new Set(beats.map((b) => b.filename));
    } catch {}
  }

  const diskFiles = fs
    .readdirSync(publicBeatsDir)
    .filter((f) => !f.startsWith(".") && f !== "index.html");

  return diskFiles.filter(
    (f) => audioExtensions.has(path.extname(f).toLowerCase()) && !registeredFiles.has(f),
  );
}

async function uploadBeat() {
  console.log("============================================================");
  console.log("🎵  DZVNbeats Studio • Song Uploader & Catalog Wizard");
  console.log("============================================================\n");

  const cliOpts = parseCliArgs();
  let rl = null;
  const isInteractive = !cliOpts.file || (!cliOpts.bpm && !cliOpts.key);

  if (isInteractive) {
    rl = readline.createInterface({ input, output });
  }

  const ask = async (query, defaultValue) => {
    if (!rl) return defaultValue;
    const promptText = defaultValue !== undefined ? `${query} [${defaultValue}]: ` : `${query}: `;
    const answer = await rl.question(promptText);
    return answer.trim() ? answer.trim() : defaultValue;
  };

  try {
    let sourceFilePath = cliOpts.file;

    // Check for uncataloged files if no file argument was supplied
    if (!sourceFilePath && isInteractive) {
      const uncataloged = findUncatalogedFiles();
      if (uncataloged.length > 0) {
        console.log(`💡 Detected ${uncataloged.length} uncataloged audio file(s) in public/beats/:`);
        uncataloged.forEach((f, i) => console.log(`   ${i + 1}) ${f}`));
        console.log("");
        const pick = await ask(
          `Select a file number (1-${uncataloged.length}) or enter external path`,
          "1",
        );
        const pickNum = parseInt(pick, 10);
        if (!isNaN(pickNum) && pickNum >= 1 && pickNum <= uncataloged.length) {
          sourceFilePath = path.join(publicBeatsDir, uncataloged[pickNum - 1]);
        } else {
          sourceFilePath = cleanPath(pick);
        }
      }
    }

    // Prompt for file path if still not determined
    while (!sourceFilePath) {
      const inputPath = await ask("📁 Enter path to your audio file (or drag & drop WAV/MP3)");
      const cleaned = cleanPath(inputPath);
      if (fs.existsSync(cleaned)) {
        sourceFilePath = cleaned;
        break;
      }
      console.log(`❌ File not found at: '${cleaned}'. Please try again.`);
    }

    if (!fs.existsSync(sourceFilePath)) {
      console.error(`❌ Source audio file does not exist: '${sourceFilePath}'`);
      process.exit(1);
    }

    const fileExt = path.extname(sourceFilePath).toLowerCase();
    if (!audioExtensions.has(fileExt)) {
      console.error(`❌ Unsupported audio format '${fileExt}'. Supported: ${Array.from(audioExtensions).join(", ")}`);
      process.exit(1);
    }

    console.log(`\n🎧 Inspecting audio metadata from '${path.basename(sourceFilePath)}'...`);

    // Parse audio metadata using music-metadata
    let metadata = null;
    try {
      metadata = await parseFile(sourceFilePath);
    } catch (err) {
      console.warn("⚠️ Could not read ID3 metadata:", err.message);
    }

    const common = metadata?.common || {};
    const format = metadata?.format || {};
    const durationSec = format.duration ? Math.round(format.duration) : null;
    const durationFormatted = durationSec
      ? `${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
      : "Unknown";

    console.log(`   • Format:   ${format.container || fileExt.replace(".", "").toUpperCase()} (${durationFormatted})`);
    console.log(`   • Bitrate:  ${format.bitrate ? Math.round(format.bitrate / 1000) + " kbps" : "Lossless"}`);
    if (common.title) console.log(`   • ID3 Title: ${common.title}`);
    if (common.bpm) console.log(`   • ID3 BPM:   ${common.bpm}`);
    if (common.key) console.log(`   • ID3 Key:   ${common.key}`);

    // Determine initial defaults
    const rawBaseName = path.basename(sourceFilePath, fileExt);

    let defaultTitle = common.title || rawBaseName
      .replace(/^DZVN_/i, "")
      .replace(/_\d+BPM.*/i, "")
      .replace(/[-_]/g, " ")
      .trim();
    defaultTitle = defaultTitle
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    let defaultBpm = cliOpts.bpm || (common.bpm ? Math.round(common.bpm) : null);
    if (!defaultBpm) {
      const match = rawBaseName.match(/(\d+)\s*BPM/i);
      if (match) defaultBpm = parseInt(match[1], 10);
    }
    if (!defaultBpm) defaultBpm = 120;

    let defaultKey = cliOpts.key || common.key || common.initialKey || null;
    if (!defaultKey) {
      const keyMatch = rawBaseName.match(/([A-G](?:sharp|flat|[#b])?(?:min|minor|maj|major|mjr))/i);
      if (keyMatch) {
        let k = keyMatch[1].toLowerCase().replace(/sharp/g, "#").replace(/flat/g, "b");
        const noteMatch = k.match(/^[a-g][#b]?/);
        if (noteMatch) {
          const note = noteMatch[0].toUpperCase();
          const scale = k.includes("maj") || k.includes("mjr") ? "major" : "minor";
          defaultKey = `${note} ${scale}`;
        }
      }
    }
    if (!defaultKey) defaultKey = "C minor";

    // Interactive or Flag Guided Configuration
    let title = cliOpts.title || defaultTitle;
    let bpm = cliOpts.bpm || defaultBpm;
    let key = cliOpts.key || defaultKey;
    let status = cliOpts.status || "Available";
    let tier = cliOpts.tier || "Standard";
    let isTagged = cliOpts.tagged ? cliOpts.tagged === "tagged" : false;
    let tags = cliOpts.tags || (common.genre ? common.genre : []);
    let coverImagePath = cliOpts.cover;

    if (isInteractive) {
      console.log("\n📝 Confirm Beat Details (press Enter to accept default):");
      title = await ask("1. Track Title", defaultTitle);
      bpm = parseInt(await ask("2. Tempo (BPM)", String(defaultBpm)), 10) || defaultBpm;
      key = await ask("3. Musical Key (e.g. C minor, G major, F# minor)", defaultKey);

      console.log("\n4. Licensing Tier:");
      console.log("   1) Standard Lease  (₹200 - Master Untagged WAV) [Recommended]");
      console.log("   2) Exclusive Rights (₹1,000 - Master WAV + Multi-track Stems)");
      console.log("   3) Free License     (₹0 - Voice Tagged MP3/WAV Audition)");
      const tierChoice = await ask("   Select tier (1-3)", "1");
      if (tierChoice === "2") tier = "Exclusive";
      else if (tierChoice === "3") tier = "Free";
      else tier = "Standard";

      console.log("\n5. License Status:");
      console.log("   1) Available [Active in Store]");
      console.log("   2) Sold      [Marked as Discontinued]");
      const statusChoice = await ask("   Select status (1-2)", "1");
      status = statusChoice === "2" ? "Sold" : "Available";

      console.log("\n6. Audio Mix Version:");
      console.log("   1) Untagged (Clean master studio mix) [Recommended for paid tiers]");
      console.log("   2) Tagged   (Includes periodic DZVN voice watermark)");
      const defaultTagChoice = tier === "Free" ? "2" : "1";
      const tagChoice = await ask("   Select version (1-2)", defaultTagChoice);
      isTagged = tagChoice === "2";

      const tagsPrompt = tags.length > 0 ? tags.join(", ") : "Trap, Hip Hop";
      const tagsAnswer = await ask("\n7. Genre Tags (comma separated)", tagsPrompt);
      tags = tagsAnswer.split(",").map((t) => t.trim()).filter(Boolean);
    }

    // Slug and sanitized tokens
    const cleanTitle = title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
    const cleanKey = key.replace(/\s+/g, "").replace(/#/g, "sharp").replace(/b/g, "flat");
    const statusToken = status === "Sold" ? "sold" : "ava";
    const tierToken = tier === "Free" ? "free" : tier === "Exclusive" ? "ex" : "std";
    const tagToken = isTagged ? "Tagged" : "Untagged";

    // Standardized target filename:
    // DZVN_[Title]_[BPM]BPM_[Key]_[Status]_[Tier]_[Tagged/Untagged].[ext]
    const targetFilename = `DZVN_${cleanTitle}_${bpm}BPM_${cleanKey}_${statusToken}_${tierToken}_${tagToken}${fileExt}`;
    const targetAudioPath = path.join(publicBeatsDir, targetFilename);

    // Compute Beat ID slug
    const beatSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const targetCoverFilename = `${beatSlug}-cover.jpg`;
    const targetCoverPath = path.join(publicCoversDir, targetCoverFilename);

    // Cover Art Resolution
    let coverSourceResolved = false;

    // 1. Check if user specified a cover image
    if (coverImagePath && fs.existsSync(coverImagePath)) {
      fs.copyFileSync(coverImagePath, targetCoverPath);
      coverSourceResolved = true;
      console.log(`🖼️ [Cover Art] Copied custom cover: ${path.basename(coverImagePath)} -> ${targetCoverFilename}`);
    }

    // 2. Check if audio file has embedded ID3 picture
    if (!coverSourceResolved && common.picture && common.picture.length > 0) {
      let useEmbedded = true;
      if (isInteractive) {
        const confirmPic = await ask(
          `🖼️ Found embedded artwork in audio file (${common.picture[0].format}). Use this cover?`,
          "Y",
        );
        useEmbedded = confirmPic.toLowerCase().startsWith("y");
      }
      if (useEmbedded) {
        fs.writeFileSync(targetCoverPath, common.picture[0].data);
        coverSourceResolved = true;
        console.log(`🖼️ [Cover Art] Extracted embedded artwork -> ${targetCoverFilename}`);
      }
    }

    // 3. Check if user dropped a companion image (e.g. MyBeat.jpg alongside MyBeat.wav)
    if (!coverSourceResolved) {
      const sourceDir = path.dirname(sourceFilePath);
      for (const imgExt of imageExtensions) {
        const companionPath = path.join(sourceDir, `${rawBaseName}${imgExt}`);
        if (fs.existsSync(companionPath)) {
          fs.copyFileSync(companionPath, targetCoverPath);
          coverSourceResolved = true;
          console.log(`🖼️ [Cover Art] Detected companion artwork -> ${targetCoverFilename}`);
          break;
        }
      }
    }

    // 4. Prompt user for cover image path if interactive and still not resolved
    if (!coverSourceResolved && isInteractive) {
      console.log("\n🖼️ Cover Artwork:");
      const manualImg = await ask(
        "Enter path to image (or drag & drop JPG/PNG), or press Enter to generate branded cover",
        "",
      );
      const cleanImg = cleanPath(manualImg);
      if (cleanImg && fs.existsSync(cleanImg)) {
        fs.copyFileSync(cleanImg, targetCoverPath);
        coverSourceResolved = true;
        console.log(`🖼️ [Cover Art] Copied artwork -> ${targetCoverFilename}`);
      }
    }

    // 5. Fallback: Generate branded cover using DZVN logo
    if (!coverSourceResolved) {
      if (fs.existsSync(defaultLogoPath)) {
        try {
          const logoImg = await Jimp.read(defaultLogoPath);
          await logoImg.resize({ w: 600, h: 600 }).write(targetCoverPath);
          coverSourceResolved = true;
          console.log(`🖼️ [Cover Art] Generated branded studio artwork -> ${targetCoverFilename}`);
        } catch (jimpErr) {
          fs.copyFileSync(defaultLogoPath, targetCoverPath);
          coverSourceResolved = true;
        }
      }
    }

    // Process audio file and inject ID3 tags + embedded artwork via FFmpeg
    console.log(`\n📦 Processing & tagging audio -> 'public/beats/${targetFilename}'...`);
    const year = new Date().getFullYear().toString();
    const genreStr = tags.length > 0 ? tags.join(", ") : "Hip-Hop / Trap";
    const commentStr = "Produced by DZVN | https://dzvnbeats.com";

    const isMp3 = fileExt === ".mp3";
    const isWav = fileExt === ".wav";
    const hasCover = fs.existsSync(targetCoverPath);

    // If source and target are different, or we need to tag it
    const tempCopyPath = path.join(publicBeatsDir, `temp_tagging_${Date.now()}${fileExt}`);
    fs.copyFileSync(sourceFilePath, tempCopyPath);

    const ffmpegArgs = ["-y", "-i", tempCopyPath];
    if (isMp3 && hasCover) {
      ffmpegArgs.push(
        "-i", targetCoverPath,
        "-map", "0:a",
        "-map", "1:0",
        "-c:a", "copy",
        "-c:v", "copy",
        "-id3v2_version", "3",
        "-metadata:s:v", "title=Album cover",
        "-metadata:s:v", "comment=Cover (front)",
        "-disposition:v:0", "attached_pic"
      );
    } else if (isWav) {
      ffmpegArgs.push("-write_id3v2", "1", "-c:a", "copy");
    } else {
      ffmpegArgs.push("-c:a", "copy");
    }

    ffmpegArgs.push(
      "-metadata", `title=${title}`,
      "-metadata", "artist=DZVN",
      "-metadata", "album=DZVNbeats",
      "-metadata", `genre=${genreStr}`,
      "-metadata", `date=${year}`,
      "-metadata", `year=${year}`,
      "-metadata", `comment=${commentStr}`,
      targetAudioPath
    );

    try {
      const { spawnSync } = await import("child_process");
      const res = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf-8" });
      if (res.status === 0) {
        console.log(`✨ [FFmpeg] Injected ID3 metadata and embedded cover art successfully!`);
      } else {
        console.warn(`⚠️ [FFmpeg Note] ${res.stderr || "Could not tag via FFmpeg, kept raw copy"}`);
        if (!fs.existsSync(targetAudioPath)) {
          fs.copyFileSync(tempCopyPath, targetAudioPath);
        }
      }
    } catch {
      if (!fs.existsSync(targetAudioPath)) {
        fs.copyFileSync(tempCopyPath, targetAudioPath);
      }
    } finally {
      try { fs.unlinkSync(tempCopyPath); } catch {}
    }

    console.log("⚡ Updating catalog manifest and generating SEO pages...");
    await generateManifest({ force: true });

    console.log("\n🔍 Running catalog audit verification...");
    verifyCatalog();

    console.log("\n============================================================");
    console.log("🎉  BEAT SUCCESSFULLY UPLOADED & READY FOR DIRECT LICENSING!");
    console.log("============================================================");
    console.log(`• Title:       ${title}`);
    console.log(`• Beat ID:     ${beatSlug}`);
    console.log(`• Filename:    ${targetFilename}`);
    console.log(`• BPM / Key:   ${bpm} BPM • ${key}`);
    console.log(`• Tier:        ${tier} (Price: ${tier === "Free" ? "FREE" : tier === "Exclusive" ? "₹1,000" : "₹200"})`);
    console.log(`• Status:      ${status}`);
    console.log(`• Audio Mix:   ${isTagged ? "Tagged (Preview)" : "Untagged (Master)"}`);
    console.log(`• Cover Art:   public/covers/${targetCoverFilename}`);
    console.log(`• Landing URL: public/beat/${beatSlug}/index.html`);
    console.log(`• Studio Test: http://localhost:3000/#/beats?play=${encodeURIComponent(beatSlug)}`);
    console.log("============================================================\n");
  } finally {
    if (rl) rl.close();
  }
}

uploadBeat().catch((err) => {
  console.error("❌ Upload failed:", err);
  process.exit(1);
});
