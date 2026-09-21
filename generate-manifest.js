import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseFile } from 'music-metadata';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicBeatsDir = path.join(__dirname, 'public', 'beats');
const publicCoversDir = path.join(__dirname, 'public', 'covers');
const srcDataDir = path.join(__dirname, 'src', 'data');
const outputFile = path.join(srcDataDir, 'beats.json');

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

async function generateManifest() {
  const files = fs.readdirSync(publicBeatsDir).filter(f => !f.startsWith('.'));
  const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
  const beats = [];

  for (let index = 0; index < files.length; index++) {
    let file = files[index];
    const ext = path.extname(file).toLowerCase();
    if (!audioExtensions.includes(ext)) continue;

    let originalFilePath = path.join(publicBeatsDir, file);

    // Sanitize web-unsafe URL characters (#, ?, %, spaces)
    let sanitizedFile = file
      .replace(/#/g, 'sharp')
      .replace(/\?/g, '')
      .replace(/%/g, '')
      .replace(/\s+/g, '_');

    if (sanitizedFile !== file) {
      const sanitizedFilePath = path.join(publicBeatsDir, sanitizedFile);
      fs.renameSync(originalFilePath, sanitizedFilePath);
      console.log(`🔧 [Sanitizer] Renamed file '${file}' -> '${sanitizedFile}'`);
      file = sanitizedFile;
      originalFilePath = sanitizedFilePath;
    }

    const basename = path.basename(file, ext);
    const beatId = `beat-${index + 1}-${basename.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    let embeddedMeta = null;
    try {
      embeddedMeta = await parseFile(originalFilePath);
    } catch (err) {
      console.warn(`[Metadata Note] No ID3 tags in ${file}:`, err.message);
    }

    const common = embeddedMeta?.common || {};

    // 1. Cover Art Extraction (Utmost Priority: Real Embedded ID3 Picture Frame)
    let coverArtUrl = null;

    if (common.picture && common.picture.length > 0) {
      try {
        const picture = common.picture[0];
        const imageExt = picture.format.includes('png') ? 'png' : 'jpg';
        const coverFilename = `${beatId}-cover.${imageExt}`;
        const coverPath = path.join(publicCoversDir, coverFilename);

        fs.writeFileSync(coverPath, picture.data);
        coverArtUrl = `./covers/${coverFilename}`;
        console.log(`🖼️ [Cover Art Extracted] Extracted ID3 artwork for ${file} -> ${coverFilename}`);
      } catch (imgErr) {
        console.warn(`Could not save cover image for ${file}:`, imgErr.message);
      }
    }

    // 2. Track Title (Utmost Priority: Real ID3 Title -> Clean Filename)
    let title = common.title ? common.title.trim() : null;
    if (!title) {
      title = basename
        .replace(/^DZVN_/i, '')
        .replace(/_\d+BPM.*/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/sharp/gi, '')
        .trim();
      title = title.split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // 3. BPM (Utmost Priority: Real ID3 BPM -> Filename BPM -> null)
    let bpm = common.bpm ? Math.round(common.bpm) : null;
    if (!bpm) {
      const bpmMatch = basename.match(/(\d+)\s*BPM/i);
      if (bpmMatch) bpm = parseInt(bpmMatch[1], 10);
    }

    // 4. Key Signature (Utmost Priority: Real ID3 Key -> Filename Key -> null)
    let key = common.key || common.initialKey || null;
    if (!key) {
      const keyMatch = file.match(/([A-G][#b]?\s*(?:min|maj|minor|major))/i);
      if (keyMatch) key = keyMatch[1].toUpperCase();
    }

    // 5. Genre / Tags (Utmost Priority: Real ID3 Genre -> null)
    let tags = [];
    if (common.genre && common.genre.length > 0) {
      tags = common.genre.map(g => g.trim());
    }

    // Web-safe URL
    const webSafeUrl = `./beats/${encodeURIComponent(file)}`;

    beats.push({
      id: beatId,
      title: title || file,
      filename: file,
      url: webSafeUrl,
      coverArt: coverArtUrl,
      bpm: bpm || undefined,
      key: key || undefined,
      tags: tags.length > 0 ? tags : [],
      price: 0
    });
  }

  fs.writeFileSync(outputFile, JSON.stringify(beats, null, 2));
  console.log(`✅ [Manifest Generator] Processed ${beats.length} real beat(s) into src/data/beats.json`);
}

generateManifest();
