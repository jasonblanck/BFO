import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/BFO/' : '/',
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
