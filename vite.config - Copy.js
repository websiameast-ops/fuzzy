import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static marketing site, served from GitHub Pages sub-path.
// If later moved to a custom domain root, change base back to '/'.
export default defineConfig({
  base: '/fuzzy-octo-lamp/',
  plugins: [react()],
});
