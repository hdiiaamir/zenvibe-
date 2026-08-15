import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import type { GenrePreset } from '../constants/presets';

interface BackgroundBackdropProps {
  preset: GenrePreset;
}

/**
 * Full-bleed backdrop: crossfades the active preset's image (or a themed
 * gradient fallback if no local image has been dropped into
 * /public/backgrounds/), with a slow ambient drift and a dark vignette
 * layered on top so foreground text/glass panels stay legible.
 */
export default function BackgroundBackdrop({ preset }: BackgroundBackdropProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const imageFailed = failedImages[preset.bgImage];

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-void-950">
      <AnimatePresence mode="sync">
        <motion.div
          key={preset.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {!imageFailed ? (
            <div
              className="absolute inset-0 animate-driftSlow bg-cover bg-center"
              style={{ backgroundImage: `url(${preset.bgImage})` }}
            >
              {/* transparent 1x1 probe to detect a missing local asset */}
              <img
                src={preset.bgImage}
                alt=""
                className="hidden"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [preset.bgImage]: true }))
                }
              />
            </div>
          ) : (
            <div
              className="absolute inset-0 animate-driftSlow"
              style={{ background: preset.fallbackGradient }}
            />
          )}

          {/* Color wash tying the image/gradient to the preset accent */}
          <div
            className="absolute inset-0 mix-blend-soft-light opacity-60"
            style={{
              background: `radial-gradient(80% 60% at 50% 20%, ${preset.accentColor}33, transparent 70%)`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Vignette for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.55)]" />
    </div>
  );
}
