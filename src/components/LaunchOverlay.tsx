import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';

interface LaunchOverlayProps {
  visible: boolean;
  loading: boolean;
  onLaunch: () => void;
}

/**
 * Browsers block audio until a user gesture resumes the AudioContext.
 * This overlay is that gesture — a deliberate "Enter flow state" moment
 * rather than a jarring silent app.
 */
export default function LaunchOverlay({ visible, loading, onLaunch }: LaunchOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-void-950"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex flex-col items-center px-6 text-center"
          >
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.35em] text-white/40">
              Zenvibe
            </div>
            <h1 className="font-display text-4xl font-medium tracking-tight text-white sm:text-5xl">
              Enter your flow state
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Layered binaural tones, procedural textures, and generative chords —
              blended live and shaped by whatever you tell it.
            </p>

            <button
              onClick={onLaunch}
              disabled={loading}
              className="group mt-9 flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-md transition-all hover:border-white/30 hover:bg-white/15 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Warming up the audio engine…
                </>
              ) : (
                <>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition-transform group-hover:scale-105">
                    <Play size={12} fill="black" />
                  </span>
                  Begin session
                </>
              )}
            </button>
            <p className="mt-4 font-mono text-[10px] text-white/25">
              Uses your device audio — headphones recommended for binaural layers
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
