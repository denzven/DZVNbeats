import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");
const publicDir = path.join(rootDir, "public");
const defaultLogoPath = path.join(publicDir, "DZVNbeats_pfp.jpeg");
const outputDir = path.join(rootDir, "public", "videos");
const distDir = path.join(rootDir, "dist", "videos");

// Ensure output directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function loadBeats() {
  if (!fs.existsSync(beatsJsonPath)) {
    throw new Error("beats.json not found. Run 'npm run generate-manifest' first.");
  }
  return JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
}

export function renderBeatVideo(beat, options = {}) {
  return new Promise((resolve, reject) => {
    const isShorts = options.shorts || false;
    const formatLabel = isShorts ? "9:16 Shorts (1080x1920)" : "16:9 Longform (1920x1080)";

    const audioPath = path.join(publicDir, "beats", beat.filename);
    if (!fs.existsSync(audioPath)) {
      return reject(new Error(`Audio file not found: ${audioPath}`));
    }

    let coverPath = defaultLogoPath;
    if (beat.coverArt) {
      const candidate = path.join(rootDir, beat.coverArt.replace(/^\.\//, "public/"));
      if (fs.existsSync(candidate)) {
        coverPath = candidate;
      }
    }

    const outFilename = isShorts ? `${beat.id}-shorts.mp4` : `${beat.id}.mp4`;
    const outPath = path.join(outputDir, outFilename);

    console.log(`\n🎬 [Video Renderer] Rendering ${formatLabel} for '${beat.title}'...`);
    console.log(`   • Audio: ${path.basename(audioPath)}`);
    console.log(`   • Cover: ${path.basename(coverPath)}`);
    console.log(`   • Destination: public/videos/${outFilename}`);

    // High quality animated FFmpeg filter chain with audio visualizer
    let filterComplex = "";
    if (isShorts) {
      // 9:16 Shorts: Blurred cover background + centered cover + animated audio waveform ribbon below
      filterComplex =
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=30:5,eq=brightness=-0.4[bg];" +
        "[0:v]scale=860:860[fg];" +
        "[1:a:0]showwaves=s=860x140:mode=line:colors=0xfbbf24@0.9:scale=cbrt,format=yuva420p[wave];" +
        "[bg][fg]overlay=(W-w)/2:(H-h)/2-120[bg2];" +
        "[bg2][wave]overlay=(W-w)/2:(H/2)+360[v]";
    } else {
      // 16:9 Longform: Blurred cover background + centered cover + bottom audio visualizer wave
      filterComplex =
        "[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=25:5,eq=brightness=-0.45[bg];" +
        "[0:v]scale=680:680[fg];" +
        "[1:a:0]showwaves=s=1280x120:mode=line:colors=0xfbbf24@0.85:scale=cbrt,format=yuva420p[wave];" +
        "[bg][fg]overlay=(W-w)/2:(H-h)/2-40[bg2];" +
        "[bg2][wave]overlay=(W-w)/2:H-h-50[v]";
    }

    const ffmpegArgs = [
      "-loop", "1",
      "-framerate", "30",
      "-i", coverPath,
      "-i", audioPath,
      "-filter_complex", filterComplex,
      "-map", "[v]",
      "-map", "1:a:0",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "18",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "320k",
      "-shortest",
      outPath,
      "-y",
    ];

    const proc = spawn("ffmpeg", ffmpegArgs, { stdio: ["ignore", "pipe", "pipe"] });

    proc.stderr.on("data", (data) => {
      const line = data.toString();
      const timeMatch = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (timeMatch) {
        process.stdout.write(`   ⏳ Progress: ${timeMatch[1]}\r`);
      }
    });

    proc.on("close", (code) => {
      if (code === 0) {
        const stats = fs.statSync(outPath);
        const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
        try {
          fs.copyFileSync(outPath, path.join(distDir, outFilename));
        } catch {}
        console.log(`\n✅ [Video Renderer] Render complete: public/videos/${outFilename} (${sizeMb} MB)`);
        resolve(outPath);
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

async function main() {
  const beats = loadBeats();
  const args = process.argv.slice(2);
  const isShorts = args.includes("--shorts");
  const renderAll = args.includes("--all");

  const targetSlug = args.find((a) => !a.startsWith("-"));

  let selectedBeats = [];
  if (renderAll) {
    selectedBeats = beats;
  } else if (targetSlug) {
    const found = beats.find(
      (b) => b.id.toLowerCase() === targetSlug.toLowerCase() || b.title.toLowerCase() === targetSlug.toLowerCase(),
    );
    if (!found) {
      console.error(`❌ Beat '${targetSlug}' not found in beats.json catalog.`);
      console.log(`Available beats: ${beats.map((b) => b.id).join(", ")}`);
      process.exit(1);
    }
    selectedBeats = [found];
  } else {
    // Default to newest beat
    selectedBeats = [beats[0]];
    console.log(`💡 No beat specified. Selecting newest catalog beat: '${beats[0].title}' (${beats[0].id})`);
  }

  for (const beat of selectedBeats) {
    await renderBeatVideo(beat, { shorts: isShorts });
  }

  console.log(`\n🎉 All requested video renders finished successfully! Saved to 'public/videos/'\n`);
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("generate-video.js") || process.argv[1].includes("generate-video"))
) {
  main().catch((err) => {
    console.error("❌ Rendering failed:", err);
    process.exit(1);
  });
}
