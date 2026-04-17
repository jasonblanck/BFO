/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#04070F',
          900: '#07101F',
          850: '#0B1628',
          800: '#111E36',
          700: '#17294A',
          600: '#223A66',
          500: '#2F4F8A',
        },
        ms: {
          // Morgan Stanley institutional blue family
          900: '#002554',
          800: '#003A76',
          700: '#00498C',
          600: '#005EB8',
          500: '#0077C8',
          400: '#3DA9FC',
          300: '#7BC6FF',
        },
        gain: {
          500: '#00FF88',
          400: '#26FF9B',
        },
        loss: {
          500: '#FF3B58',
          400: '#FF5E75',
        },
        hud: {
          emerald: '#00FF41',
          cyan: '#00F0FF',
          amber: '#F59E0B',
          red: '#EF4444',
          violet: '#8B5CF6',
        },
        // Legacy tokens — preserved so previously-styled components keep rendering
        accent: {
          green: '#00FF88',
          blue: '#005EB8',
          amber: '#F59E0B',
          red: '#FF3B58',
          violet: '#8B5CF6',
        },
        // Row-hover canvas — TradingView uses slate-800ish on hover
        row: {
          hover: '#1E293B',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue':    '0 0 10px rgba(0, 94, 184, 0.35)',
        'glow-green':   '0 0 10px rgba(0, 255, 136, 0.45)',
        'glow-red':     '0 0 10px rgba(255, 59, 88, 0.35)',
        'glow-amber':   '0 0 10px rgba(245, 158, 11, 0.35)',
        'hud-edge':     'inset 0 0 0 1px rgba(0, 94, 184, 0.35), 0 0 20px -4px rgba(0, 94, 184, 0.2)',
      },
      animation: {
        'ticker':      'ticker 60s linear infinite',
        'pulse-dot':   'pulse-dot 1.8s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'scan-v':      'scan-v 10s cubic-bezier(.4,0,.2,1) infinite',
        'heartbeat':   'heartbeat 1.4s ease-in-out infinite',
        'flicker':     'flicker 3.2s steps(4, end) infinite',
        'node-pulse':  'node-pulse 2.4s ease-in-out infinite',
        'log-in':      'log-in 400ms ease-out',
      },
      keyframes: {
        ticker:     { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-dot':{ '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: .4, transform: 'scale(.8)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'scan-v': {
          '0%':   { transform: 'translateY(-10%)', opacity: '0' },
          '10%':  { opacity: '.55' },
          '50%':  { transform: 'translateY(55vh)', opacity: '.7' },
          '90%':  { opacity: '.55' },
          '100%': { transform: 'translateY(120%)', opacity: '0' },
        },
        heartbeat: {
          '0%,100%': { textShadow: '0 0 0 rgba(16,185,129,0)', transform: 'scale(1)' },
          '30%':     { textShadow: '0 0 10px rgba(16,185,129,.55)', transform: 'scale(1.01)' },
          '60%':     { textShadow: '0 0 4px rgba(16,185,129,.25)', transform: 'scale(1.004)' },
        },
        flicker: {
          '0%,19%,21%,23%,80%,100%': { opacity: '1' },
          '20%,22%': { opacity: '.6' },
        },
        'node-pulse': {
          '0%,100%': { transform: 'scale(1)', opacity: '.9' },
          '50%':     { transform: 'scale(1.5)', opacity: '.25' },
        },
        'log-in': {
          '0%':   { opacity: '0', transform: 'translateX(-6px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
