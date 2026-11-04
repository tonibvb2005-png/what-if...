import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' so the build also works from a sub-path (e.g. GitHub Pages).
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'node' },
});
