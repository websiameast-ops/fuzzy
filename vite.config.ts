import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Static marketing site, served from GitHub Pages sub-path.
// If later moved to a custom domain root, change base back to '/'.
export default defineConfig({
  base: '/fuzzy/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5173 },
});
