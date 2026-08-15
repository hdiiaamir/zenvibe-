import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, PanelBottomOpen, PanelBottomClose, Waves } from 'lucide-react';
import BackgroundBackdrop from './components/BackgroundBackdrop';
import VisualizerCanvas from './components/VisualizerCanvas';
import MixerPanel from './components/MixerPanel';
import PromptBar from './components/PromptBar';
import PresetSelector from './components/PresetSelector';
import LaunchOverlay from './components/LaunchOverlay';
import { getPresetById, DEFAULT_PRESET_ID, type GenrePreset } from './constants/presets';
import { audioEngine, type EngineLevels, type ChannelId } from './services/audioEngine';
import { parsePrompt } from './services/promptParser';

export default function App() {
  const [sessionStarted, setSessionStarted] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [activePreset, setActivePreset] = useState<GenrePreset>(getPresetById(DEFAULT_PRESET_ID));
  const [levels, setLevels] = useState<EngineLevels>(audioEngine.getLevels());
  const [muted, setMuted] = useState<Record<ChannelId, boolean>>({
    binaural: false,
    noise: false,
    synth: false,
  });
  const [playing, setPlaying] = useState(true);
  const [mixerOpen, setMixerOpen] = useState(true);
  const [feedback, setFeedback] = useState<string[] | null>(null);
  const feedbackTimeout = useRef<number>();

  const handleLaunch = async () => {
    setLaunching(true);
    await audioEngine.init();
    audioEngine.applyPreset(activePreset, 2.2);
    setLevels(audioEngine.getLevels());
    setLaunching(false);
    setSessionStarted(true);
  };

  const handleSelectPreset = useCallback((preset: GenrePreset) => {
    setActivePreset(preset);
    audioEngine.applyPreset(preset);
    // Slight delay so the ramps have started before we read levels back
    window.setTimeout(() => setLevels(audioEngine.getLevels()), 50);
  }, []);

  const handleLevelChange = (key: keyof EngineLevels, value: number) => {
    setLevels((prev) => ({ ...prev, [key]: value }));
    audioEngine.setChannelLevel(key, value);
  };

  const handleToggleMute = (channel: ChannelId) => {
    setMuted((prev) => {
      const next = { ...prev, [channel]: !prev[channel] };
      audioEngine.setMute(channel, next[channel]);
      return next;
    });
  };

  const handleTogglePlay = () => {
    const next = !playing;
    setPlaying(next);
    audioEngine.setChannelLevel('master', next ? levels.master || 0.8 : 0, 0.35);
  };

  const handlePromptSubmit = (text: string) => {
    const intent = parsePrompt(text, levels);

    if (intent.bpm) {
      audioEngine.setBpm(intent.bpm);
    } else if (intent.bpmDelta) {
      audioEngine.setBpm(audioEngine.getBpm() + intent.bpmDelta);
    }

    if (intent.binauralFreq) {
      audioEngine.setBinauralFreq(intent.binauralFreq);
    }

    if (Object.keys(intent.levels).length > 0) {
      setLevels((prev) => {
        const next = { ...prev, ...intent.levels };
        Object.entries(intent.levels).forEach(([k, v]) => {
          audioEngine.setChannelLevel(k as keyof EngineLevels, v as number, 0.6);
        });
        return next;
      });
    }

    setFeedback(intent.summary);
    window.clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = window.setTimeout(() => setFeedback(null), 5000);
  };

  useEffect(() => {
    return () => {
      window.clearTimeout(feedbackTimeout.current);
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      <BackgroundBackdrop preset={activePreset} />
      <VisualizerCanvas
        accentColor={activePreset.accentColor}
        particleColorRgb={activePreset.particleColor}
        playing={sessionStarted && playing}
      />

      <LaunchOverlay visible={!sessionStarted} loading={launching} onLaunch={handleLaunch} />

      {sessionStarted && (
        <div className="relative z-10 flex min-h-screen flex-col justify-between p-4 sm:p-6">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30 backdrop-blur-md">
                <Waves size={16} style={{ color: activePreset.accentColor }} />
              </div>
              <div>
                <div className="font-display text-lg leading-none tracking-tight">Zenvibe</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
                  {activePreset.name} · {activePreset.subtitle}
                </div>
              </div>
            </div>

            <PresetSelector activeId={activePreset.id} onSelect={handleSelectPreset} />
          </motion.header>

          {/* Bottom dock */}
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4">
            <PromptBar
              accentColor={activePreset.accentColor}
              onSubmit={handlePromptSubmit}
              lastFeedback={feedback}
            />

            <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-end sm:justify-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlay}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md transition-transform hover:scale-105"
                  aria-label={playing ? 'Pause soundscape' : 'Resume soundscape'}
                  style={{ boxShadow: playing ? `0 0 18px 2px ${activePreset.accentColor}33` : 'none' }}
                >
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  onClick={() => setMixerOpen((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md transition-transform hover:scale-105 sm:hidden"
                  aria-label={mixerOpen ? 'Hide mixer' : 'Show mixer'}
                >
                  {mixerOpen ? <PanelBottomClose size={16} /> : <PanelBottomOpen size={16} />}
                </button>
              </div>

              {mixerOpen && (
                <MixerPanel
                  levels={levels}
                  muted={muted}
                  accentColor={activePreset.accentColor}
                  onLevelChange={handleLevelChange}
                  onToggleMute={handleToggleMute}
                  binauralLabel={activePreset.audioConfig.binauralLabel}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
