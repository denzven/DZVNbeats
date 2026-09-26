import fs from "fs";
import path from "path";
import http from "http";
import { URL } from "url";
import { fileURLToPath } from "url";
import { renderBeatVideo } from "./generate-video.js";
import { generateYouTubeMetadata } from "./youtube-metadata.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const beatsJsonPath = path.join(rootDir, "src", "data", "beats.json");
const candidateSecretPaths = [
  path.join(rootDir, "client_secrets.json"),
  path.join(rootDir, "client.json"),
];
const candidateTokenPaths = [
  path.join(rootDir, ".youtube-token.json"),
  path.join(rootDir, "token.json"),
];

const secretsPath = candidateSecretPaths[0];
let tokenPath = candidateTokenPaths[0];

const videosDir = path.join(rootDir, "dist", "videos");

const REDIRECT_PORT = 8989;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth2callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
];

function loadSecrets() {
  const found = candidateSecretPaths.find((p) => fs.existsSync(p));
  if (!found) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(found, "utf-8"));
    const data = raw.installed || raw.web || raw;

    let redirectUri = "http://localhost:8080/oauth2callback";
    let port = 8080;
    let pathname = "/oauth2callback";

    if (raw.installed) {
      // Desktop app: Google registers "http://localhost", redirect_uri must match without subpath
      port = 8080;
      pathname = "/";
      redirectUri = `http://localhost:${port}`;
    } else if (data.redirect_uris && data.redirect_uris.length > 0) {
      const match =
        data.redirect_uris.find((u) => u.includes("callback")) ||
        data.redirect_uris[0];
      try {
        const parsed = new URL(match);
        port = parseInt(parsed.port || "8080", 10);
        pathname = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/oauth2callback";
        redirectUri = `${parsed.protocol}//${parsed.hostname}:${port}${pathname}`;
      } catch {}
    }

    return {
      clientId: data.client_id,
      clientSecret: data.client_secret,
      redirectUri,
      port,
      pathname,
      isDesktop: !!raw.installed,
    };
  } catch (err) {
    console.error(`❌ Failed to parse ${path.basename(found)}:`, err.message);
    return null;
  }
}

function loadToken() {
  const found = candidateTokenPaths.find((p) => fs.existsSync(p));
  if (!found) return null;
  tokenPath = found;
  try {
    return JSON.parse(fs.readFileSync(found, "utf-8"));
  } catch {
    return null;
  }
}

async function refreshAccessToken(secrets, token) {
  if (!token.refresh_token) {
    throw new Error("No refresh_token found in .youtube-token.json. Please re-authenticate.");
  }
  const params = new URLSearchParams({
    client_id: secrets.clientId,
    client_secret: secrets.clientSecret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Failed to refresh YouTube token: ${errorBody}`);
  }

  const data = await res.json();
  const updatedToken = {
    ...token,
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  fs.writeFileSync(tokenPath, JSON.stringify(updatedToken, null, 2));
  return updatedToken.access_token;
}

async function getValidAccessToken(secrets) {
  let token = loadToken();
  if (!token) {
    token = await authenticateOAuth(secrets);
  } else if (!token.expires_at || Date.now() >= token.expires_at - 60000) {
    console.log("🔄 Refreshing expired YouTube access token...");
    return await refreshAccessToken(secrets, token);
  }
  return token.access_token;
}

function authenticateOAuth(secrets) {
  return new Promise((resolve, reject) => {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(secrets.clientId)}&` +
      `redirect_uri=${encodeURIComponent(secrets.redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(SCOPES.join(" "))}&` +
      `access_type=offline&` +
      `prompt=consent`;

    console.log("\n============================================================");
    console.log("🔐 YOUTUBE ONE-TIME OAUTH AUTHORIZATION");
    console.log("============================================================");
    console.log("Opening your browser to authorize your YouTube channel...");
    console.log(`\nIf the browser does not open automatically, visit this URL:\n👉 ${authUrl}\n`);
    console.log(`Waiting for local callback on ${secrets.redirectUri}...`);

    // Auto-open browser on Windows
    try {
      import("child_process").then(({ exec }) => {
        exec(`start "" "${authUrl}"`);
      });
    } catch {}

    const server = http.createServer(async (req, res) => {
      try {
        const reqUrl = new URL(req.url, `http://localhost:${secrets.port}`);
        if (
          reqUrl.pathname === secrets.pathname ||
          reqUrl.pathname === "/oauth2callback" ||
          reqUrl.pathname === "/"
        ) {
          const error = reqUrl.searchParams.get("error");
          if (error) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end(
              `<div style='font-family:sans-serif;padding:40px;color:#ef4444;text-align:center;'><h2>⚠️ Google Authorization Refused</h2><p>Error: ${error}</p><p>Ensure your Google account is added to <strong>Test users</strong> in Google Cloud Console.</p></div>`,
            );
            server.close();
            reject(new Error(`OAuth error returned by Google: ${error}`));
            return;
          }

          const code = reqUrl.searchParams.get("code");
          if (!code) {
            res.writeHead(400, { "Content-Type": "text/html" });
            res.end("<h1>Authentication failed: No code received.</h1>");
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<div style='font-family:sans-serif;text-align:center;padding:50px;'><h1 style='color:#10b981;'>🎉 DZVNbeats Authorized Successfully!</h1><p style='color:#6b7280;font-size:16px;'>You can close this window now. Return to your terminal to continue.</p></div>",
          );
          server.close();

          // Exchange code for tokens
          const tokenParams = new URLSearchParams({
            code: code,
            client_id: secrets.clientId,
            client_secret: secrets.clientSecret,
            redirect_uri: secrets.redirectUri,
            grant_type: "authorization_code",
          });

          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: tokenParams.toString(),
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            throw new Error(`Token exchange failed: ${errText}`);
          }

          const tokenData = await tokenRes.json();
          const tokenPayload = {
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_at: Date.now() + tokenData.expires_in * 1000,
          };
          fs.writeFileSync(tokenPath, JSON.stringify(tokenPayload, null, 2));
          console.log("✅ [YouTube Auth] Saved credentials to .youtube-token.json");
          resolve(tokenPayload);
        }
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.on("error", (err) => {
      console.error(`❌ Local auth server error on port ${secrets.port}:`, err.message);
      reject(err);
    });

    server.listen(secrets.port, () => {
      console.log(`🌐 Local callback server listening on http://localhost:${secrets.port}${secrets.pathname}`);
    });
  });
}

async function uploadVideoToYouTube(videoPath, metadata, accessToken) {
  const fileStats = fs.statSync(videoPath);
  const fileSize = fileStats.size;

  console.log(`\n📤 [YouTube Upload] Initializing resumable upload (${(fileSize / (1024 * 1024)).toFixed(2)} MB)...`);

  const initialBody = {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: metadata.categoryId,
    },
    status: {
      privacyStatus: metadata.privacyStatus || "public",
      selfDeclaredMadeForKids: false,
    },
  };

  // 1. Initialize Resumable Upload Session
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(fileSize),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(initialBody),
    },
  );

  if (!initRes.ok) {
    const errorText = await initRes.text();
    throw new Error(`YouTube init upload failed (${initRes.status}): ${errorText}`);
  }

  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) {
    throw new Error("No upload location returned by YouTube API.");
  }

  // 2. Stream video file to uploadUrl
  console.log("🚀 [YouTube Upload] Uploading video binary to YouTube servers...");
  const videoBuffer = fs.readFileSync(videoPath);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": String(fileSize),
      "Content-Type": "video/mp4",
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text();
    throw new Error(`Video binary upload failed (${uploadRes.status}): ${uploadErr}`);
  }

  const videoData = await uploadRes.json();
  const videoId = videoData.id;
  console.log(`✅ [YouTube Upload] Video uploaded! ID: ${videoId}`);

  return videoId;
}

async function setThumbnail(videoId, coverImagePath, accessToken) {
  if (!coverImagePath || !fs.existsSync(coverImagePath)) return;
  console.log(`🖼️ [YouTube Thumbnail] Setting custom video thumbnail from '${path.basename(coverImagePath)}'...`);

  const imageBuffer = fs.readFileSync(coverImagePath);
  const ext = path.extname(coverImagePath).toLowerCase();
  const mimeType = ext.includes("png") ? "image/png" : "image/jpeg";

  try {
    const thumbRes = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": mimeType,
          "Content-Length": String(imageBuffer.length),
        },
        body: imageBuffer,
      },
    );

    if (thumbRes.ok) {
      console.log("✅ [YouTube Thumbnail] Custom cover art thumbnail applied!");
    } else {
      console.warn("⚠️ Could not set thumbnail (your channel may need phone verification for custom thumbnails).");
    }
  } catch (err) {
    console.warn("⚠️ Thumbnail upload warning:", err.message);
  }
}

function printSetupInstructions() {
  console.log("\n============================================================");
  console.log("📋 YOUTUBE DATA API V3 SETUP GUIDE (100% FREE)");
  console.log("============================================================\n");
  console.log("To automate YouTube video uploads directly from your terminal:");
  console.log("1. Open Google Cloud Console: https://console.cloud.google.com/");
  console.log("2. Create a new project (e.g. 'DZVNbeats-Studio').");
  console.log("3. Search for 'YouTube Data API v3' and click 'ENABLE'.");
  console.log("4. Go to 'APIs & Services' -> 'Credentials' -> 'Create Credentials' -> 'OAuth client ID'.");
  console.log("   - Application Type: 'Desktop App'");
  console.log("   - Name: 'DZVNbeats Uploader'");
  console.log("5. Click 'Download JSON' and rename/save it as 'client_secrets.json' in your project root:\n");
  console.log(`   Path: ${secretsPath}\n`);
  console.log("6. Run 'npm run upload-youtube' again to authenticate once.");
  console.log("   (Daily free quota: 10,000 units = ~6 video uploads per day for free)");
  console.log("============================================================\n");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--setup") || args.includes("--help")) {
    printSetupInstructions();
    return;
  }

  if (args.includes("--auth") || args.includes("--login")) {
    const secrets = loadSecrets();
    if (!secrets) {
      printSetupInstructions();
      process.exit(1);
    }
    console.log("\n============================================================");
    console.log("🔐 DZVNbeats YouTube Channel Authorization");
    console.log("============================================================\n");
    await getValidAccessToken(secrets);
    console.log("\n🎉 Authorization successful! YouTube token saved to .youtube-token.json\n");
    return;
  }

  const isDryRun = args.includes("--dry-run");
  const privacyArg = args.find((a) => a.startsWith("--privacy="));
  const privacy = privacyArg ? privacyArg.split("=")[1] : "public";

  const artistArg = args.find((a) => a.startsWith("--artist="));
  const artist = artistArg ? artistArg.split("=")[1] : undefined;

  const targetSlug = args.find((a) => !a.startsWith("-"));

  if (!fs.existsSync(beatsJsonPath)) {
    console.error("❌ beats.json not found. Run 'npm run generate-manifest' first.");
    process.exit(1);
  }

  const beats = JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
  let beat = beats[0];
  if (targetSlug) {
    beat = beats.find(
      (b) => b.id.toLowerCase() === targetSlug.toLowerCase() || b.title.toLowerCase() === targetSlug.toLowerCase(),
    );
    if (!beat) {
      console.error(`❌ Beat '${targetSlug}' not found.`);
      process.exit(1);
    }
  }

  console.log("============================================================");
  console.log(`🎬 YOUTUBE AUTOMATION PIPELINE • '${beat.title}'`);
  console.log("============================================================\n");

  const isShorts = args.includes("--shorts");
  const videoFilename = isShorts ? `${beat.id}-shorts.mp4` : `${beat.id}.mp4`;
  const publicVideoPath = path.join(rootDir, "public", "videos", videoFilename);
  const distVideoPath = path.join(rootDir, "dist", "videos", videoFilename);
  let videoPath = fs.existsSync(publicVideoPath)
    ? publicVideoPath
    : fs.existsSync(distVideoPath)
    ? distVideoPath
    : publicVideoPath;

  // Step 1: Ensure Video is Rendered
  if (!fs.existsSync(videoPath)) {
    console.log(`📹 Video file '${videoFilename}' not found in public/videos/. Rendering with FFmpeg now...`);
    videoPath = await renderBeatVideo(beat, { shorts: isShorts });
  } else {
    console.log(`⚡ Existing video found: ${path.relative(rootDir, videoPath)}`);
  }

  // Step 2: Generate Reach-Optimized or Custom Metadata
  const metaArg = args.find((a) => a.startsWith("--meta-file="));
  let metadata;
  if (metaArg) {
    const metaFile = metaArg.split("=")[1].replace(/"/g, "");
    if (fs.existsSync(metaFile)) {
      const custom = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
      metadata = {
        title: custom.title || beat.title,
        description: custom.description || "",
        tags: custom.tags || [],
        privacyStatus: custom.privacy || privacy,
        madeForKids: false,
      };
      console.log(`📝 [Custom Metadata] Loaded custom title, description, and ${metadata.tags.length} tags from ${path.basename(metaFile)}`);
    }
  }

  if (!metadata) {
    metadata = generateYouTubeMetadata(beat, { artist, privacy });
  }

  console.log(`\n📌 Title: ${metadata.title}`);
  console.log(`🔒 Privacy: ${metadata.privacyStatus.toUpperCase()}`);
  console.log(`🏷️ Tags: ${metadata.tags.slice(0, 6).join(", ")}... (${metadata.tags.length} total)`);

  if (isDryRun) {
    console.log("\n🧪 [Dry Run] Video rendered and metadata generated. Upload skipped.");
    return;
  }

  // Step 3: Check Secrets
  const secrets = loadSecrets();
  if (!secrets) {
    printSetupInstructions();
    console.log("💡 Video has been rendered to dist/videos/ and metadata is ready above.");
    console.log("You can manually upload it now, or add 'client_secrets.json' to enable 1-click automatic uploads.\n");
    return;
  }

  // Step 4: Authenticate & Upload
  const accessToken = await getValidAccessToken(secrets);
  const videoId = await uploadVideoToYouTube(videoPath, metadata, accessToken);

  // Step 5: Set Cover Art Thumbnail
  let coverPath = null;
  if (beat.coverArt) {
    coverPath = path.join(rootDir, beat.coverArt.replace(/^\.\//, "public/"));
  }
  if (coverPath && fs.existsSync(coverPath)) {
    await setThumbnail(videoId, coverPath, accessToken);
  }

  console.log("\n============================================================");
  console.log("🎉 YOUTUBE PUBLISHING COMPLETE!");
  console.log("============================================================");
  console.log(`• Watch Video: https://youtu.be/${videoId}`);
  console.log(`• Studio Page: https://denzven.github.io/DZVNbeats/#/beats?play=${encodeURIComponent(beat.id)}`);
  console.log(`• Status:      ${metadata.privacyStatus.toUpperCase()}`);
  console.log("============================================================\n");
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("upload-youtube.js") || process.argv[1].includes("upload-youtube"))
) {
  main().catch((err) => {
    console.error("❌ YouTube upload failed:", err);
    process.exit(1);
  });
}
