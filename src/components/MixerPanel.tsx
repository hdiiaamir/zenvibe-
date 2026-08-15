import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Waves, CloudRain, Wind, Disc3, Music2, Sliders } from 'lucide-react';
import type { EngineLevels, ChannelId } from '../services/audioEngine';

interface FaderDef {
  key: keyof EngineLevels;
  label: string;
  icon: ReactNode;
  group: ChannelId;
}

interface MixerPanelProps {
  levels: EngineLevels;
  muted: Record<ChannelId, boolean>;
  accentColor: string;
  onLevelChange: (key: keyof EngineLevels, value: number) => void;
  onToggleMute: (group: ChannelId) => void;
  binauralLabel: string;
}

const FADERS: FaderDef[] = [
  { key: 'rain', label: 'Rain', icon: <CloudRain size={13} />, group: 'noise' },
  { key: 'ocean', label: 'Ocean', icon: <Waves size={13} />, group: 'noise' },
  { key: 'wind', label: 'Wind', icon: <Wind size={13} />, group: 'noise' },
  { key: 'vinyl', label: 'Vinyl', icon: <Disc3 size={13} />, group: 'noise' },
];

export default function MixerPanel({
  levels,
  muted,
  accentColor,
  onLevelChange,
  onToggleMute,
  binauralLabel,
}: MixerPanelProps) {
  const fillPct = (v: number) => `${Math.round(v * 100)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-md"
      style={{ ['--accent' as any]: accentColor }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50">
          <Sliders size={13} />
          Mixer
        </div>
        <FaderRow
          compact
          label="Master"
          value={levels.master}
          onChange={(v) => onLevelChange('master', v)}
          fillPct={fillPct}
          icon={levels.master > 0.01 ? <Volume2 size={13} /> : <VolumeX size={13} />}
        />
      </div>

      {/* Binaural */}
      <ChannelGroup
        title={`Binaural — ${binauralLabel}`}
        muted={muted.binaural}
        onToggleMute={() => onToggleMute('binaural')}
      >
        <FaderRow
          label="Beat depth"
          value={levels.binaural}
          onChange={(v) => onLevelChange('binaural', v)}
          fillPct={fillPct}
          disabled={muted.binaural}
        />
      </ChannelGroup>

      {/* Noise textures */}
      <ChannelGroup
        title="Ambient Textures"
        muted={muted.noise}
        onToggleMute={() => onToggleMute('noise')}
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {FADERS.map((f) => (
            <FaderRow
              key={f.key}
              label={f.label}
              icon={f.icon}
              value={levels[f.key]}
              onChange={(v) => onLevelChange(f.key, v)}
              fillPct={fillPct}
              disabled={muted.noise}
            />
          ))}
        </div>
      </ChannelGroup>

      {/* Synth */}
      <ChannelGroup
        title="Generative Chords"
        muted={muted.synth}
        onToggleMute={() => onToggleMute('synth')}
        icon={<Music2 size={13} />}
      >
        <FaderRow
          label="Chord level"
          value={levels.synth}
          onChange={(v) => onLevelChange('synth', v)}
          fillPct={fillPct}
          disabled={muted.synth}
        />
      </ChannelGroup>
    </motion.div>
  );
}

function ChannelGroup({
  title,
  muted,
  onToggleMute,
  children,
  icon,
}: {
  title: string;
  muted: boolean;
  onToggleMute: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-white/60">
          {icon}
          {title}
        </span>
        <button
          onClick={onToggleMute}
          className={`rounded-full p-1.5 transition-colors ${
            muted ? 'bg-white/10 text-white/40' : 'text-white/70 hover:bg-white/10'
          }`}
          aria-label={muted ? 'Unmute channel' : 'Mute channel'}
          aria-pressed={muted}
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>
      <div className={muted ? 'opacity-40' : ''}>{children}</div>
    </div>
  );
}

function FaderRow({
  label,
  value,
  onChange,
  fillPct,
  icon,
  disabled,
  compact,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  fillPct: (v: number) => string;
  icon?: ReactNode;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'flex w-32 items-center gap-2' : ''}>
      {!compact && (
        <div className="mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            {icon}
            {label}
          </span>
          <span className="font-mono text-[10px] text-white/40">{Math.round(value * 100)}</span>
        </div>
      )}
      {compact && icon}
      <input
        type="range"
        className="zen-slider"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ['--fill' as any]: fillPct(value) }}
        aria-label={label}
      />
    </div>
  );
}
