import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");

const WEBSITE_ORIGIN = "https://denzven.github.io/DZVNbeats/";

export async function broadcastToDiscord(beat, webhookUrl) {
  if (!webhookUrl) {
    console.log("ℹ️ No Discord webhook URL configured. (Set DISCORD_WEBHOOK_URL in environment or pass as argument)");
    return;
  }

  const coverUrl = beat.coverArt
    ? `${WEBSITE_ORIGIN}${beat.coverArt.replace(/^\.\//, "")}`
    : `${WEBSITE_ORIGIN}banner.png`;

  const payload = {
    username: "DZVNbeats Studio",
    avatar_url: `${WEBSITE_ORIGIN}pwa-192x192.png`,
    embeds: [
      {
        title: `🔥 NEW BEAT DROP: "${beat.title}"`,
        description: `New instrumental released on DZVNbeats! Listen, audition tagged demo, or secure your instant commercial license.`,
        url: `${WEBSITE_ORIGIN}#/beats?play=${encodeURIComponent(beat.id)}`,
        color: 0xd4af37, // Gold accent
        fields: [
          { name: "Tempo", value: `${beat.bpm || "120"} BPM`, inline: true },
          { name: "Key", value: beat.key || "C minor", inline: true },
          { name: "Tier", value: `${beat.beatType || "Standard"} (₹${beat.price})`, inline: true },
        ],
        image: { url: coverUrl },
        footer: { text: "DZVNbeats • Direct Licensing & Studio Portfolio" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    console.log("✅ [Discord Broadcast] Successfully posted beat announcement to Discord!");
  } else {
    console.warn(`⚠️ [Discord Broadcast] Failed with status ${res.status}`);
  }
}
