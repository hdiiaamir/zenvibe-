import type { EngineLevels } from './audioEngine';

/**
 * Fast, dependency-free rule-based intent parser. Converts free-text
 * commands like "make it rain heavier and slow the tempo to 60 bpm" into a
 * structured diff the audioEngine can apply with smooth ramps.
 *
 * This is intentionally deterministic (no network call) so it works
 * instantly and offline — swap `parsePrompt` for an LLM call later without
 * touching the rest of the app, since the return shape stays the same.
 */

export interface PromptIntent {
  bpm?: number;
  bpmDelta?: number;
  levels: Partial<EngineLevels>;
  binauralFreq?: number;
  summary: string[];
}

const CHANNEL_WORDS: Record<string, keyof EngineLevels> = {
  rain: 'rain',
  ocean: 'ocean',
  wave: 'ocean',
  waves: 'ocean',
  sea: 'ocean',
  wind: 'wind',
  forest: 'wind',
  brown: 'brown',
  noise: 'brown',
  vinyl: 'vinyl',
  crackle: 'vinyl',
  synth: 'synth',
  chord: 'synth',
  chords: 'synth',
  lofi: 'synth',
  piano: 'synth',
  binaural: 'binaural',
  beat: 'binaural',
  beats: 'binaural',
  master: 'master',
  volume: 'master',
};

const INTENSITY_UP = ['heavier', 'more', 'louder', 'stronger', 'up', 'increase', 'boost'];
const INTENSITY_DOWN = ['lighter', 'less', 'quieter', 'softer', 'down', 'decrease', 'lower', 'reduce'];
const OFF_WORDS = ['off', 'mute', 'stop', 'remove', 'silence'];
const ON_WORDS = ['on', 'add', 'bring in', 'start', 'switch to', 'turn on'];

export function parsePrompt(rawText: string, currentLevels: EngineLevels): PromptIntent {
  const text = rawText.toLowerCase();
  const summary: string[] = [];
  const levels: Partial<EngineLevels> = {};
  let bpm: number | undefined;
  let binauralFreq: number | undefined;

  // --- Explicit BPM: "60 bpm", "tempo to 60" ---
  const bpmMatch = text.match(/(\d{2,3})\s*(bpm|beats per minute)/);
  const tempoToMatch = text.match(/tempo\s*(to|at)?\s*(\d{2,3})/);
  if (bpmMatch) {
    bpm = parseInt(bpmMatch[1], 10);
  } else if (tempoToMatch) {
    bpm = parseInt(tempoToMatch[2], 10);
  } else if (/slow(er)?/.test(text)) {
    bpm = -10; // relative marker, resolved by caller as a delta against current bpm
  } else if (/faster|speed up|quicken/.test(text)) {
    bpm = 10;
  }

  // --- Binaural brainwave targets ---
  if (/gamma/.test(text)) binauralFreq = 40;
  else if (/alpha/.test(text)) binauralFreq = 10;
  else if (/theta/.test(text)) binauralFreq = 4;
  else if (/delta/.test(text)) binauralFreq = 2;

  // --- Channel intensity / on-off detection ---
  for (const [word, channel] of Object.entries(CHANNEL_WORDS)) {
    if (!text.includes(word)) continue;

    const windowStart = Math.max(0, text.indexOf(word) - 18);
    const windowEnd = Math.min(text.length, text.indexOf(word) + word.length + 18);
    const localContext = text.slice(windowStart, windowEnd);

    const isOff = OFF_WORDS.some((w) => localContext.includes(w));
    const isOn = ON_WORDS.some((w) => localContext.includes(w));
    const isUp = INTENSITY_UP.some((w) => localContext.includes(w));
    const isDown = INTENSITY_DOWN.some((w) => localContext.includes(w));

    const current = currentLevels[channel] ?? 0.3;

    if (isOff) {
      levels[channel] = 0;
      summary.push(`${channel} off`);
    } else if (isUp) {
      levels[channel] = Math.min(1, current + 0.25);
      summary.push(`${channel} up`);
    } else if (isDown) {
      levels[channel] = Math.max(0, current - 0.25);
      summary.push(`${channel} down`);
    } else if (isOn && current < 0.05) {
      levels[channel] = 0.4;
      summary.push(`${channel} on`);
    }
  }

  if (bpm && bpm > 25 && bpm < 200) {
    summary.push(`tempo → ${bpm} bpm`);
  } else if (bpm === -10 || bpm === 10) {
    summary.push(bpm < 0 ? 'tempo slower' : 'tempo faster');
  }

  if (binauralFreq) {
    summary.push(`binaural → ${binauralFreq}Hz`);
  }

  if (summary.length === 0) {
    summary.push("couldn't find an adjustable parameter — try mentioning rain, synth, tempo, or binaural");
  }

  return {
    bpm: bpm && bpm > 25 && bpm < 200 ? bpm : undefined,
    bpmDelta: bpm === -10 || bpm === 10 ? bpm : undefined,
    levels,
    binauralFreq,
    summary,
  };
}
