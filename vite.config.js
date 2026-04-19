import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const IS_DEMO = process.env.VITE_DEMO_MODE === 'true';

// In demo mode (GitHub Pages build) swap the real portfolio seed for
// a sanitized version. Implemented as a Rollup resolveId hook so any
// import that lands on /src/data/portfolio(.js) — regardless of how
// the source spelled the relative path — gets redirected to the demo
// file. The real portfolio.js never enters the demo bundle.
const swapPortfolioForDemo = {
  name: 'swap-portfolio-for-demo',
  enforce: 'pre',
  resolveId(id, importer) {
    if (!importer) return null;
    // Resolve the candidate to an absolute path so we can compare
    // against the real portfolio.js regardless of relative depth.
    const abs = path.resolve(path.dirname(importer), id);
    const realPath = path.resolve(ROOT, 'src/data/portfolio');
    if (abs === realPath || abs === `${realPath}.js`) {
      return path.resolve(ROOT, 'src/data/portfolio.demo.js');
    }
    return null;
  },
};

export default defineConfig({
  plugins: [react(), ...(IS_DEMO ? [swapPortfolioForDemo] : [])],
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
