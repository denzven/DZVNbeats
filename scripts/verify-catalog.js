import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const publicBeatsDir = path.join(rootDir, "public", "beats");
const publicCoversDir = path.join(rootDir, "public", "covers");
const publicBeatDir = path.join(rootDir, "public", "beat");
const publicContractsDir = path.join(rootDir, "public", "contracts");
const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");

export function verifyCatalog() {
  console.log("\n🔍 [Catalog Verification] Auditing DZVNbeats Studio Catalog...\n");

  const errors = [];
  const warnings = [];
  const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac"]);
  const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

  // 1. Check beats.json
  if (!fs.existsSync(beatsJsonPath)) {
    errors.push("Missing src/data/beats.json file. Run 'npm run generate-manifest'.");
    printSummary(errors, warnings, 0);
    return false;
  }

  let beats = [];
  try {
    beats = JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
    if (!Array.isArray(beats)) {
      errors.push("src/data/beats.json does not contain a JSON array.");
      printSummary(errors, warnings, 0);
      return false;
    }
  } catch (err) {
    errors.push(`Failed to parse src/data/beats.json: ${err.message}`);
    printSummary(errors, warnings, 0);
    return false;
  }

  console.log(`📊 Catalog contains ${beats.length} registered beat(s):\n`);

  const manifestFilenames = new Set();
  const manifestBeatIds = new Set();
  const manifestCovers = new Set();

  for (let i = 0; i < beats.length; i++) {
    const beat = beats[i];
    const indexStr = String(i + 1).padStart(2, "0");
    const beatRef = `[#${indexStr} - ${beat.title || beat.id || "Unknown"}]`;

    if (!beat.id) {
      errors.push(`${beatRef} Missing 'id' field.`);
    } else if (manifestBeatIds.has(beat.id)) {
      errors.push(`${beatRef} Duplicate beat ID: '${beat.id}'.`);
    } else {
      manifestBeatIds.add(beat.id);
    }

    if (!beat.filename) {
      errors.push(`${beatRef} Missing 'filename' property.`);
    } else {
      manifestFilenames.add(beat.filename);
      const audioPath = path.join(publicBeatsDir, beat.filename);
      if (!fs.existsSync(audioPath)) {
        errors.push(`${beatRef} Audio file not found on disk: 'public/beats/${beat.filename}'`);
      } else {
        const stat = fs.statSync(audioPath);
        if (stat.size === 0) {
          errors.push(`${beatRef} Audio file is empty (0 bytes): 'public/beats/${beat.filename}'`);
        }
      }
    }

    // Check metadata completeness
    if (!beat.bpm) {
      warnings.push(`${beatRef} BPM is missing or undefined.`);
    }
    if (!beat.key) {
      warnings.push(`${beatRef} Musical key signature is missing or undefined.`);
    }
    if (!beat.duration) {
      warnings.push(`${beatRef} Track duration is missing.`);
    }
    if (typeof beat.price !== "number") {
      warnings.push(`${beatRef} Price is not a valid number (${beat.price}).`);
    }

    // Check cover art
    if (!beat.coverArt) {
      warnings.push(`${beatRef} No cover artwork assigned.`);
    } else {
      const coverRelative = beat.coverArt.replace(/^\.\//, "");
      const coverPath = path.join(rootDir, "public", coverRelative);
      const coverBase = path.basename(coverRelative);
      manifestCovers.add(coverBase);

      if (!fs.existsSync(coverPath)) {
        errors.push(`${beatRef} Cover art file does not exist: '${beat.coverArt}'`);
      } else {
        const coverStat = fs.statSync(coverPath);
        if (coverStat.size === 0) {
          errors.push(`${beatRef} Cover art file is empty (0 bytes): '${beat.coverArt}'`);
        }
      }
    }

    // Check SEO landing page
    if (beat.id) {
      const seoPath = path.join(publicBeatDir, beat.id, "index.html");
      if (!fs.existsSync(seoPath)) {
        warnings.push(`${beatRef} SEO landing page missing: 'public/beat/${beat.id}/index.html' (run 'npm run generate-manifest')`);
      }
    }

    // Line summary per beat
    const statusPill = beat.status === "Sold" ? "🔴 SOLD" : "🟢 ACTIVE";
    const tierPill = beat.beatType || "Standard";
    const priceStr = beat.price === 0 ? "FREE" : `₹${beat.price}`;
    const coverStatus = beat.coverArt ? "🖼️ Cover OK" : "⚠️ No Cover";
    console.log(`  ${indexStr}. ${beat.title.padEnd(20)} | ${statusPill} | ${tierPill.padEnd(9)} | ${priceStr.padEnd(6)} | ${String(beat.bpm || "---").padStart(3)} BPM | ${(beat.key || "---").padEnd(8)} | ${coverStatus}`);
  }

  // 2. Check for orphaned audio files in public/beats
  if (fs.existsSync(publicBeatsDir)) {
    const diskAudioFiles = fs.readdirSync(publicBeatsDir);
    for (const file of diskAudioFiles) {
      const ext = path.extname(file).toLowerCase();
      if (audioExtensions.has(ext) && !manifestFilenames.has(file)) {
        warnings.push(`Orphaned audio file in public/beats/ not in catalog: '${file}'`);
      }
    }
  }

  // 3. Check for orphaned cover files in public/covers
  if (fs.existsSync(publicCoversDir)) {
    const diskCoverFiles = fs.readdirSync(publicCoversDir);
    for (const file of diskCoverFiles) {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.has(ext) && !manifestCovers.has(file)) {
        warnings.push(`Unused cover file in public/covers/: '${file}'`);
      }
    }
  }

  // 4. Check Contract PDFs
  const expectedContracts = [
    "DZVNbeats_Free_Tagged_License.pdf",
    "DZVNbeats_Basic_Lease_Agreement.pdf",
    "DZVNbeats_Exclusive_Contract.pdf",
  ];
  for (const cFile of expectedContracts) {
    const cPath = path.join(publicContractsDir, cFile);
    if (!fs.existsSync(cPath)) {
      errors.push(`Missing contract PDF: 'public/contracts/${cFile}' (run 'npm run generate-contracts')`);
    } else if (fs.statSync(cPath).size === 0) {
      errors.push(`Contract PDF is 0 bytes: 'public/contracts/${cFile}'`);
    }
  }

  printSummary(errors, warnings, beats.length);
  return errors.length === 0;
}

function printSummary(errors, warnings, beatCount) {
  console.log("\n------------------------------------------------------------");
  console.log("📋 AUDIT SUMMARY:");

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    for (const w of warnings) {
      console.log(`   - ${w}`);
    }
  }

  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}):`);
    for (const e of errors) {
      console.log(`   - ${e}`);
    }
    console.log("\n🚫 Catalog verification FAILED. Please address errors above.\n");
  } else {
    console.log(`\n✅ ALL CHECKS PASSED! ${beatCount} beat(s) ready for production & licensing.\n`);
  }
}

// Run directly if invoked from command line
if (
  process.argv[1] &&
  (process.argv[1].endsWith("verify-catalog.js") ||
    process.argv[1].includes("verify-catalog"))
) {
  const success = verifyCatalog();
  process.exit(success ? 0 : 1);
}
