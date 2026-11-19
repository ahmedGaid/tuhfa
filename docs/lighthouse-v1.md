# Performance — v1 (T066)

## Bundle budget — checked in CI

`npm run size` (after `npm run build`) fails when all JS + CSS together pass **150 KB gzip**.
Fonts, book pages and icons are precached for offline use and are not part of the code budget.

| File (gzip)                          |       KB |
| ------------------------------------ | -------: |
| app (`assets/index-*.js`)            |     58.1 |
| Madd data (`assets/madd-*.js`, lazy) |     18.4 |
| styles (`assets/index-*.css`)        |      6.6 |
| service worker + workbox             |      6.9 |
| **total**                            | **90.0** |

Measured 2026-11-19 on `feat/m6-launch`. Offline precache: 44 files, ~4.2 MB (26 book pages ≈ 3.7 MB).

## Lighthouse mobile — NOT RUN YET

The agent session could not download Lighthouse (blocked by its permission rules). Run it once on
your PC and paste the scores below:

```bash
npm run build && npx vite preview --port 4180
```

```bash
npx lighthouse http://localhost:4180/tuhfa/ --form-factor=mobile --view
```

Or Chrome → DevTools → Lighthouse → Mobile → Analyze, on the live site after merge.

| Category       | Score |
| -------------- | ----: |
| Performance    |     — |
| Accessibility  |     — |
| Best practices |     — |
| SEO            |     — |
