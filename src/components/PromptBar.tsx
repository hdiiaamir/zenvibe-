import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface PromptBarProps {
  accentColor: string;
  onSubmit: (text: string) => void;
  lastFeedback: string[] | null;
}

const SUGGESTIONS = [
  'Make it rain heavier and slow the tempo to 60 bpm',
  'Bring in lofi chords and switch to alpha waves',
  'Turn off the synth, more ocean',
  'Speed up and boost the binaural beat',
];

export default function PromptBar({ accentColor, onSubmit, lastFeedback }: PromptBarProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!lastFeedback) return;
    const t = setTimeout(() => {}, 0);
    return () => clearTimeout(t);
  }, [lastFeedback]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setValue('');
  };

  return (
    <div className="w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="relative"
        style={{ ['--accent' as any]: accentColor }}
      >
        <div
          className={`flex items-center gap-3 rounded-full border bg-black/40 px-4 py-3 backdrop-blur-md transition-shadow ${
            focused ? 'border-white/30 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]' : 'border-white/10'
          }`}
        >
          <Sparkles size={16} style={{ color: accentColor }} className="shrink-0" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Tell Zenvibe what to change… e.g. “make it rain heavier”"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-black transition-transform disabled:opacity-30 disabled:hover:scale-100 hover:scale-105"
            style={{ backgroundColor: accentColor }}
            aria-label="Apply prompt"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </form>

      <div className="mt-2.5 flex flex-wrap gap-1.5 px-1">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/55 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/80"
          >
            {s}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lastFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2 px-1 font-mono text-[11px] text-white/50"
          >
            → {lastFeedback.join(' · ')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
