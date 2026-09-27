import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Jimp } from "jimp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

/**
 * Packs PNG buffers into a multi-resolution Windows ICO file.
 * Modern browsers and OSes natively support PNGs inside ICO containers.
 */
function createIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved. Must always be 0.
  header.writeUInt16LE(1, 2); // Specifies image type: 1 for icon (.ico).
  header.writeUInt16LE(count, 4); // Number of images.

  let offset = 6 + count * 16;
  const dirEntries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color palette count (0 if >= 8bpp)
    entry.writeUInt8(0, 3); // Reserved (0)
    entry.writeUInt16LE(1, 4); // Color planes (1)
    entry.writeUInt16LE(32, 6); // Bits per pixel (32-bit RGBA)
    entry.writeUInt32LE(img.buffer.length, 8); // Size of the image data in bytes
    entry.writeUInt32LE(offset, 12); // Offset of image data from beginning of file
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([
    header,
    ...dirEntries,
    ...images.map((img) => img.buffer),
  ]);
}

async function generateIcons() {
  try {
    const imagePath = path.join(publicDir, "DZVNbeats_pfp.jpeg");
    console.log(`Reading source brand image from ${imagePath}...`);

    const image = await Jimp.read(imagePath);

    // 1. Generate PWA Icons (192x192 & 512x512)
    const buf192 = await image.clone().resize({ w: 192, h: 192 }).getBuffer("image/png");
    fs.writeFileSync(path.join(publicDir, "pwa-192x192.png"), buf192);
    console.log("✓ Generated pwa-192x192.png");

    const buf512 = await image.clone().resize({ w: 512, h: 512 }).getBuffer("image/png");
    fs.writeFileSync(path.join(publicDir, "pwa-512x512.png"), buf512);
    console.log("✓ Generated pwa-512x512.png");

    // 2. Generate Apple Touch Icon (180x180)
    const buf180 = await image.clone().resize({ w: 180, h: 180 }).getBuffer("image/png");
    fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), buf180);
    console.log("✓ Generated apple-touch-icon.png");

    // 3. Google Search Favicon Guidelines:
    // "Your favicon must be a multiple of 48px square, for example: 48x48px, 96x96px, 144x144px, etc."
    const buf48 = await image.clone().resize({ w: 48, h: 48 }).getBuffer("image/png");
    fs.writeFileSync(path.join(publicDir, "favicon-48x48.png"), buf48);
    console.log("✓ Generated favicon-48x48.png (Google Search 48px multiple)");

    const buf96 = await image.clone().resize({ w: 96, h: 96 }).getBuffer("image/png");
    fs.writeFileSync(path.join(publicDir, "favicon-96x96.png"), buf96);
    console.log("✓ Generated favicon-96x96.png (High-DPI 48px multiple)");

    // Standard favicon.png at 96x96 (crisp on Retina and compliant with 48px multiple)
    fs.writeFileSync(path.join(publicDir, "favicon.png"), buf96);
    console.log("✓ Generated favicon.png (96x96)");

    // 4. Generate multi-resolution favicon.ico (16x16, 32x32, 48x48)
    const buf16 = await image.clone().resize({ w: 16, h: 16 }).getBuffer("image/png");
    const buf32 = await image.clone().resize({ w: 32, h: 32 }).getBuffer("image/png");

    const icoBuffer = createIco([
      { width: 16, height: 16, buffer: buf16 },
      { width: 32, height: 32, buffer: buf32 },
      { width: 48, height: 48, buffer: buf48 },
    ]);
    fs.writeFileSync(path.join(publicDir, "favicon.ico"), icoBuffer);
    console.log("✓ Generated favicon.ico (16, 32, 48 multi-size ICO)");

    console.log("🎉 All brand icons generated successfully!");
  } catch (err) {
    console.error("Error generating icons:", err);
    process.exit(1);
  }
}

generateIcons();
