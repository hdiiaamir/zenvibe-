import { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface VisualizerCanvasProps {
  accentColor: string; // e.g. "#6FAE8C"
  particleColorRgb: string; // e.g. "111, 174, 140"
  playing: boolean;
}

interface Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  drift: number;
}

/**
 * Canvas overlay: a breathing spectrum ring at the visual center driven by
 * FFT bass/mid/treble energy, plus a slow-orbiting particle field that
 * pulses in size/opacity with transients. Purely additive — sits above the
 * backdrop, below the glass UI (z-index handled by caller).
 */
export default function VisualizerCanvas({
  accentColor,
  particleColorRgb,
  playing,
}: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const smoothedRef = useRef({ bass: 0, mid: 0, treble: 0, overall: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 64 }, () => {
        const baseRadius = 140 + Math.random() * 260;
        return {
          angle: Math.random() * Math.PI * 2,
          radius: baseRadius,
          baseRadius,
          speed: (Math.random() - 0.5) * 0.0015,
          size: 0.8 + Math.random() * 2.2,
          drift: Math.random() * Math.PI * 2,
        };
      });
    }

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h * 0.44;

      ctx.clearRect(0, 0, w, h);

      const snap = playing
        ? audioEngine.getSnapshot()
        : { bass: 0, mid: 0, treble: 0, overall: 0, waveform: new Float32Array(0) };

      const sm = smoothedRef.current;
      const ease = 0.12;
      sm.bass += (snap.bass - sm.bass) * ease;
      sm.mid += (snap.mid - sm.mid) * ease;
      sm.treble += (snap.treble - sm.treble) * ease;
      sm.overall += (snap.overall - sm.overall) * ease;

      // ---- Spectrum ring ----
      const baseRadius = 92 + sm.bass * 46;
      const segments = 96;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const theta = t * Math.PI * 2;
        const wobble =
          Math.sin(theta * 6 + performance.now() * 0.0006) * (4 + sm.mid * 18) +
          Math.sin(theta * 13 - performance.now() * 0.0004) * (2 + sm.treble * 10);
        const r = baseRadius + wobble;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${particleColorRgb}, ${0.35 + sm.overall * 0.45})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 18 + sm.bass * 40;
      ctx.stroke();

      // inner soft glow disc
      const glowRadius = baseRadius * 0.7;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      gradient.addColorStop(0, `rgba(${particleColorRgb}, ${0.18 + sm.overall * 0.22})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ---- Orbiting particle field ----
      ctx.save();
      ctx.translate(cx, cy);
      for (const p of particlesRef.current) {
        p.angle += p.speed + sm.treble * 0.002;
        const pulsedRadius = p.baseRadius + Math.sin(performance.now() * 0.0003 + p.drift) * 10;
        const x = Math.cos(p.angle) * pulsedRadius;
        const y = Math.sin(p.angle) * pulsedRadius * 0.55; // flatten into an ellipse
        const size = p.size + sm.bass * 3.5;
        const alpha = 0.25 + sm.overall * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${particleColorRgb}, ${alpha})`;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 6;
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [accentColor, particleColorRgb, playing]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
