import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Project page on GitHub Pages lives under /<repo>/. Forks set VITE_BASE to their own repo name.
const base = process.env.VITE_BASE ?? '/tuhfa/';

export default defineConfig({
  base,
  plugins: [preact()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
