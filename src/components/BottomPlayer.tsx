import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, MessageSquare, Disc, Download } from 'lucide-react';
import { useAudioStore } from '../store/useAudioStore';

// Helper to resolve URL using Vite BASE_URL (e.g. '/' in dev or '/DZVNbeats/' in production)
const resolveAudioUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('blob:')) {
    return rawUrl;
  }
  const cleanPath = rawUrl.replace(/^\.\//, '').replace(/^\//, '');
  const baseUrl = import.meta.env.BASE_URL || '/';
  const finalBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${finalBase}${cleanPath}`;
};

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
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
    toggleMute,
    setCurrentTime,
    setDuration,
    openInquireModal
  } = useAudioStore();

  const activeAudioUrl = currentTrack ? resolveAudioUrl(currentTrack.url) : '';

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
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!synthContextRef.current) {
        synthContextRef.current = new AudioCtx();
      }
      const ctx = synthContextRef.current;
      if (ctx.state === 'suspended') {
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
        const baseFreq = step % 4 === 0 ? 130.81 : step % 2 === 0 ? 196.00 : 261.63;
        osc.type = step % 4 === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

        noteGain.gain.setValueAtTime(isMuted ? 0 : volume * 0.25, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

        osc.connect(noteGain);
        noteGain.connect(gainNode);

        osc.start();
        osc.stop(ctx.currentTime + 0.25);
        step++;
      }, intervalMs / 2);

      setUsingSynthFallback(true);
    } catch (err) {
      console.warn('Web Audio Synth fallback error:', err);
    }
  };

  // Sync state with HTML5 Audio Element & Fallback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      // Force reload audio src when track changes
      if (audio.src !== window.location.origin + activeAudioUrl && audio.src !== activeAudioUrl) {
        audio.src = activeAudioUrl;
        audio.load();
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            stopSynth();
          })
          .catch((err) => {
            console.warn('HTML5 audio play blocked or failed. Activating synth fallback:', err);
            startSynthFallback();
          });
      }
    } else {
      audio.pause();
      stopSynth();
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
      synthGainRef.current.gain.setValueAtTime(isMuted ? 0 : volume * 0.3, synthContextRef.current.currentTime);
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    if (audioRef.current && !usingSynthFallback) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.warn('Audio tag load error for path:', activeAudioUrl, e);
    if (isPlaying) {
      startSynthFallback();
    }
  };

  const handleEnded = () => {
    nextTrack();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current && !usingSynthFallback) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 shadow-2xl px-4 py-3">
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

      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3">
        {/* Track Info (Left) */}
        <div className="flex items-center gap-3 min-w-0 flex-1 md:w-1/4">
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {currentTrack.coverArt ? (
              <img src={resolveAudioUrl(currentTrack.coverArt)} alt={currentTrack.title} className="w-full h-full object-cover" />
            ) : (
              <Disc className={`w-5 h-5 md:w-6 md:h-6 text-zinc-300 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-sm text-white truncate">{currentTrack.title}</h4>
              {usingSynthFallback && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-zinc-800 text-zinc-400 rounded hidden sm:inline-block">
                  Synth Mode
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>{currentTrack.bpm} BPM</span>
              {currentTrack.key && (
                <>
                  <span>•</span>
                  <span className="hidden sm:inline">{currentTrack.key}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center Player Controls & Progress Scrub Bar */}
        <div className="flex flex-col items-center flex-shrink-0 md:flex-1 md:w-2/4 max-w-xl">
          <div className="flex items-center gap-2 md:gap-4 mb-0 md:mb-1">
            <button
              onClick={prevTrack}
              aria-label="Previous Track"
              className="hidden md:block p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:bg-zinc-200 transition-all shadow active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 md:w-4 md:h-4 fill-zinc-950" />
              ) : (
                <Play className="w-5 h-5 md:w-4 md:h-4 fill-zinc-950 ml-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              aria-label="Next Track"
              className="hidden md:block p-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Time Scrubber - Hidden on mobile to save vertical space */}
          <div className="hidden md:flex items-center gap-2.5 w-full text-[11px] font-mono text-zinc-400">
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

        {/* Right Volume & Quick Inquire */}
        <div className="hidden md:flex items-center justify-end gap-4 w-1/4">
          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
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
