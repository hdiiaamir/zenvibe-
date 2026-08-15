import { motion } from 'framer-motion';
import { PRESETS, type GenrePreset } from '../constants/presets';

interface PresetSelectorProps {
  activeId: string;
  onSelect: (preset: GenrePreset) => void;
}

export default function PresetSelector({ activeId, onSelect }: PresetSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => {
        const active = preset.id === activeId;
        return (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={`group relative overflow-hidden rounded-full border px-4 py-2 text-left transition-all ${
              active
                ? 'border-white/40 bg-white/10'
                : 'border-white/10 bg-black/30 hover:border-white/25 hover:bg-black/40'
            }`}
          >
            {active && (
              <motion.span
                layoutId="preset-glow"
                className="absolute inset-0 -z-10 opacity-40"
                style={{
                  background: `radial-gradient(60% 100% at 30% 50%, ${preset.accentColor}55, transparent 70%)`,
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 28 }}
              />
            )}
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: preset.accentColor,
                  boxShadow: active ? `0 0 8px 2px ${preset.accentColor}99` : 'none',
                }}
              />
              <div className="leading-tight">
                <div className="font-display text-[13px] text-white/90">{preset.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-white/45">
                  {preset.subtitle}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
