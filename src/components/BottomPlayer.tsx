import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc,
  Download,
  Share2,
} from "lucide-react";
import { useAudioStore } from "../store/useAudioStore";
import { resolveUrl } from "../utils/url";

/**
 * BottomPlayer is the persistent audio player component that sits at the bottom of the screen.
 * It strictly synchronizes its internal HTMLAudioElement with the global Zustand `useAudioStore`.
 */
export const BottomPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthContextRef = useRef<AudioContext | null>(null);
  const synthOscRef = useRef<OscillatorNode | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);
  const synthIntervalRef = useRef<any>(null);

  const [usingSynthFallback, setUsingSynthFallback] = useState(false);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    autoplayBlocked,
    togglePlay,
    pauseTrack,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    setCurrentTime,
    setDuration,
    setAutoplayBlocked,
    openInquireModal,
    openShareModal,
  } = useAudioStore();

  const activeAudioUrl = currentTrack ? resolveUrl(currentTrack.url) : "";

  // Dynamic document title update based on track & playback
  useEffect(() => {
    if (currentTrack) {
      document.title = `${isPlaying ? "▶" : "⏸"} ${currentTrack.title} | DZVNbeats`;
    } else {
      document.title = "DZVNbeats | Premium Type Beats & Rap Beats For Sale";
    }
  }, [currentTrack, isPlaying]);

  // Clean up Web Audio synth
  const stopSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    if (synthOscRef.current) {
      try {
        synthOscRef.current.stop();
        synthOscRef.current.disconnect();
      } catch (e) {}
      synthOscRef.current = null;
    }
    setUsingSynthFallback(false);
  };

  // Web Audio Synth Fallback (guarantees sound if HTML5 audio element fails)
  const startSynthFallback = () => {
    stopSynth();
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!synthContextRef.current) {
        synthContextRef.current = new AudioCtx();
      }
      const ctx = synthContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(isMuted ? 0 : volume * 0.3, ctx.currentTime);
      gainNode.connect(ctx.destination);
      synthGainRef.current = gainNode;

      const bpm = currentTrack?.bpm || 140;
      const intervalMs = (60 / bpm) * 1000;
      let step = 0;

      synthIntervalRef.current = setInterval(() => {
        if (!isPlaying) return;
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();

        // Alternating pitch synth pattern
        const baseFreq =
          step % 4 === 0 ? 130.81 : step % 2 === 0 ? 196.0 : 261.63;
        osc.type = step % 4 === 0 ? "sawtooth" : "sine";
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        noteGain.gain.setValueAtTime(
          isMuted ? 0 : volume * 0.25,
          ctx.currentTime,
        );
        noteGain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + 0.2,
        );

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        step++;
      }, intervalMs / 2);

      setUsingSynthFallback(true);
    } catch (err) {
      console.warn("Web Audio Synth fallback error:", err);
    }
  };

  // Sync state with HTML5 Audio Element & Fallback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      // Force reload audio src when track changes
      if (
        audio.src !== window.location.origin + activeAudioUrl &&
        audio.src !== activeAudioUrl
      ) {
        audio.src = activeAudioUrl;
        audio.load();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            stopSynth();
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            if (err.name === "AbortError") {
              // The play request was interrupted by a new request or a pause call.
              return;
            }
            if (err.name === "NotAllowedError") {
              // Autoplay policy prevented playback without prior user gesture
              console.log("Autoplay restricted by browser policy. Waiting for user gesture.");
              setAutoplayBlocked(true);

              const unlockAutoplay = () => {
                if (audioRef.current) {
                  audioRef.current
                    .play()
                    .then(() => {
                      setAutoplayBlocked(false);
                    })
                    .catch(() => {});
                }
                window.removeEventListener("pointerdown", unlockAutoplay);
                window.removeEventListener("keydown", unlockAutoplay);
              };

              window.addEventListener("pointerdown", unlockAutoplay, { once: true });
              window.addEventListener("keydown", unlockAutoplay, { once: true });
              return;
            }
            console.warn(
              "HTML5 audio play blocked or failed. Activating synth fallback:",
              err,
            );
            startSynthFallback();
          });
      }
    } else {
      audio.pause();
      stopSynth();
      setAutoplayBlocked(false);
    }

    return () => {
      stopSynth();
    };
  }, [isPlaying, currentTrack, activeAudioUrl]);

  // Sync volume & mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    if (synthGainRef.current && synthContextRef.current) {
      synthGainRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume * 0.3,
        synthContextRef.current.currentTime,
      );
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !usingSynthFallback) {
      const audioTime = audioRef.current.currentTime;
      if (currentTrack?.beatType === "Exclusive" && audioTime >= 30) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        pauseTrack();
        setCurrentTime(0);
      } else {
        setCurrentTime(audioTime);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const actualDuration = audioRef.current.duration || 0;
      if (currentTrack?.beatType === "Exclusive" && actualDuration > 30) {
        setDuration(30);
      } else {
        setDuration(actualDuration);
      }
    }
  };

  const handleAudioError = (
    e: React.SyntheticEvent<HTMLAudioElement, Event>,
  ) => {
    console.warn("Audio tag load error for path:", activeAudioUrl, e);
    if (isPlaying) {
      startSynthFallback();
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newTime = parseFloat(e.target.value);
    if (currentTrack?.beatType === "Exclusive" && newTime > 30) {
      newTime = 30;
    }
    setCurrentTime(newTime);
    if (audioRef.current && !usingSynthFallback) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 md:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-900 md:border-zinc-800 shadow-2xl md:px-4 md:py-3 px-2 py-2">
      {/* Autoplay blocked banner (iOS/Chrome gesture required) */}
      {autoplayBlocked && currentTrack && (
        <div
          onClick={() => {
            if (audioRef.current) {
              audioRef.current
                .play()
                .then(() => setAutoplayBlocked(false))
                .catch(() => {});
            }
          }}
          className="mb-2 -mx-2 -mt-2 md:-mx-4 md:-mt-3 py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg animate-pulse transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-zinc-950" />
          <span>Tap anywhere to start listening to "{currentTrack.title}"</span>
        </div>
      )}

      {/* Hidden Native HTML5 Audio Element */}
      <audio
        ref={audioRef}
        src={activeAudioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
        onEnded={handleEnded}
        preload="auto"
      />

      {/* Mobile Thin Progress Bar (Bottom edge) */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900">
        <div
          className="h-full bg-white rounded-r-full transition-all duration-100 ease-linear"
          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3">
        {/* Track Info (Left) */}
        <div
          className="flex items-center gap-3 min-w-0 flex-1 md:w-1/4 cursor-pointer md:cursor-default"
          onClick={() => {
            // Future: Expand to full screen player on mobile
          }}
        >
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-md md:rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentTrack.coverArt ? (
              <img
                src={resolveUrl(currentTrack.coverArt)}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Disc
                className={`w-5 h-5 md:w-6 md:h-6 text-zinc-300 ${isPlaying ? "animate-spin-slow" : ""}`}
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white truncate">
                {currentTrack.title}
              </h4>
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-3 px-1 ml-1 opacity-70">
                  <span
                    className="w-[2px] bg-white rounded-full animate-wave-bar"
                    style={{ animationDelay: "0s" }}
                  ></span>
                  <span
                    className="w-[2px] bg-white rounded-full animate-wave-bar"
                    style={{ animationDelay: "0.15s" }}
                  ></span>
                  <span
                    className="w-[2px] bg-white rounded-full animate-wave-bar"
                    style={{ animationDelay: "0.3s" }}
                  ></span>
                  <span
                    className="w-[2px] bg-white rounded-full animate-wave-bar"
                    style={{ animationDelay: "0.45s" }}
                  ></span>
                </div>
              )}
              {usingSynthFallback && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-zinc-800 text-zinc-400 rounded hidden sm:inline-block">
                  Synth Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 truncate">
              <span>{currentTrack.bpm} BPM</span>
              {currentTrack.key && (
                <>
                  <span>•</span>
                  <span>{currentTrack.key}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Controls (Right) */}
        <div className="flex md:hidden items-center gap-3 pr-2">
          <button
            onClick={() => currentTrack && openShareModal(currentTrack)}
            aria-label="Share"
            title="Share beat"
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => openInquireModal(currentTrack)}
            aria-label="Download"
            title="Download options"
            className="text-zinc-400 hover:text-white transition-colors p-1"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="text-white active:scale-95 transition-transform flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Center Player Controls & Progress Scrub Bar (Desktop) */}
        <div className="hidden md:flex flex-col items-center flex-shrink-0 md:flex-1 md:w-2/4 max-w-xl">
          <div className="flex items-center gap-4 mb-1">
            <button
              onClick={prevTrack}
              aria-label="Previous Track"
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-all shadow active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-zinc-950" />
              ) : (
                <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              aria-label="Next Track"
              className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full text-[11px] font-mono text-zinc-400">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer focus:outline-none"
            />
            <span className="w-8 text-left">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Volume & Quick Inquire (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-zinc-800 accent-white rounded-lg cursor-pointer"
            />
          </div>

          <button
            onClick={() => currentTrack && openShareModal(currentTrack)}
            title="Share beat (Includes cover art & auto-play link)"
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => openInquireModal(currentTrack)}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
