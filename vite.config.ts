import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';

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
  plugins: [preact(), bookPages()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BOOK_PAGES__: JSON.stringify(includeBook),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
