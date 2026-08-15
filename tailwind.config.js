/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        body: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        void: {
          950: '#0a0d0c',
          900: '#0e1211',
          800: '#151a19',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.08)', opacity: '0.9' },
        },
        driftSlow: {
          '0%': { transform: 'translate3d(0,0,0) scale(1.02)' },
          '50%': { transform: 'translate3d(-1.5%,-1%,0) scale(1.06)' },
          '100%': { transform: 'translate3d(0,0,0) scale(1.02)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '0' },
          '10%': { opacity: '1' },
          '100%': { transform: 'translateY(-40px)', opacity: '0' },
        },
      },
      animation: {
        breathe: 'breathe 6s ease-in-out infinite',
        driftSlow: 'driftSlow 26s ease-in-out infinite',
        floatUp: 'floatUp 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
