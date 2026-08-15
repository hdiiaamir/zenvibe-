import * as Tone from 'tone';
import type { GenrePreset, NoiseTexture } from '../constants/presets';

/**
 * Zenvibe audio engine — a multi-channel generative sound system built on
 * Tone.js. Channels: binaural pair, four procedural noise textures, and a
 * generative polyphonic chord synth. Everything routes through per-channel
 * gains into a master bus with a limiter + analyser tapped for the
 * audio-reactive visualizer.
 *
 * All parameter changes ramp (linearRampToValueAtTime / Tone's `rampTo`)
 * to avoid clicks/pops when switching presets or applying prompt commands.
 */

const RAMP_TIME = 1.4; // seconds, used for most musical param changes
const CLICKLESS_RAMP = 0.08; // seconds, used for volume/gain nudges

export type ChannelId = 'binaural' | 'noise' | 'synth';

export interface EngineLevels {
  binaural: number;
  rain: number;
  ocean: number;
  wind: number;
  brown: number;
  vinyl: number;
  synth: number;
  master: number;
}

export interface AnalyserSnapshot {
  bass: number; // 0..1 normalized low-frequency energy
  mid: number;
  treble: number;
  overall: number;
  waveform: Float32Array;
}

class AudioEngine {
  private started = false;
  private disposed = false;

  // Master bus
  private masterGain!: Tone.Gain;
  private limiter!: Tone.Limiter;
  private analyser!: Tone.Analyser;
  private waveformAnalyser!: Tone.Analyser;

  // Binaural
  private oscLeft!: Tone.Oscillator;
  private oscRight!: Tone.Oscillator;
  private pannerLeft!: Tone.Panner;
  private pannerRight!: Tone.Panner;
  private binauralGain!: Tone.Gain;

  // Noise textures
  private rainNoise!: Tone.Noise;
  private rainFilter!: Tone.Filter;
  private rainGain!: Tone.Gain;

  private oceanNoise!: Tone.Noise;
  private oceanFilter!: Tone.Filter;
  private oceanLFO!: Tone.LFO;
  private oceanGain!: Tone.Gain;

  private windNoise!: Tone.Noise;
  private windFilter!: Tone.Filter;
  private windLFO!: Tone.LFO;
  private windGain!: Tone.Gain;

  private brownNoise!: Tone.Noise;
  private brownFilter!: Tone.Filter;
  private brownGain!: Tone.Gain;

  private vinylNoise!: Tone.Noise;
  private vinylFilter!: Tone.Filter;
  private vinylGain!: Tone.Gain;
  private vinylPopLoop?: Tone.Loop;

  // Generative synth
  private synth!: Tone.PolySynth;
  private synthFilter!: Tone.Filter;
  private reverb!: Tone.Reverb;
  private synthGain!: Tone.Gain;
  private chordLoop?: Tone.Loop;

  private currentPreset?: GenrePreset;
  private muted: Record<ChannelId, boolean> = { binaural: false, noise: false, synth: false };
  private lastLevels: EngineLevels = {
    binaural: 0.18,
    rain: 0,
    ocean: 0,
    wind: 0,
    brown: 0,
    vinyl: 0,
    synth: 0.3,
    master: 0.8,
  };

  /** Build the full node graph. Must run after a user gesture. */
  async init() {
    if (this.started) return;

    await Tone.start();

    this.masterGain = new Tone.Gain(this.lastLevels.master);
    this.limiter = new Tone.Limiter(-1);
    this.analyser = new Tone.Analyser('fft', 64);
    this.waveformAnalyser = new Tone.Analyser('waveform', 256);

    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.analyser);
    this.limiter.connect(this.waveformAnalyser);
    this.limiter.toDestination();

    // ---- Binaural pair ----
    this.binauralGain = new Tone.Gain(this.lastLevels.binaural).connect(this.masterGain);
    this.pannerLeft = new Tone.Panner(-1).connect(this.binauralGain);
    this.pannerRight = new Tone.Panner(1).connect(this.binauralGain);
    this.oscLeft = new Tone.Oscillator(180, 'sine').connect(this.pannerLeft);
    this.oscRight = new Tone.Oscillator(220, 'sine').connect(this.pannerRight);

    // ---- Rain (white noise, resonant highpass shimmer) ----
    this.rainGain = new Tone.Gain(0).connect(this.masterGain);
    this.rainFilter = new Tone.Filter({ type: 'highpass', frequency: 1800, Q: 0.6 }).connect(
      this.rainGain
    );
    this.rainNoise = new Tone.Noise('white').connect(this.rainFilter);

    // ---- Ocean surge (brown noise, slow sweeping lowpass) ----
    this.oceanGain = new Tone.Gain(0).connect(this.masterGain);
    this.oceanFilter = new Tone.Filter({ type: 'lowpass', frequency: 500, Q: 1.2 }).connect(
      this.oceanGain
    );
    this.oceanLFO = new Tone.LFO({ frequency: 0.08, min: 200, max: 900 }).connect(
      this.oceanFilter.frequency
    );
    this.oceanLFO.start();
    this.oceanNoise = new Tone.Noise('brown').connect(this.oceanFilter);

    // ---- Forest wind (pink noise, wandering bandpass) ----
    this.windGain = new Tone.Gain(0).connect(this.masterGain);
    this.windFilter = new Tone.Filter({ type: 'bandpass', frequency: 700, Q: 0.8 }).connect(
      this.windGain
    );
    this.windLFO = new Tone.LFO({ frequency: 0.05, min: 300, max: 1400 }).connect(
      this.windFilter.frequency
    );
    this.windLFO.start();
    this.windNoise = new Tone.Noise('pink').connect(this.windFilter);

    // ---- Deep brown noise bed ----
    this.brownGain = new Tone.Gain(0).connect(this.masterGain);
    this.brownFilter = new Tone.Filter({ type: 'lowpass', frequency: 300, Q: 0.5 }).connect(
      this.brownGain
    );
    this.brownNoise = new Tone.Noise('brown').connect(this.brownFilter);

    // ---- Vinyl crackle (filtered white noise + random pops) ----
    this.vinylGain = new Tone.Gain(0).connect(this.masterGain);
    this.vinylFilter = new Tone.Filter({ type: 'highpass', frequency: 3000, Q: 0.3 }).connect(
      this.vinylGain
    );
    this.vinylNoise = new Tone.Noise('white').connect(this.vinylFilter);

    // ---- Generative lofi/ambient chord synth ----
    this.synthGain = new Tone.Gain(this.lastLevels.synth).connect(this.masterGain);
    this.reverb = new Tone.Reverb({ decay: 6, wet: 0.3 }).connect(this.synthGain);
    this.synthFilter = new Tone.Filter({ type: 'lowpass', frequency: 1800, Q: 0.4 }).connect(
      this.reverb
    );
    this.synth = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 1.5,
      modulationIndex: 3,
      envelope: { attack: 0.8, decay: 0.6, sustain: 0.6, release: 3 },
      modulationEnvelope: { attack: 0.5, decay: 0.3, sustain: 0.4, release: 2 },
    }).connect(this.synthFilter);
    this.synth.volume.value = -6;

    // Start all continuous noise sources at zero gain (silent) — ramp on select
    this.rainNoise.start();
    this.oceanNoise.start();
    this.windNoise.start();
    this.brownNoise.start();
    this.vinylNoise.start();
    this.oscLeft.start();
    this.oscRight.start();

    Tone.Transport.bpm.value = 75;
    Tone.Transport.start();

    this.started = true;
  }

  isStarted() {
    return this.started;
  }

  /** Apply a full preset: musical params + channel levels, all ramped. */
  applyPreset(preset: GenrePreset, transitionSeconds = RAMP_TIME) {
    if (!this.started) return;
    this.currentPreset = preset;
    const cfg = preset.audioConfig;

    Tone.Transport.bpm.rampTo(cfg.bpm, transitionSeconds);

    this.oscLeft.frequency.rampTo(cfg.carrierFreq, transitionSeconds);
    this.oscRight.frequency.rampTo(cfg.carrierFreq + cfg.binauralFreq, transitionSeconds);
    this.binauralGain.gain.rampTo(this.muted.binaural ? 0 : cfg.binauralLevel, transitionSeconds);

    this.rainGain.gain.rampTo(this.muted.noise ? 0 : cfg.rainLevel, transitionSeconds);
    this.oceanGain.gain.rampTo(this.muted.noise ? 0 : cfg.oceanLevel, transitionSeconds);
    this.windGain.gain.rampTo(this.muted.noise ? 0 : cfg.windLevel, transitionSeconds);
    this.brownGain.gain.rampTo(this.muted.noise ? 0 : cfg.brownNoiseLevel, transitionSeconds);
    this.vinylGain.gain.rampTo(this.muted.noise ? 0 : cfg.vinylCrackle, transitionSeconds);

    this.synthGain.gain.rampTo(this.muted.synth ? 0 : cfg.synthLevel, transitionSeconds);
    this.synthFilter.frequency.rampTo(cfg.filterCutoff, transitionSeconds);
    this.reverb.wet.rampTo(cfg.reverbWet, transitionSeconds);
    this.synth.set({ oscillator: { type: cfg.synthWaveform } });

    this.toggleVinylPops(cfg.vinylCrackle > 0.02 && !this.muted.noise);
    this.rebuildChordLoop(cfg.synthChordScale, cfg.bpm);

    this.lastLevels = {
      ...this.lastLevels,
      binaural: cfg.binauralLevel,
      rain: cfg.rainLevel,
      ocean: cfg.oceanLevel,
      wind: cfg.windLevel,
      brown: cfg.brownNoiseLevel,
      vinyl: cfg.vinylCrackle,
      synth: cfg.synthLevel,
    };
  }

  private rebuildChordLoop(chordScale: string[], bpm: number) {
    this.chordLoop?.dispose();
    const interval = bpm < 55 ? '2m' : bpm < 70 ? '1m' : '1m';
    this.chordLoop = new Tone.Loop((time) => {
      // Voice a lush 7th/9th chord by layering the scale + an octave-up color tone
      const voicing = [...chordScale];
      this.synth.triggerAttackRelease(voicing, '2n', time, 0.55);
    }, interval);
    this.chordLoop.start(0);
  }

  private toggleVinylPops(enabled: boolean) {
    this.vinylPopLoop?.dispose();
    this.vinylPopLoop = undefined;
    if (!enabled) return;
    this.vinylPopLoop = new Tone.Loop((time) => {
      if (Math.random() > 0.55) {
        const pop = new Tone.Noise('white').connect(
          new Tone.Filter({ type: 'bandpass', frequency: 4000, Q: 2 }).connect(this.vinylGain)
        );
        pop.start(time).stop(time + 0.02);
        setTimeout(() => pop.dispose(), 300);
      }
    }, '4n');
    this.vinylPopLoop.start(0);
  }

  /** Generic ramped param setter used by the NL prompt parser + mixer sliders. */
  setChannelLevel(channel: keyof EngineLevels, value: number, ramp = CLICKLESS_RAMP) {
    const v = Math.max(0, Math.min(1, value));
    this.lastLevels[channel] = v;
    switch (channel) {
      case 'binaural':
        this.binauralGain.gain.rampTo(this.muted.binaural ? 0 : v, ramp);
        break;
      case 'rain':
        this.rainGain.gain.rampTo(this.muted.noise ? 0 : v, ramp);
        this.toggleVinylPops(this.lastLevels.vinyl > 0.02 && !this.muted.noise);
        break;
      case 'ocean':
        this.oceanGain.gain.rampTo(this.muted.noise ? 0 : v, ramp);
        break;
      case 'wind':
        this.windGain.gain.rampTo(this.muted.noise ? 0 : v, ramp);
        break;
      case 'brown':
        this.brownGain.gain.rampTo(this.muted.noise ? 0 : v, ramp);
        break;
      case 'vinyl':
        this.vinylGain.gain.rampTo(this.muted.noise ? 0 : v, ramp);
        this.toggleVinylPops(v > 0.02 && !this.muted.noise);
        break;
      case 'synth':
        this.synthGain.gain.rampTo(this.muted.synth ? 0 : v, ramp);
        break;
      case 'master':
        this.masterGain.gain.rampTo(v, ramp);
        break;
    }
  }

  setMute(channel: ChannelId, muted: boolean) {
    this.muted[channel] = muted;
    if (!this.currentPreset) return;
    switch (channel) {
      case 'binaural':
        this.binauralGain.gain.rampTo(muted ? 0 : this.lastLevels.binaural, CLICKLESS_RAMP);
        break;
      case 'noise':
        this.rainGain.gain.rampTo(muted ? 0 : this.lastLevels.rain, CLICKLESS_RAMP);
        this.oceanGain.gain.rampTo(muted ? 0 : this.lastLevels.ocean, CLICKLESS_RAMP);
        this.windGain.gain.rampTo(muted ? 0 : this.lastLevels.wind, CLICKLESS_RAMP);
        this.brownGain.gain.rampTo(muted ? 0 : this.lastLevels.brown, CLICKLESS_RAMP);
        this.vinylGain.gain.rampTo(muted ? 0 : this.lastLevels.vinyl, CLICKLESS_RAMP);
        this.toggleVinylPops(!muted && this.lastLevels.vinyl > 0.02);
        break;
      case 'synth':
        this.synthGain.gain.rampTo(muted ? 0 : this.lastLevels.synth, CLICKLESS_RAMP);
        break;
    }
  }

  setBpm(bpm: number, ramp = RAMP_TIME) {
    Tone.Transport.bpm.rampTo(Math.max(30, Math.min(160, bpm)), ramp);
  }

  getBpm() {
    return Tone.Transport.bpm.value;
  }

  setBinauralFreq(hz: number, ramp = RAMP_TIME) {
    const carrier = this.oscLeft.frequency.value as number;
    this.oscRight.frequency.rampTo(carrier + hz, ramp);
  }

  getLevels(): EngineLevels {
    return { ...this.lastLevels };
  }

  /** Pull a normalized analyser snapshot for the visualizer's animation loop. */
  getSnapshot(): AnalyserSnapshot {
    if (!this.started) {
      return { bass: 0, mid: 0, treble: 0, overall: 0, waveform: new Float32Array(256) };
    }
    const fft = this.analyser.getValue() as Float32Array;
    const waveform = this.waveformAnalyser.getValue() as Float32Array;

    const norm = (dB: number) => Math.max(0, Math.min(1, (dB + 100) / 100));
    const bins = fft.length;
    const bassSlice = fft.slice(0, Math.floor(bins * 0.15));
    const midSlice = fft.slice(Math.floor(bins * 0.15), Math.floor(bins * 0.5));
    const trebleSlice = fft.slice(Math.floor(bins * 0.5), bins);

    const avg = (arr: Float32Array) =>
      arr.length ? arr.reduce((a, b) => a + norm(b), 0) / arr.length : 0;

    const bass = avg(bassSlice);
    const mid = avg(midSlice);
    const treble = avg(trebleSlice);

    return {
      bass,
      mid,
      treble,
      overall: (bass * 1.4 + mid + treble * 0.6) / 3,
      waveform: waveform as Float32Array,
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    [
      this.oscLeft,
      this.oscRight,
      this.pannerLeft,
      this.pannerRight,
      this.binauralGain,
      this.rainNoise,
      this.rainFilter,
      this.rainGain,
      this.oceanNoise,
      this.oceanFilter,
      this.oceanLFO,
      this.oceanGain,
      this.windNoise,
      this.windFilter,
      this.windLFO,
      this.windGain,
      this.brownNoise,
      this.brownFilter,
      this.brownGain,
      this.vinylNoise,
      this.vinylFilter,
      this.vinylGain,
      this.synth,
      this.synthFilter,
      this.reverb,
      this.synthGain,
      this.masterGain,
      this.limiter,
      this.analyser,
      this.waveformAnalyser,
    ].forEach((node) => node?.dispose?.());
    this.chordLoop?.dispose();
    this.vinylPopLoop?.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
}

export const audioEngine = new AudioEngine();
export type { GenrePreset, NoiseTexture };
