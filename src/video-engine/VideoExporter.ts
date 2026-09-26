import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { AspectRatio, BeatMetadata, FrameContext, VideoEffect } from "./types";
import { AudioAnalyzer } from "./AudioAnalyzer";
import { GridSystem } from "./GridSystem";

export interface RenderProgress {
  frame: number;
  totalFrames: number;
  percent: number;
  fps: number;
  elapsedSec: number;
  estimatedRemainingSec: number;
}

export interface ExportOptions {
  beat: BeatMetadata;
  aspectRatio: AspectRatio;
  effects: VideoEffect[];
  audioUrl: string;
  coverImage: HTMLImageElement | null;
  fps?: number;
  bitrate?: number; // bps, e.g. 12_000_000 (12 Mbps)
  durationLimitSec?: number; // optional limit for preview clips
  onProgress?: (progress: RenderProgress) => void;
}

export class VideoExporter {
  private isCancelled = false;

  public cancel(): void {
    this.isCancelled = true;
  }

  public async exportMP4(options: ExportOptions): Promise<Blob> {
    this.isCancelled = false;
    const fps = options.fps || 60;
    const width = options.aspectRatio === "16:9" ? 1920 : 1080;
    const height = options.aspectRatio === "16:9" ? 1080 : 1920;
    const bitrate = options.bitrate || 14_000_000;

    // 1. Fetch & decode audio
    const audioRes = await fetch(options.audioUrl);
    const audioArrayBuffer = await audioRes.arrayBuffer();

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer.slice(0));

    const totalDuration = options.durationLimitSec
      ? Math.min(options.durationLimitSec, audioBuffer.duration)
      : audioBuffer.duration;
    const totalFrames = Math.floor(totalDuration * fps);

    // 2. Initialize Audio Analyzer for offline extraction
    const analyzer = new AudioAnalyzer();
    await analyzer.loadOfflineBuffer(audioArrayBuffer.slice(0));

    // 3. Setup Offscreen Canvas & Fonts
    if (typeof document !== "undefined" && document.fonts) {
      await document.fonts.ready;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Could not create canvas 2D context for export");

    // 4. Setup mp4-muxer
    const muxerTarget = new ArrayBufferTarget();

    // Check if AudioEncoder is available and supports AAC
    let hasAudioEncoder = typeof window.AudioEncoder !== "undefined";
    if (hasAudioEncoder) {
      try {
        const support = await window.AudioEncoder.isConfigSupported({
          numberOfChannels: 2,
          sampleRate: 48000,
          codec: "mp4a.40.2",
          bitrate: 320000,
        });
        hasAudioEncoder = !!support.supported;
      } catch {
        hasAudioEncoder = false;
      }
    }

    const muxer = new Muxer({
      target: muxerTarget,
      video: {
        codec: "avc",
        width,
        height,
        frameRate: fps,
      },
      audio: hasAudioEncoder
        ? {
            codec: "aac",
            numberOfChannels: 2,
            sampleRate: 48000,
          }
        : undefined,
      fastStart: "in-memory",
    });

    // 5. Setup VideoEncoder
    if (typeof window.VideoEncoder === "undefined") {
      throw new Error(
        "WebCodecs VideoEncoder is not supported in this browser. Please use Chrome, Edge, or Firefox."
      );
    }

    let encodedChunkCount = 0;
    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error("VideoEncoder error:", e),
    });

    videoEncoder.configure({
      codec: "avc1.640033", // H.264 High Profile, Level 5.1
      width,
      height,
      bitrate,
      framerate: fps,
      hardwareAcceleration: "prefer-hardware",
    });

    // 6. Optional AudioEncoder if supported
    let audioEncoder: AudioEncoder | null = null;
    if (hasAudioEncoder) {
      audioEncoder = new AudioEncoder({
        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
        error: (e) => console.error("AudioEncoder error:", e),
      });

      audioEncoder.configure({
        codec: "mp4a.40.2",
        numberOfChannels: 2,
        sampleRate: 48000,
        bitrate: 320000,
      });

      // Encode audio chunks
      await this.encodeAudio(audioBuffer, audioEncoder, totalDuration);
      await audioEncoder.flush();
    }

    // 7. Render Video Frame by Frame
    const startTime = performance.now();
    const sortedEffects = [...options.effects]
      .filter((e) => e.enabled)
      .sort((a, b) => a.order - b.order);

    const grid = GridSystem.computeGrid(width, height, options.aspectRatio);

    for (let frame = 0; frame < totalFrames; frame++) {
      if (this.isCancelled) {
        videoEncoder.close();
        analyzer.destroy();
        throw new Error("Export cancelled by user");
      }

      const timeSec = frame / fps;
      const audioAnalysis = analyzer.getAnalysis(timeSec);
      const introProgress = Math.min(1.0, Math.max(0.0, timeSec / 2.8));

      const frameCtx: FrameContext = {
        width,
        height,
        time: timeSec,
        duration: totalDuration,
        frame,
        fps,
        beat: options.beat,
        audio: audioAnalysis,
        aspectRatio: options.aspectRatio,
        coverImage: options.coverImage,
        grid,
        introProgress,
        activeEffects: sortedEffects.map((e) => e.id),
      };

      // 1. Clear frame to a blank transparent screen
      ctx.clearRect(0, 0, width, height);

      // 2. Draw all enabled effects
      for (const effect of sortedEffects) {
        try {
          effect.render(ctx, frameCtx);
        } catch (err) {
          console.error(`Render error in ${effect.id}:`, err);
        }
      }

      // Convert canvas to VideoFrame and encode
      const timestampMicros = Math.round((frame / fps) * 1_000_000);
      const videoFrame = new VideoFrame(canvas, {
        timestamp: timestampMicros,
        duration: Math.round((1 / fps) * 1_000_000),
      });

      // Keyframe every 2 seconds
      const isKeyFrame = frame % (fps * 2) === 0;
      videoEncoder.encode(videoFrame, { keyFrame: isKeyFrame });
      videoFrame.close();
      encodedChunkCount++;

      // Progress reporting
      if (frame % 10 === 0 || frame === totalFrames - 1) {
        const elapsedSec = (performance.now() - startTime) / 1000;
        const currentFps = elapsedSec > 0 ? frame / elapsedSec : 0;
        const remainingFrames = totalFrames - frame;
        const estimatedRemainingSec = currentFps > 0 ? remainingFrames / currentFps : 0;

        options.onProgress?.({
          frame,
          totalFrames,
          percent: Math.min(100, Math.round((frame / totalFrames) * 100)),
          fps: Math.round(currentFps),
          elapsedSec: Math.round(elapsedSec),
          estimatedRemainingSec: Math.round(estimatedRemainingSec),
        });

        // Yield slightly to prevent blocking main thread
        if (frame % 30 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }

    // 8. Flush encoder and finalize MP4
    await videoEncoder.flush();
    videoEncoder.close();
    muxer.finalize();
    analyzer.destroy();
    audioCtx.close();

    const buffer = muxerTarget.buffer;
    return new Blob([buffer], { type: "video/mp4" });
  }

  private async encodeAudio(
    audioBuffer: AudioBuffer,
    encoder: AudioEncoder,
    maxDurationSec: number
  ): Promise<void> {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const maxSamples = Math.min(
      audioBuffer.length,
      Math.floor(maxDurationSec * sampleRate)
    );
    const chunkSize = 2048;

    for (let offset = 0; offset < maxSamples; offset += chunkSize) {
      if (this.isCancelled) break;
      const count = Math.min(chunkSize, maxSamples - offset);

      const planarData = new Float32Array(count * channels);
      for (let ch = 0; ch < channels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        planarData.set(channelData.subarray(offset, offset + count), ch * count);
      }

      const timestampMicros = Math.round((offset / sampleRate) * 1_000_000);
      const audioData = new AudioData({
        format: "f32-planar",
        sampleRate,
        numberOfFrames: count,
        numberOfChannels: channels,
        timestamp: timestampMicros,
        data: planarData,
      });

      encoder.encode(audioData);
      audioData.close();
    }
  }
}
