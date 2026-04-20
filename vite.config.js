import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Note: src/data/portfolio.js now ships sanitized demo values on all
// builds — no build-mode swap. Real values are served at runtime from
// GET /api/portfolio after authentication (see src/hooks/usePortfolio.js).

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    host: true,
  },
  build: {
    // Split vendor code into its own chunks so the initial parse/execute
    // doesn't need to churn through Recharts on first paint. Users hit
    // the app shell first, then Recharts/Lucide stream in.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':    ['react', 'react-dom'],
          'recharts-vendor': ['recharts'],
          'lucide-vendor':   ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
