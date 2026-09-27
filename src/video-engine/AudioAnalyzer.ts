import { AudioAnalysis, CalibratedBands } from "./types";

export class AudioAnalyzer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private freqData: Uint8Array;
  private timeData: Uint8Array;
  private sampleRate: number = 44100;

  // Transient state tracking
  private prevDrumEnergy: number = 0;
  private prevSnareEnergy: number = 0;
  private prevHihatEnergy: number = 0;
  private kickCooldown: number = 0;
  private snareCooldown: number = 0;
  private hihatCooldown: number = 0;

  // Envelopes for smooth visualizer routing
  private drumEnvelope: number = 0;
  private snareEnvelope: number = 0;
  private vocalEnvelope: number = 0;
  private hihatEnvelope: number = 0;

  // Adaptive Auto-Calibration Peak States
  private lowPeak: number = 0.28;
  private midPeak: number = 0.18;
  private highPeak: number = 0.10;
  private airPeak: number = 0.08;
  private subBassPeak: number = 0.22;
  private drumPeak: number = 0.28;
  private snarePeak: number = 0.20;
  private vocalPeak: number = 0.18;
  private hihatPeak: number = 0.12;

  private binPeaks: Float32Array;
  private adaptiveFftBuffer: Float32Array;

  // Offline precomputed analysis cache for fast rendering
  private offlineBuffer: AudioBuffer | null = null;
  private offlineChannelData: Float32Array | null = null;

  // Fast Radix-2 Cooley-Tukey FFT Engine for Offline Video Render
  private fftSize: number = 2048;
  private bitRev: Uint16Array;
  private cosTable: Float32Array;
  private sinTable: Float32Array;
  private windowTable: Float32Array;
  private fftReal: Float32Array;
  private fftImag: Float32Array;
  private offlineFreqSmoothed: Float32Array;

  constructor(fftSize: number = 2048) {
    const binCount = fftSize / 2; // 1024 bins
    this.fftSize = fftSize;
    this.freqData = new Uint8Array(binCount);
    this.timeData = new Uint8Array(fftSize);
    this.binPeaks = new Float32Array(binCount);
    this.adaptiveFftBuffer = new Float32Array(binCount);

    // Initialize bit reversal table
    const numBits = Math.round(Math.log2(fftSize));
    this.bitRev = new Uint16Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      let rev = 0;
      let temp = i;
      for (let j = 0; j < numBits; j++) {
        rev = (rev << 1) | (temp & 1);
        temp >>= 1;
      }
      this.bitRev[i] = rev;
    }

    // Initialize twiddle factors for FFT
    this.cosTable = new Float32Array(binCount);
    this.sinTable = new Float32Array(binCount);
    for (let i = 0; i < binCount; i++) {
      this.cosTable[i] = Math.cos((-2 * Math.PI * i) / fftSize);
      this.sinTable[i] = Math.sin((-2 * Math.PI * i) / fftSize);
    }

    // Blackman Window matching Web Audio AnalyserNode specification
    this.windowTable = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) {
      this.windowTable[i] =
        0.42 -
        0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1)) +
        0.08 * Math.cos((4 * Math.PI * i) / (fftSize - 1));
    }

    this.fftReal = new Float32Array(fftSize);
    this.fftImag = new Float32Array(fftSize);
    this.offlineFreqSmoothed = new Float32Array(binCount);

    // Initialize bin peaks with psychoacoustic slope across 20Hz - 20,000Hz
    for (let i = 0; i < binCount; i++) {
      const t = i / binCount;
      this.binPeaks[i] = Math.max(0.03, 0.38 - Math.pow(t, 0.45) * 0.3);
    }
  }

  /**
   * Attach live HTMLAudioElement to Web Audio API AnalyserNode
   */
  public attachAudioElement(audioEl: HTMLAudioElement): void {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass =
          window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      }

      this.sampleRate = this.audioCtx.sampleRate || 44100;

      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      if (!this.analyser) {
        this.analyser = this.audioCtx.createAnalyser();
        // 2048 FFT gives ~21.5 Hz frequency resolution at 44.1kHz (perfect for 20Hz - 20kHz analysis)
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.75;
      }

      if (!this.sourceNode) {
        this.sourceNode = this.audioCtx.createMediaElementSource(audioEl);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
      }
    } catch (err) {
      console.warn("AudioAnalyzer live attachment notice:", err);
    }
  }

  /**
   * Helper: Convert frequency in Hertz to FFT bin index
   */
  private freqToBin(hz: number, binCount: number): number {
    const bin = Math.round((hz / this.sampleRate) * (binCount * 2));
    return Math.max(0, Math.min(binCount - 1, bin));
  }

  /**
   * Pre-scan entire audio buffer to calibrate baseline gain beat-to-beat
   */
  public calibrateTrackProfile(channelData: Float32Array): void {
    const step = Math.max(1, Math.floor(channelData.length / 800));
    let lowSum = 0;
    let midSum = 0;
    let highSum = 0;
    let samples = 0;

    for (let i = 0; i < channelData.length - 256; i += step) {
      let l = 0;
      let m = 0;
      let h = 0;
      for (let j = 0; j < 256; j++) {
        const amp = Math.abs(channelData[i + j]);
        if (j < 16) l += amp;
        else if (j < 90) m += amp;
        else h += amp;
      }
      lowSum += l / 16;
      midSum += m / 74;
      highSum += h / 166;
      samples++;
    }

    if (samples > 0) {
      // Set adaptive targets scaled to 85th percentile loudness of this specific beat
      this.lowPeak = Math.max(0.12, (lowSum / samples) * 2.4);
      this.midPeak = Math.max(0.08, (midSum / samples) * 2.2);
      this.highPeak = Math.max(0.04, (highSum / samples) * 2.0);
    }
  }

  /**
   * Load and decode an audio ArrayBuffer for offline non-realtime rendering
   */
  public async loadOfflineBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
    const AudioCtxClass =
      window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtxClass();
    this.offlineBuffer = await ctx.decodeAudioData(arrayBuffer);
    this.sampleRate = this.offlineBuffer.sampleRate;
    this.offlineChannelData = this.offlineBuffer.getChannelData(0);
    this.calibrateTrackProfile(this.offlineChannelData);
    this.offlineFreqSmoothed.fill(0);
    this.prevDrumEnergy = 0;
    this.prevSnareEnergy = 0;
    this.prevHihatEnergy = 0;
    this.kickCooldown = 0;
    this.snareCooldown = 0;
    this.hihatCooldown = 0;
    this.drumEnvelope = 0;
    this.snareEnvelope = 0;
    this.vocalEnvelope = 0;
    this.hihatEnvelope = 0;
    ctx.close();
  }

  /**
   * Get audio analysis for the current frame
   */
  public getAnalysis(currentTimeSec: number): AudioAnalysis {
    // 1. If we have a live AnalyserNode active
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.freqData as any);
      this.analyser.getByteTimeDomainData(this.timeData as any);
      return this.computeMetricsFromData(this.freqData, this.timeData);
    }

    // 2. If we have offline pre-decoded AudioBuffer
    if (this.offlineChannelData && this.offlineBuffer) {
      return this.computeOfflineMetrics(currentTimeSec);
    }

    // 3. Fallback dummy audio analysis (for quiet/no-audio states)
    return this.getEmptyAnalysis();
  }

  private computeMetricsFromData(
    freq: Uint8Array,
    time: Uint8Array,
  ): AudioAnalysis {
    const len = freq.length; // 1024 bins with 2048 FFT

    // Helper: average amplitude across a frequency range in Hz
    const getBandEnergy = (startHz: number, endHz: number): number => {
      const bStart = this.freqToBin(startHz, len);
      const bEnd = Math.max(bStart + 1, this.freqToBin(endHz, len));
      let sum = 0;
      let count = 0;
      for (let i = bStart; i <= bEnd && i < len; i++) {
        sum += freq[i];
        count++;
      }
      return count > 0 ? sum / (count * 255) : 0;
    };

    // 1. Precise 20Hz - 20kHz Acoustic Frequency Bands
    const rawSubBass = getBandEnergy(20, 60);         // 20Hz - 60Hz (deep 808 sub pressure)
    const rawBass = getBandEnergy(60, 250);           // 60Hz - 250Hz (bassline & low warmth)
    const rawMids = getBandEnergy(250, 4000);         // 250Hz - 4kHz (body & melodies)
    const rawHighs = getBandEnergy(4000, 20000);      // 4kHz - 20kHz (treble & sparkle)
    const rawAir = getBandEnergy(10000, 20000);       // 10kHz - 20kHz (ultra-high shimmer)

    // 2. Dedicated Musical Instrument / Element Extractors
    // A) Drum / Kick Transient (40Hz - 130Hz fundamental punch)
    const rawDrumEnergy = getBandEnergy(40, 130);
    const drumDelta = rawDrumEnergy - this.prevDrumEnergy;
    this.prevDrumEnergy = rawDrumEnergy;

    let isKick = false;
    if (this.kickCooldown > 0) {
      this.kickCooldown--;
    } else if (drumDelta > 0.08 && rawDrumEnergy > 0.22) {
      isKick = true;
      this.kickCooldown = 5; // ~80ms cooldown
    }

    // Drum envelope follower (punchy attack, natural decay)
    if (isKick) {
      this.drumEnvelope = Math.max(this.drumEnvelope, Math.min(1.0, rawDrumEnergy * 1.5));
    } else {
      this.drumEnvelope = Math.max(0, this.drumEnvelope * 0.88);
    }
    const drums = Math.min(1.0, this.drumEnvelope * 0.65 + rawDrumEnergy * 0.35);

    // B) Snare / Clap Transient
    // Snare has body in 180Hz - 380Hz and sharp crack / wire rattle in 1.8kHz - 4.5kHz
    const snareBody = getBandEnergy(180, 380);
    const snareSnap = getBandEnergy(1800, 4500);
    const rawSnareEnergy = snareBody * 0.45 + snareSnap * 0.55;
    const snareDelta = rawSnareEnergy - this.prevSnareEnergy;
    this.prevSnareEnergy = rawSnareEnergy;

    let isSnare = false;
    if (this.snareCooldown > 0) {
      this.snareCooldown--;
    } else if (snareDelta > 0.075 && rawSnareEnergy > 0.18 && snareSnap > 0.15) {
      isSnare = true;
      this.snareCooldown = 6;
    }

    if (isSnare) {
      this.snareEnvelope = Math.max(this.snareEnvelope, Math.min(1.0, rawSnareEnergy * 1.6));
    } else {
      this.snareEnvelope = Math.max(0, this.snareEnvelope * 0.84);
    }
    const snare = Math.min(1.0, this.snareEnvelope * 0.65 + rawSnareEnergy * 0.35);

    // C) Hi-Hats & Cymbals (6kHz - 20kHz fast transients & metallic sizzle)
    const rawHihatEnergy = getBandEnergy(6000, 20000);
    const hihatDelta = rawHihatEnergy - this.prevHihatEnergy;
    this.prevHihatEnergy = rawHihatEnergy;

    let isHihat = false;
    if (this.hihatCooldown > 0) {
      this.hihatCooldown--;
    } else if (hihatDelta > 0.055 && rawHihatEnergy > 0.12) {
      isHihat = true;
      this.hihatCooldown = 4;
    }

    if (isHihat) {
      this.hihatEnvelope = Math.max(this.hihatEnvelope, Math.min(1.0, rawHihatEnergy * 1.8));
    } else {
      this.hihatEnvelope = Math.max(0, this.hihatEnvelope * 0.78);
    }
    const hihats = Math.min(1.0, this.hihatEnvelope * 0.6 + rawHihatEnergy * 0.4);

    // D) Vocal Melody & Lead Line (300Hz - 3.5kHz sustained melodic presence)
    // Melodic voice / synth lines have sustained harmonic content with smooth crest factor
    const rawVocalMid = getBandEnergy(300, 3500);
    // Suppress percussive bursts from dominating melody tracking
    const nonDrumVocal = Math.max(0, rawVocalMid - (isKick ? 0.25 : 0) - (isSnare ? 0.3 : 0));
    this.vocalEnvelope += (nonDrumVocal - this.vocalEnvelope) * 0.22;
    const vocalMelody = Math.min(1.0, Math.max(0.0, this.vocalEnvelope * 1.3));

    const rawLows = rawSubBass * 0.55 + rawBass * 0.45;

    // Adaptive AGC: Fast attack on musical drops, smooth decay on quiet passages
    const attack = 0.38;
    const decay = 0.004;

    if (rawLows > this.lowPeak) this.lowPeak += (rawLows - this.lowPeak) * attack;
    else this.lowPeak -= (this.lowPeak - 0.12) * decay;

    if (rawSubBass > this.subBassPeak) this.subBassPeak += (rawSubBass - this.subBassPeak) * attack;
    else this.subBassPeak -= (this.subBassPeak - 0.08) * decay;

    if (rawMids > this.midPeak) this.midPeak += (rawMids - this.midPeak) * attack;
    else this.midPeak -= (this.midPeak - 0.08) * decay;

    if (rawHighs > this.highPeak) this.highPeak += (rawHighs - this.highPeak) * attack;
    else this.highPeak -= (this.highPeak - 0.05) * decay;

    if (rawAir > this.airPeak) this.airPeak += (rawAir - this.airPeak) * attack;
    else this.airPeak -= (this.airPeak - 0.03) * decay;

    if (drums > this.drumPeak) this.drumPeak += (drums - this.drumPeak) * attack;
    else this.drumPeak -= (this.drumPeak - 0.1) * decay;

    if (snare > this.snarePeak) this.snarePeak += (snare - this.snarePeak) * attack;
    else this.snarePeak -= (this.snarePeak - 0.08) * decay;

    if (vocalMelody > this.vocalPeak) this.vocalPeak += (vocalMelody - this.vocalPeak) * attack;
    else this.vocalPeak -= (this.vocalPeak - 0.06) * decay;

    if (hihats > this.hihatPeak) this.hihatPeak += (hihats - this.hihatPeak) * attack;
    else this.hihatPeak -= (this.hihatPeak - 0.05) * decay;

    // Calibrated normalized values (0.0 - 1.0)
    const calLows = Math.min(1.0, Math.max(0.0, rawLows / Math.max(0.05, this.lowPeak)));
    const calSubBass = Math.min(1.0, Math.max(0.0, rawSubBass / Math.max(0.04, this.subBassPeak)));
    const calBass = Math.min(1.0, Math.max(0.0, rawBass / Math.max(0.05, this.lowPeak)));
    const calMids = Math.min(1.0, Math.max(0.0, rawMids / Math.max(0.04, this.midPeak)));
    const calHighs = Math.min(1.0, Math.max(0.0, rawHighs / Math.max(0.03, this.highPeak)));
    const calAir = Math.min(1.0, Math.max(0.0, rawAir / Math.max(0.02, this.airPeak)));
    const calDrums = Math.min(1.0, Math.max(0.0, drums / Math.max(0.06, this.drumPeak)));
    const calSnare = Math.min(1.0, Math.max(0.0, snare / Math.max(0.05, this.snarePeak)));
    const calVocal = Math.min(1.0, Math.max(0.0, vocalMelody / Math.max(0.04, this.vocalPeak)));
    const calHihats = Math.min(1.0, Math.max(0.0, hihats / Math.max(0.03, this.hihatPeak)));

    // RMS volume calculation
    let rmsSum = 0;
    for (let i = 0; i < time.length; i++) {
      const val = (time[i] - 128) / 128;
      rmsSum += val * val;
    }
    const overallEnergy = Math.min(1.0, Math.sqrt(rmsSum / time.length) * 2.2);

    const kickTransient = Math.min(1.0, Math.max(0.0, Math.max(0, drumDelta) * 4.2));
    const spectralTilt = (calHighs - calLows) / Math.max(0.01, calHighs + calLows);

    // Adaptive FFT: Psychoacoustic tilt curve compensation across 20Hz - 20,000Hz
    for (let i = 0; i < len; i++) {
      const frac = i / len;
      // Pink noise / human hearing compensation curve: gives high-frequency hats/cymbals vivid motion
      const tiltWeight = 1.0 + Math.pow(frac, 0.6) * 4.8;
      const rawVal = (freq[i] / 255) * tiltWeight;

      if (rawVal > this.binPeaks[i]) {
        this.binPeaks[i] += (rawVal - this.binPeaks[i]) * 0.45;
      } else {
        this.binPeaks[i] -= (this.binPeaks[i] - 0.04) * 0.005;
      }

      this.adaptiveFftBuffer[i] = Math.min(
        1.0,
        Math.max(0.0, rawVal / Math.max(0.05, this.binPeaks[i]))
      );
    }

    const calibrated: CalibratedBands = {
      lows: calLows,
      mids: calMids,
      highs: calHighs,
      air: calAir,
      kickTransient,
      spectralTilt,
      subBass: calSubBass,
      bass: calBass,
      drums: calDrums,
      snare: calSnare,
      vocalMelody: calVocal,
      hihats: calHihats,
    };

    return {
      subBass: rawSubBass,
      bass: rawBass,
      mids: rawMids,
      highs: rawHighs,
      drums,
      snare,
      vocalMelody,
      hihats,
      overallEnergy,
      isKick,
      isSnare,
      isHihat,
      frequencyData: freq,
      timeData: time,
      calibrated,
      adaptiveFft: this.adaptiveFftBuffer,
    };
  }

  private computeOfflineMetrics(currentTimeSec: number): AudioAnalysis {
    if (!this.offlineChannelData || !this.offlineBuffer) {
      return this.getEmptyAnalysis();
    }

    const sampleRate = this.offlineBuffer.sampleRate;
    const centerIndex = Math.floor(currentTimeSec * sampleRate);
    const windowSize = this.fftSize;
    const halfWindow = windowSize / 2;

    const slice = new Float32Array(windowSize);
    for (let i = 0; i < windowSize; i++) {
      const idx = centerIndex - halfWindow + i;
      if (idx >= 0 && idx < this.offlineChannelData.length) {
        slice[i] = this.offlineChannelData[idx];
      }
    }

    // Time domain data byte conversion (matches AnalyserNode.getByteTimeDomainData)
    for (let i = 0; i < windowSize; i++) {
      this.timeData[i] = Math.min(255, Math.max(0, Math.floor(128 + slice[i] * 127)));
    }

    // High performance Cooley-Tukey Radix-2 FFT
    const N = this.fftSize;
    for (let i = 0; i < N; i++) {
      const targetIdx = this.bitRev[i];
      this.fftReal[targetIdx] = slice[i] * this.windowTable[i];
      this.fftImag[targetIdx] = 0;
    }

    for (let halfSize = 1; halfSize < N; halfSize *= 2) {
      const step = N / (halfSize * 2);
      for (let i = 0; i < N; i += halfSize * 2) {
        for (let j = 0; j < halfSize; j++) {
          const k = j * step;
          const uReal = this.fftReal[i + j];
          const uImag = this.fftImag[i + j];
          const vReal = this.fftReal[i + j + halfSize];
          const vImag = this.fftImag[i + j + halfSize];

          const tr = vReal * this.cosTable[k] - vImag * this.sinTable[k];
          const ti = vReal * this.sinTable[k] + vImag * this.cosTable[k];

          this.fftReal[i + j + halfSize] = uReal - tr;
          this.fftImag[i + j + halfSize] = uImag - ti;
          this.fftReal[i + j] = uReal + tr;
          this.fftImag[i + j] = uImag + ti;
        }
      }
    }

    // Decibel magnitude conversion matching W3C Web Audio AnalyserNode (-100dB to -30dB)
    const minDecibels = -100;
    const maxDecibels = -30;
    const range = maxDecibels - minDecibels;
    const binCount = N / 2;

    for (let i = 0; i < binCount; i++) {
      const mag = Math.sqrt(this.fftReal[i] * this.fftReal[i] + this.fftImag[i] * this.fftImag[i]) / N;
      const dB = mag > 1e-6 ? 20 * Math.log10(mag) : -100;
      const norm = Math.min(1, Math.max(0, (dB - minDecibels) / range));
      const target = norm * 255;
      // Smoothing time constant ~0.75 for smooth decay between video frames
      this.offlineFreqSmoothed[i] = this.offlineFreqSmoothed[i] * 0.72 + target * 0.28;
      this.freqData[i] = Math.round(this.offlineFreqSmoothed[i]);
    }

    return this.computeMetricsFromData(this.freqData, this.timeData);
  }

  private getEmptyAnalysis(): AudioAnalysis {
    return {
      subBass: 0,
      bass: 0,
      mids: 0,
      highs: 0,
      drums: 0,
      snare: 0,
      vocalMelody: 0,
      hihats: 0,
      overallEnergy: 0,
      isKick: false,
      isSnare: false,
      isHihat: false,
      frequencyData: this.freqData,
      timeData: this.timeData,
      calibrated: {
        lows: 0,
        mids: 0,
        highs: 0,
        air: 0,
        kickTransient: 0,
        spectralTilt: 0,
        subBass: 0,
        bass: 0,
        drums: 0,
        snare: 0,
        vocalMelody: 0,
        hihats: 0,
      },
      adaptiveFft: this.adaptiveFftBuffer,
    };
  }

  public destroy(): void {
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      this.audioCtx.close().catch(() => {});
    }
  }
}
