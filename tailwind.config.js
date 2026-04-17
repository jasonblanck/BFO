/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060A14',
          900: '#0A1020',
          850: '#0D1526',
          800: '#0F172A',
          700: '#162138',
          600: '#1F2D4A',
        },
        accent: {
          green: '#00FFA3',
          blue: '#3DA9FC',
          amber: '#FFB020',
          red: '#FF4D6D',
          violet: '#A78BFA',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 14px rgba(0, 255, 163, 0.45)',
        'glow-blue': '0 0 14px rgba(61, 169, 252, 0.45)',
        'glow-amber': '0 0 14px rgba(255, 176, 32, 0.45)',
        'glow-red': '0 0 14px rgba(255, 77, 109, 0.45)',
        'lift': '0 20px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'ticker': 'ticker 60s linear infinite',
        'pulse-dot': 'pulse-dot 1.6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.35, transform: 'scale(0.8)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
