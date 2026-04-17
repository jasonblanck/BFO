/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#03060C',
          900: '#060A14',
          850: '#0A1020',
          800: '#0D1526',
          700: '#11182B',
          600: '#1A2340',
        },
        hud: {
          emerald: '#00FF41',
          cyan: '#00F0FF',
          amber: '#FFB020',
          red: '#FF3355',
          violet: '#A78BFA',
        },
        // Back-compat (existing components use these tokens)
        accent: {
          green: '#00FF41',
          blue: '#00F0FF',
          amber: '#FFB020',
          red: '#FF3355',
          violet: '#A78BFA',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'ui-monospace', 'monospace'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green':  '0 0 14px rgba(0, 255, 65, 0.55)',
        'glow-blue':   '0 0 14px rgba(0, 240, 255, 0.55)',
        'glow-emerald':'0 0 16px rgba(0, 255, 65, 0.6), inset 0 0 0 1px rgba(0,255,65,0.25)',
        'glow-cyan':   '0 0 16px rgba(0, 240, 255, 0.6), inset 0 0 0 1px rgba(0,240,255,0.25)',
        'glow-amber':  '0 0 14px rgba(255, 176, 32, 0.55)',
        'glow-red':    '0 0 14px rgba(255, 51, 85, 0.55)',
        'hud-edge':    'inset 0 0 0 1px rgba(0,255,65,0.35), 0 0 24px -4px rgba(0,255,65,0.25)',
      },
      animation: {
        'ticker':      'ticker 60s linear infinite',
        'pulse-dot':   'pulse-dot 1.6s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s linear infinite',
        'scan-v':      'scan-v 8s cubic-bezier(.4,0,.2,1) infinite',
        'scan-h':      'scan-h 30s linear infinite',
        'heartbeat':   'heartbeat 1.4s ease-in-out infinite',
        'flicker':     'flicker 3.2s steps(4, end) infinite',
        'glitch':      'glitch 650ms steps(2, end) infinite',
        'node-pulse':  'node-pulse 2.2s ease-in-out infinite',
        'log-in':      'log-in 400ms ease-out',
      },
      keyframes: {
        ticker:     { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'pulse-dot':{ '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: .35, transform: 'scale(.8)' } },
        shimmer:    { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'scan-v': {
          '0%':   { transform: 'translateY(-10%)', opacity: '0' },
          '8%':   { opacity: '.8' },
          '50%':  { transform: 'translateY(55vh)', opacity: '.9' },
          '92%':  { opacity: '.8' },
          '100%': { transform: 'translateY(120%)', opacity: '0' },
        },
        'scan-h': {
          '0%':   { transform: 'translateX(-10%)' },
          '100%': { transform: 'translateX(110%)' },
        },
        heartbeat: {
          '0%,100%': { textShadow: '0 0 0 rgba(0,255,65,0)', transform: 'scale(1)' },
          '30%':     { textShadow: '0 0 14px rgba(0,255,65,.7)', transform: 'scale(1.015)' },
          '60%':     { textShadow: '0 0 6px rgba(0,255,65,.35)', transform: 'scale(1.005)' },
        },
        flicker: {
          '0%,19%,21%,23%,80%,100%': { opacity: '1' },
          '20%,22%': { opacity: '.55' },
        },
        glitch: {
          '0%':   { clipPath: 'inset(0 0 0 0)', transform: 'translate(0)' },
          '20%':  { clipPath: 'inset(8% 0 78% 0)', transform: 'translate(-1px, 0)' },
          '40%':  { clipPath: 'inset(42% 0 38% 0)', transform: 'translate(1px, 0)' },
          '60%':  { clipPath: 'inset(72% 0 10% 0)', transform: 'translate(-1px, 0)' },
          '80%':  { clipPath: 'inset(25% 0 55% 0)', transform: 'translate(1px, 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)', transform: 'translate(0)' },
        },
        'node-pulse': {
          '0%,100%': { transform: 'scale(1)', opacity: '.9' },
          '50%':     { transform: 'scale(1.6)', opacity: '.2' },
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
