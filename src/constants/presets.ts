/**
 * Zenvibe — Preset & Theme Config Schema
 * Each preset binds a full audio-engine configuration to a visual theme
 * (background image + accent palette) so switching moods is a single
 * atomic state change that both the audioEngine and the UI subscribe to.
 */

export type NoiseTexture = 'rain' | 'ocean' | 'wind' | 'vinyl' | 'none';

export interface GenrePreset {
  id: string;
  name: string;
  subtitle: string;
  /** Path under /public/backgrounds/ — drop your own high-res image here. */
  bgImage: string;
  /** Fallback CSS gradient used if bgImage fails to load. */
  fallbackGradient: string;
  /** Primary + secondary accent, used for glass borders, glows, sliders. */
  accentColor: string;
  accentColorSecondary: string;
  /** Tailwind-safe rgba strings for glow/particle rendering on <canvas>. */
  particleColor: string;
  audioConfig: {
    bpm: number;
    /** Brainwave entrainment offset in Hz (e.g. 40 = Gamma, 10 = Alpha, 4 = Theta). */
    binauralFreq: number;
    binauralLabel: string;
    carrierFreq: number;
    synthChordScale: string[];
    synthWaveform: OscillatorType;
    noiseTexture: NoiseTexture;
    rainLevel: number;
    oceanLevel: number;
    windLevel: number;
    brownNoiseLevel: number;
    vinylCrackle: number;
    synthLevel: number;
    binauralLevel: number;
    reverbWet: number;
    filterCutoff: number;
  };
}

export const PRESETS: GenrePreset[] = [
  {
    id: 'misty-forest',
    name: 'Misty Forest',
    subtitle: 'Deep Focus',
    bgImage: '/backgrounds/misty-forest.jpg',
    fallbackGradient:
      'radial-gradient(120% 120% at 50% 0%, #1c3329 0%, #0e1a15 45%, #070d0a 100%)',
    accentColor: '#6FAE8C',
    accentColorSecondary: '#B7D8A8',
    particleColor: '111, 174, 140',
    audioConfig: {
      bpm: 75,
      binauralFreq: 40,
      binauralLabel: 'Gamma · 40Hz',
      carrierFreq: 180,
      synthChordScale: ['C4', 'E4', 'G4', 'B4'],
      synthWaveform: 'triangle',
      noiseTexture: 'wind',
      rainLevel: 0,
      oceanLevel: 0,
      windLevel: 0.35,
      brownNoiseLevel: 0.55,
      vinylCrackle: 0,
      synthLevel: 0.28,
      binauralLevel: 0.18,
      reverbWet: 0.25,
      filterCutoff: 1200,
    },
  },
  {
    id: 'pastel-bloom',
    name: 'Pastel Bloom',
    subtitle: 'Dream Lofi',
    bgImage: '/backgrounds/pastel-bloom.jpg',
    fallbackGradient:
      'radial-gradient(120% 120% at 50% 0%, #3a2740 0%, #241a2d 45%, #150f1a 100%)',
    accentColor: '#E8A9C4',
    accentColorSecondary: '#C9A6E0',
    particleColor: '232, 169, 196',
    audioConfig: {
      bpm: 62,
      binauralFreq: 10,
      binauralLabel: 'Alpha · 10Hz',
      carrierFreq: 210,
      synthChordScale: ['F3', 'A3', 'C4', 'E4', 'G4'],
      synthWaveform: 'sine',
      noiseTexture: 'vinyl',
      rainLevel: 0,
      oceanLevel: 0,
      windLevel: 0,
      brownNoiseLevel: 0,
      vinylCrackle: 0.4,
      synthLevel: 0.42,
      binauralLevel: 0.1,
      reverbWet: 0.35,
      filterCutoff: 2200,
    },
  },
  {
    id: 'cosmic-glow',
    name: 'Cosmic Glow',
    subtitle: 'Deep Zen',
    bgImage: '/backgrounds/cosmic-glow.jpg',
    fallbackGradient:
      'radial-gradient(120% 120% at 50% 0%, #142a3d 0%, #0c1a26 45%, #060f16 100%)',
    accentColor: '#E8B96A',
    accentColorSecondary: '#F4D9A0',
    particleColor: '232, 185, 106',
    audioConfig: {
      bpm: 48,
      binauralFreq: 4,
      binauralLabel: 'Theta · 4Hz',
      carrierFreq: 160,
      synthChordScale: ['D3', 'A3', 'D4', 'F#4'],
      synthWaveform: 'sine',
      noiseTexture: 'ocean',
      rainLevel: 0,
      oceanLevel: 0.5,
      windLevel: 0,
      brownNoiseLevel: 0.15,
      vinylCrackle: 0,
      synthLevel: 0.3,
      binauralLevel: 0.22,
      reverbWet: 0.55,
      filterCutoff: 800,
    },
  },
  {
    id: 'storm-deck',
    name: 'Storm Deck',
    subtitle: 'Rainy Window',
    bgImage: '/backgrounds/storm-deck.jpg',
    fallbackGradient:
      'radial-gradient(120% 120% at 50% 0%, #1a2430 0%, #10161d 45%, #080b0f 100%)',
    accentColor: '#7FA8C9',
    accentColorSecondary: '#A9C4DC',
    particleColor: '127, 168, 201',
    audioConfig: {
      bpm: 66,
      binauralFreq: 6,
      binauralLabel: 'Theta · 6Hz',
      carrierFreq: 175,
      synthChordScale: ['A3', 'C4', 'E4', 'G4'],
      synthWaveform: 'triangle',
      noiseTexture: 'rain',
      rainLevel: 0.6,
      oceanLevel: 0,
      windLevel: 0.1,
      brownNoiseLevel: 0.1,
      vinylCrackle: 0,
      synthLevel: 0.2,
      binauralLevel: 0.14,
      reverbWet: 0.3,
      filterCutoff: 1600,
    },
  },
];

export const DEFAULT_PRESET_ID = PRESETS[0].id;

export const getPresetById = (id: string): GenrePreset =>
  PRESETS.find((p) => p.id === id) ?? PRESETS[0];
