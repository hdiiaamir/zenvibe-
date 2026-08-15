# Zenvibe — Contextual Real-Time Ambient Soundscape Generator

A generative, audio-reactive ambient soundscape app built with React + Vite,
Tailwind CSS, Framer Motion, and Tone.js. Blend binaural beats, procedural
noise textures, and generative lofi chords through mood presets that also
drive the visual theme — background imagery, accent palette, and a live
particle/spectrum visualizer.

## Quick start

```bash
npm install
npm run dev
```

Then open the printed local URL. Click **Begin session** — this is the
required user gesture that unlocks the browser's `AudioContext`.

## Adding background imagery

Drop high-resolution `.jpg`/`.webp` images into `public/backgrounds/` using
these exact filenames (referenced from `src/constants/presets.ts`):

```
public/backgrounds/misty-forest.jpg   → Misty Forest / Deep Focus
public/backgrounds/pastel-bloom.jpg   → Pastel Bloom / Dream Lofi
public/backgrounds/cosmic-glow.jpg    → Cosmic Glow / Deep Zen
public/backgrounds/storm-deck.jpg     → Storm Deck / Rainy Window
```

If an image is missing, `BackgroundBackdrop.tsx` automatically falls back to
a themed gradient (`fallbackGradient` in the preset config) so the app never
breaks — it just looks best once you supply real photography.

## Project structure

```
src/
  constants/presets.ts       Genre/mood preset schema (audio + visual theme)
  services/audioEngine.ts    Tone.js node graph: binaural pair, 4 noise
                              textures, generative PolySynth, master bus +
                              analyser, all param changes ramped (no pops)
  services/promptParser.ts   Rule-based NL → structured parameter diff
  components/
    BackgroundBackdrop.tsx   Framer Motion crossfade + vignette
    VisualizerCanvas.tsx     Canvas spectrum ring + particle field
    MixerPanel.tsx           Glassmorphism channel faders + mutes
    PromptBar.tsx            Natural language command input
    PresetSelector.tsx       Mood/genre switcher strip
    LaunchOverlay.tsx        Autoplay-compliant entry gesture
  App.tsx                    Root: audio lifecycle + layout composition
```

## Extending the natural language parser

`parsePrompt()` in `src/services/promptParser.ts` is deterministic and
dependency-free by design — it returns a structured `PromptIntent` object.
To upgrade to a real LLM-backed parser, swap the function body for an API
call that returns the same `PromptIntent` shape; nothing else in the app
needs to change.

## Notes

- Headphones are recommended — binaural beats rely on true stereo
  separation (left/right oscillators panned hard).
- All musical parameter changes use `rampTo` / `linearRampToValueAtTime`
  equivalents to avoid clicks when switching presets or applying prompts.
- Reduced-motion is respected for the ambient CSS drift animations.
