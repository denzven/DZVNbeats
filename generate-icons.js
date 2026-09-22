import { Jimp } from "jimp";

async function generateIcons() {
  try {
    const imagePath = "./public/DZVNbeats_pfp.jpeg";
    console.log(`Reading image from ${imagePath}...`);

    // Read the image
    const image = await Jimp.read(imagePath);

    // Generate 192x192
    image.clone().resize({ w: 192, h: 192 }).write("./public/pwa-192x192.png");
    console.log("Generated pwa-192x192.png");

    // Generate 512x512
    image.clone().resize({ w: 512, h: 512 }).write("./public/pwa-512x512.png");
    console.log("Generated pwa-512x512.png");

    // Generate Apple touch icon (180x180)
    image
      .clone()
      .resize({ w: 180, h: 180 })
      .write("./public/apple-touch-icon.png");
    console.log("Generated apple-touch-icon.png");

    // Generate Favicon (32x32 PNG)
    image.clone().resize({ w: 32, h: 32 }).write("./public/favicon.png");
    console.log("Generated favicon.png");

    console.log("All icons generated successfully!");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

generateIcons();
