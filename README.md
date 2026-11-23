# تحفة — Tuhfa

<div dir="rtl">

**تحفة** تطبيق مجاني بيعلّمك أحكام التجويد (رواية حفص) خطوة بخطوة، بأسلوب الدروس القصيرة
والتمارين، من دروس **فضيلة الشيخ جابر** في شرح متن تحفة الأطفال.

- مجاني، من غير حساب ولا تسجيل، ومن غير إعلانات.
- بيشتغل من غير نت بعد أول فتحة، وتقدر تضيفه للشاشة الرئيسية زي أي تطبيق.
- تقدّمك محفوظ على جهازك بس. لو هتغيّر الموبايل: «حسابي» ← انسخ الكود، والصقه على الجهاز الجديد.
- النسخة الأولى فيها **باب المد** كامل؛ باقي الأبواب «قريبًا».

**افتحه من هنا:** <https://ahmedgaid.github.io/tuhfa/>

</div>

## What it is

A free, static, offline-first web app (PWA) that teaches Tajweed (Hafs) in short Duolingo-style
lessons, built from Sheikh Jaber's course on متن تحفة الأطفال. Arabic, right-to-left, phone-first.
No server, no accounts, no tracking — progress lives in the browser's `localStorage`.

v1 ships the Madd chapter (24 lessons and checkpoints, ten exercise kinds, review of mistakes and
due items, a library with the chapter map and book pages). Other chapters show as «قريبًا».

## Run it locally

Needs Node 22+.

```bash
npm ci
```

```bash
npm run dev
```

Open the address it prints (it ends in `/tuhfa/`). Phone size: browser dev tools → 390 × 844.

All checks (the same ones CI runs):

```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:unit && npm run validate && npm run build && npm run size && npm run test:e2e
```

First e2e run only: `npx playwright install chromium`.

## Deploy your own copy

1. Fork this repo on GitHub.
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Push to `main`. The `CI and deploy` workflow tests, builds and publishes to
   `https://<you>.github.io/<repo>/` (the base path follows the repo name automatically).

To build without the book page images: `VITE_INCLUDE_BOOK_PAGES=false npm run build`.

## Edit or add content

A chapter is **data only** — no engine code changes. Step-by-step guide (Arabic + English):
[CONTENT_GUIDE.md](CONTENT_GUIDE.md).

Hard rules: rules and definitions come only from the Sheikh's book and lessons; Quran text comes only
from `data/quran-uthmani.txt` (Tanzil) and stays hidden until verified. `npm run validate` enforces
it. Open review items: [CONTENT_NOTES.md](CONTENT_NOTES.md).

## How it is built

Vite + Preact + TypeScript · `@preact/signals` · zod content schema · `vite-plugin-pwa` (offline) ·
Vitest + Playwright (+ axe). Engine in `src/engine/` (never imports content), content in
`src/content/`, UI in `src/ui/`, learner state in `src/state/`. Specs and decisions:
`specs/001-madd-v1/`, `docs/DECISIONS.md`.

## Credits

- **Course content:** فضيلة الشيخ جابر — شرح متن تحفة الأطفال. Book pages are shown with his
  approval; full recordings are not re-hosted here.
- **Quran text:** نص القرآن من مشروع تنزيل ([tanzil.net](https://tanzil.net)) — Uthmani text, used
  verbatim with attribution (see `data/TANZIL-LICENSE.md`).
- **Fonts:** Cairo and Scheherazade New (SIL Open Font License), via Fontsource.
