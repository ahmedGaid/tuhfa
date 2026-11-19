import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

// Project page on GitHub Pages lives under /<repo>/. Forks set VITE_BASE to their own repo name.
const base = process.env.VITE_BASE ?? '/tuhfa/';

// Book pages (T051, research R10): reference/img/*.jpg → <base>book/*.jpg. The Sheikh approved
// showing them; VITE_INCLUDE_BOOK_PAGES=false leaves them out (and hides the page button).
const includeBook = process.env.VITE_INCLUDE_BOOK_PAGES !== 'false';
const BOOK_DIR = 'reference/img';

function bookPages(): Plugin {
  const files = () => readdirSync(BOOK_DIR).filter((f) => /^[a-z0-9-]+\.jpg$/.test(f));
  return {
    name: 'tuhfa-book-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const m = /\/book\/([a-z0-9-]+\.jpg)$/.exec(req.url ?? '');
        if (!includeBook || !m || !files().includes(m[1]!)) return next();
        res.setHeader('Content-Type', 'image/jpeg');
        res.end(readFileSync(join(BOOK_DIR, m[1]!)));
      });
    },
    generateBundle() {
      if (!includeBook) return;
      for (const f of files())
        this.emitFile({ type: 'asset', fileName: `book/${f}`, source: readFileSync(join(BOOK_DIR, f)) });
    },
  };
}

export default defineConfig({
  base,
  plugins: [
    preact(),
    bookPages(),
    // Offline after one visit (T059, research R8, D-06): precache every built file incl. fonts and
    // book pages. Hash routing → every navigation is index.html.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: 'تحفة — أحكام التجويد',
        short_name: 'تحفة',
        description: 'تعلّم أحكام التجويد خطوة بخطوة، من دروس فضيلة الشيخ جابر في شرح متن تحفة الأطفال.',
        lang: 'ar',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f5f3',
        theme_color: '#f5f5f3',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,jpg,woff2,webmanifest}'],
        // manifest + its icons are added by the plugin itself
        globIgnores: ['manifest.webmanifest', 'icons/icon-*.png', 'icons/maskable-*.png'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BOOK_PAGES__: JSON.stringify(includeBook),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
