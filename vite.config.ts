import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { execSync, spawnSync } from "child_process";
import path from "path";
import fs from "fs";

// Custom Vite plugin to handle local Studio Admin API actions & stream rendered MP4s
const studioAdminPlugin = () => ({
  name: "studio-admin-plugin",
  configureServer(server: any) {
    server.middlewares.use(async (req: any, res: any, next: any) => {
      // 1. Stream rendered MP4 videos for live in-browser preview
      if (req.url && req.url.startsWith("/api/video/")) {
        const videoName = req.url.replace("/api/video/", "").split("?")[0];
        const videoPath = path.resolve(__dirname, "dist", "videos", videoName);
        if (fs.existsSync(videoPath)) {
          const stat = fs.statSync(videoPath);
          const fileSize = stat.size;
          const range = req.headers.range;

          if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = end - start + 1;
            const file = fs.createReadStream(videoPath, { start, end });
            const head = {
              "Content-Range": `bytes ${start}-${end}/${fileSize}`,
              "Accept-Ranges": "bytes",
              "Content-Length": chunksize,
              "Content-Type": "video/mp4",
            };
            res.writeHead(206, head);
            file.pipe(res);
            return;
          } else {
            const head = {
              "Content-Length": fileSize,
              "Accept-Ranges": "bytes",
              "Content-Type": "video/mp4",
            };
            res.writeHead(200, head);
            fs.createReadStream(videoPath).pipe(res);
            return;
          }
        } else {
          res.statusCode = 404;
          res.end("Video not rendered yet");
          return;
        }
      }

      // 2. Studio Status API (checks credentials and existing video renders)
      if (req.url && req.url.startsWith("/api/studio/status")) {
        const url = new URL(req.url, "http://localhost");
        const id = url.searchParams.get("id");
        const videoPath = id
          ? path.resolve(__dirname, "dist", "videos", `${id}.mp4`)
          : null;
        const shortsPath = id
          ? path.resolve(__dirname, "dist", "videos", `${id}-shorts.mp4`)
          : null;

        const hasClientSecrets =
          fs.existsSync(path.resolve(__dirname, "client.json")) ||
          fs.existsSync(path.resolve(__dirname, "client_secrets.json"));
        const hasToken =
          fs.existsSync(path.resolve(__dirname, "token.json")) ||
          fs.existsSync(path.resolve(__dirname, ".youtube-token.json"));

        const videoExists = videoPath ? fs.existsSync(videoPath) : false;
        const shortsExists = shortsPath ? fs.existsSync(shortsPath) : false;

        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({
            hasClientSecrets,
            hasToken,
            video: {
              exists: videoExists,
              sizeMb: videoExists
                ? (fs.statSync(videoPath!).size / (1024 * 1024)).toFixed(2)
                : null,
              url: videoExists ? `/api/video/${id}.mp4` : null,
            },
            shorts: {
              exists: shortsExists,
              sizeMb: shortsExists
                ? (fs.statSync(shortsPath!).size / (1024 * 1024)).toFixed(2)
                : null,
              url: shortsExists ? `/api/video/${id}-shorts.mp4` : null,
            },
          }),
        );
        return;
      }

      // 3. Render Video Action API
      if (req.url === "/api/studio/render" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => (body += chunk));
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            const cmd = data.shorts
              ? `node scripts/generate-video.js ${data.id} --shorts`
              : `node scripts/generate-video.js ${data.id}`;
            execSync(cmd, { stdio: "inherit" });
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                message: "Rendered successfully",
              }),
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      // 3b. Save Rendered MP4 Video API (Receives WebCodecs exported video buffer)
      if (req.url === "/api/studio/save-video" && req.method === "POST") {
        const beatId = (req.headers["x-beat-id"] as string) || "beat";
        const isShorts =
          req.headers["x-shorts"] === "1" || req.headers["x-shorts"] === "true";
        const filename = isShorts ? `${beatId}-shorts.mp4` : `${beatId}.mp4`;
        const videoDir = path.resolve(__dirname, "dist", "videos");
        if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
        const targetPath = path.resolve(videoDir, filename);

        const chunks: any[] = [];
        req.on("data", (chunk: any) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const buffer = Buffer.concat(chunks);
            fs.writeFileSync(targetPath, buffer);

            // Check if audio needs to be remuxed with pristine studio WAV
            try {
              const beatsJsonPath = path.resolve(__dirname, "src", "data", "beats.json");
              if (fs.existsSync(beatsJsonPath)) {
                const beatsList = JSON.parse(fs.readFileSync(beatsJsonPath, "utf-8"));
                const currentBeat = beatsList.find(
                  (b: any) => b.id.toLowerCase() === beatId.toLowerCase()
                );
                if (currentBeat && currentBeat.filename) {
                  const audioFile = path.resolve(__dirname, "public", "beats", currentBeat.filename);
                  if (fs.existsSync(audioFile)) {
                    const tempVideo = path.resolve(videoDir, `temp-${filename}`);
                    fs.renameSync(targetPath, tempVideo);
                    try {
                      execSync(
                        `ffmpeg -y -i "${tempVideo}" -i "${audioFile}" -c:v copy -c:a aac -b:a 320k -shortest "${targetPath}"`,
                        { stdio: "ignore" }
                      );
                      if (fs.existsSync(tempVideo)) fs.unlinkSync(tempVideo);
                    } catch {
                      if (fs.existsSync(tempVideo) && !fs.existsSync(targetPath)) {
                        fs.renameSync(tempVideo, targetPath);
                      }
                    }
                  }
                }
              }
            } catch (remuxErr) {
              console.warn("Audio remux note:", remuxErr);
            }

            const stat = fs.statSync(targetPath);
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                message: "Video saved to studio storage",
                url: `/api/video/${filename}`,
                sizeMb: (stat.size / (1024 * 1024)).toFixed(2),
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      // 4. Upload YouTube Action API
      if (req.url === "/api/studio/upload-youtube" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk: any) => (body += chunk));
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            let metaFlag = "";
            if (data.customMetadata) {
              const metaDir = path.resolve(__dirname, "dist", "videos");
              if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true });
              const metaPath = path.resolve(metaDir, `${data.id}-custom-meta.json`);
              fs.writeFileSync(metaPath, JSON.stringify(data.customMetadata, null, 2));
              metaFlag = `--meta-file="${metaPath}"`;
            }
            const artistFlag = data.artist
              ? `--artist="${data.artist.replace(/"/g, "")}"`
              : "";
            const privacyFlag = data.privacy
              ? `--privacy="${data.privacy}"`
              : "";
            const shortsFlag = data.shorts ? "--shorts" : "";
            const cmd = `node scripts/upload-youtube.js ${data.id} ${artistFlag} ${privacyFlag} ${shortsFlag} ${metaFlag}`.trim();
            const output = execSync(cmd, { encoding: "utf-8" });
            const match = output.match(/https:\/\/youtu\.be\/[a-zA-Z0-9_-]+/);
            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                url: match ? match[0] : null,
                output,
              }),
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      // 5. Automated Beat Setup & Ingest API (Auto-ID3 tagging, Artwork embedding, and Catalog Sync)
      if (req.url === "/api/studio/upload-new-beat" && req.method === "POST") {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: any) =>
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
        );
        req.on("end", () => {
          try {
            const rawBody = Buffer.concat(chunks).toString("utf-8");
            const data = JSON.parse(rawBody);

            const {
              title = "Untitled Beat",
              bpm = 120,
              key = "C Minor",
              tier = "Free",
              isTagged = true,
              status = "Available",
              tags = [],
              audioBase64,
              audioFilename = "beat.mp3",
              coverBase64,
              coverFilename = "cover.jpg",
            } = data;

            if (!audioBase64) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  success: false,
                  error: "Audio file is required",
                }),
              );
              return;
            }

            const beatsDir = path.resolve(__dirname, "public", "beats");
            const coversDir = path.resolve(__dirname, "public", "covers");
            const tempDir = path.resolve(__dirname, "dist", "temp_uploads");

            if (!fs.existsSync(beatsDir))
              fs.mkdirSync(beatsDir, { recursive: true });
            if (!fs.existsSync(coversDir))
              fs.mkdirSync(coversDir, { recursive: true });
            if (!fs.existsSync(tempDir))
              fs.mkdirSync(tempDir, { recursive: true });

            // Standardize title and slug
            const cleanTitle = title
              .trim()
              .replace(/[^\w\s-]/g, "")
              .replace(/[\s-]+/g, "_");

            const slug =
              title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "") || "new-beat";

            // Standardize key (e.g. F# Minor -> Fsharpmin, C Minor -> Cmin)
            const cleanKey = (key || "Cmin")
              .trim()
              .replace(/#/g, "sharp")
              .replace(/b/g, "flat")
              .replace(/\s+/g, "")
              .replace(/major/i, "maj")
              .replace(/minor/i, "min");

            const bpmNum = parseInt(bpm, 10) || 120;
            const statusCode =
              (status || "Available").toLowerCase() === "sold"
                ? "sold"
                : "ava";
            const tierLower = (tier || "Free").toLowerCase();
            const tierCode =
              tierLower === "exclusive"
                ? "ex"
                : tierLower === "basic"
                  ? "std"
                  : "free";
            const taggedCode = isTagged !== false ? "Tagged" : "Untagged";

            const audioExt =
              path.extname(audioFilename).toLowerCase() || ".mp3";
            const finalAudioFilename = `DZVN_${cleanTitle}_${bpmNum}BPM_${cleanKey}_${statusCode}_${tierCode}_${taggedCode}${audioExt}`;
            const finalAudioPath = path.resolve(beatsDir, finalAudioFilename);

            // Handle Cover Art
            let finalCoverFilename = "";
            let finalCoverPath = "";
            if (coverBase64) {
              const coverExt =
                path.extname(coverFilename).toLowerCase() || ".jpg";
              finalCoverFilename = `${slug}-cover${coverExt === ".png" ? ".png" : ".jpg"}`;
              finalCoverPath = path.resolve(coversDir, finalCoverFilename);
              const coverRaw = coverBase64.replace(
                /^data:image\/\w+;base64,/,
                "",
              );
              fs.writeFileSync(finalCoverPath, Buffer.from(coverRaw, "base64"));
            } else {
              // Automatic fallback to studio branded artwork
              const defaultPfp = path.resolve(
                __dirname,
                "public",
                "DZVNbeats_pfp.jpeg",
              );
              finalCoverFilename = `${slug}-cover.jpg`;
              finalCoverPath = path.resolve(coversDir, finalCoverFilename);
              if (fs.existsSync(defaultPfp) && !fs.existsSync(finalCoverPath)) {
                fs.copyFileSync(defaultPfp, finalCoverPath);
              }
            }

            // Write temporary audio file for FFmpeg to process
            const audioRaw = audioBase64.replace(
              /^data:audio\/\w+;base64,/,
              "",
            );
            const tempAudioPath = path.resolve(
              tempDir,
              `temp_${Date.now()}${audioExt}`,
            );
            fs.writeFileSync(tempAudioPath, Buffer.from(audioRaw, "base64"));

            // Inject ID3 tags and embed artwork via FFmpeg
            const year = new Date().getFullYear().toString();
            const genreStr =
              Array.isArray(tags) && tags.length > 0
                ? tags.join(", ")
                : "Hip-Hop / Trap";
            const commentStr = "Produced by DZVN | https://dzvnbeats.com";

            const isMp3 = audioExt === ".mp3";
            const isWav = audioExt === ".wav";
            const hasCover = finalCoverPath && fs.existsSync(finalCoverPath);

            const ffmpegArgs: string[] = ["-y", "-i", tempAudioPath];

            if (isMp3 && hasCover) {
              ffmpegArgs.push(
                "-i",
                finalCoverPath,
                "-map",
                "0:a",
                "-map",
                "1:0",
                "-c:a",
                "copy",
                "-c:v",
                "copy",
                "-id3v2_version",
                "3",
                "-metadata:s:v",
                "title=Album cover",
                "-metadata:s:v",
                "comment=Cover (front)",
                "-disposition:v:0",
                "attached_pic",
              );
            } else if (isWav) {
              ffmpegArgs.push("-write_id3v2", "1", "-c:a", "copy");
            } else {
              ffmpegArgs.push("-c:a", "copy");
            }

            ffmpegArgs.push(
              "-metadata",
              `title=${title}`,
              "-metadata",
              "artist=DZVN",
              "-metadata",
              "album=DZVNbeats",
              "-metadata",
              `genre=${genreStr}`,
              "-metadata",
              `date=${year}`,
              "-metadata",
              `year=${year}`,
              "-metadata",
              `comment=${commentStr}`,
              finalAudioPath,
            );

            try {
              const resTag = spawnSync("ffmpeg", ffmpegArgs, {
                encoding: "utf-8",
              });
              if (resTag.status !== 0) {
                console.warn("FFmpeg tagging output:", resTag.stderr);
                if (!fs.existsSync(finalAudioPath)) {
                  fs.copyFileSync(tempAudioPath, finalAudioPath);
                }
              }
            } catch (ffmpegErr) {
              console.warn(
                "FFmpeg tagging error fallback to raw copy:",
                ffmpegErr,
              );
              if (!fs.existsSync(finalAudioPath)) {
                fs.copyFileSync(tempAudioPath, finalAudioPath);
              }
            } finally {
              try {
                fs.unlinkSync(tempAudioPath);
              } catch {}
            }

            // Sync catalog manifest and generate contracts
            try {
              execSync("node generate-manifest.js --force", {
                stdio: "inherit",
              });
            } catch (mErr) {
              console.error("Error updating manifest:", mErr);
            }

            try {
              execSync("node scripts/generate-contracts.js", {
                stdio: "inherit",
              });
            } catch (cErr) {
              console.error("Error generating contracts:", cErr);
            }

            // Read updated beats manifest
            const beatsJsonPath = path.resolve(
              __dirname,
              "src",
              "data",
              "beats.json",
            );
            let newBeatObj: any = null;
            if (fs.existsSync(beatsJsonPath)) {
              try {
                const allBeats = JSON.parse(
                  fs.readFileSync(beatsJsonPath, "utf-8"),
                );
                newBeatObj =
                  allBeats.find(
                    (b: any) =>
                      b.id === slug || b.filename === finalAudioFilename,
                  ) || allBeats[0];
              } catch {}
            }

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                success: true,
                beatId: newBeatObj ? newBeatObj.id : slug,
                beat: newBeatObj,
                filename: finalAudioFilename,
                coverFilename: finalCoverFilename,
                message:
                  "Beat successfully processed, ID3 tagged, artwork embedded, and synced to catalog!",
              }),
            );
          } catch (err: any) {
            console.error("Upload error:", err);
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        });
        return;
      }

      next();
    });
  },
});

// Custom Vite plugin to watch public/beats/ folder and auto-generate manifest on file drop
const watchBeatsPlugin = () => {
  let timer: NodeJS.Timeout | null = null;
  const audioExtensions = new Set([".mp3", ".wav", ".m4a", ".ogg", ".flac"]);

  const triggerManifest = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(
        "🎵 [Vite Watcher] Beats directory changed. Verifying manifest & covers...",
      );
      try {
        execSync("node generate-manifest.js", { stdio: "inherit" });
      } catch (err) {
        console.error("Error running generate-manifest:", err);
      }
    }, 250);
  };

  return {
    name: "watch-beats-plugin",
    configureServer(server: any) {
      const beatsDir = path.resolve(__dirname, "public/beats");
      server.watcher.add(beatsDir);

      server.watcher.on("add", (filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();
        if (audioExtensions.has(ext)) {
          triggerManifest();
        }
      });

      server.watcher.on("unlink", (filePath: string) => {
        const ext = path.extname(filePath).toLowerCase();
        if (audioExtensions.has(ext)) {
          triggerManifest();
        }
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    watchBeatsPlugin(),
    studioAdminPlugin(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "DZVNbeats | Studio Beat Portfolio",
        short_name: "DZVNbeats",
        description:
          "Serverless Studio Beat Portfolio & Direct Licensing Platform",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // EXPLICIT REQUIREMENT: Ignore /public/beats/ to prevent heavy audio caching & mobile quota crashes
        globIgnores: ["**/beats/**", "beats/**"],
        navigateFallbackDenylist: [/^\/beats/],
      },
    }),
  ],
  base: process.env.NODE_ENV === "production" ? "./" : "/",
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-framer": ["framer-motion"],
          "vendor-pdf": ["jspdf"],
        },
      },
    },
  },
});
