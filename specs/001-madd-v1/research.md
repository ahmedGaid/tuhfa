# Phase 0 Research — Tuhfa v1

Each item: **Decision · Rationale · Alternatives considered.**

## R1. UI framework
- **Decision**: Preact 10 + `@preact/signals`, TSX.
- **Rationale**: ~4 KB core; component model needed for 10 exercise views + 10 screens; signals give
  simple global progress state without a store library. Fits the 150 KB budget with room.
- **Alternatives**: vanilla TS (prototype style) — rejected, the prototype's 900-line file is the
  problem being fixed; React — 40 KB+ for no gain; Svelte — fine but outside PROMPT's stated stack.

## R2. Routing
- **Decision**: own hash router (`#/path`, `#/lesson/:module/:lesson`, `#/library/...`, `#/review`,
  `#/me`, `#/about`), ~40 lines, signal-based.
- **Rationale**: GitHub Pages has no rewrites; hash deep links just work; no dependency.
- **Alternatives**: `preact-router` / wouter — extra KB, history-mode needs 404 hack.

## R3. Quran text source and verification
- **Decision**: commit Tanzil **Uthmani** plain text (`data/quran-uthmani.txt`, `sura|aya|text`
  format) as a build-time asset; never shipped to the browser. `verify-quran.ts` checks that each
  `verified:true` example's `quran` string is a **contiguous substring** of its referenced ayah (or
  ayah range) after a documented normalisation (collapse whitespace; strip ayah-end/pause marks
  `۝ ۖ ۗ ۚ ۛ ۙ ۘ` and tatweel). Letters, harakat, maddah and small Uthmani signs are compared exactly.
- **Rationale**: examples are snippets, not whole ayat; exact compare on letters/harakat is what
  matters; pause marks vary between sources and do not change the madd.
- **Alternatives**: bundle the Quran in the app (~1.3 MB) — wasted bytes offline; Quran.com API —
  network at build, versioning risk; fuzzy match — would hide real errors.
- **Licence**: Tanzil text is used verbatim with attribution «نص القرآن من مشروع تنزيل (tanzil.net)»
  on the About page and in README.

## R4. Assigning surah:ayah to ~150 prototype examples fast
- **Decision**: `locate-ayah.ts` normalises each example and searches all 6,236 ayat; exactly one hit
  → writes the ref and sets `verified:true`; zero or many hits → `verified:false` with candidates
  listed in `CONTENT_NOTES.md` for the founder.
- **Rationale**: the one-week deadline rules out manual lookup; the script is deterministic and its
  output is reviewable.
- **Risk**: prototype strings typed by an AI may differ from Tanzil orthography (e.g. `ءَامَنُوا` vs
  `ءَامَنُواْ`, `بِمَآ` vs `بِمَا`). If the unique-hit rate is low, a second pass with a looser key
  (letters only) **suggests** the ref and the exact Tanzil substring; the corrected text replaces the
  prototype text and the item is marked verified only after the founder confirms in `CONTENT_NOTES.md`.
  Until then those items are hidden (FR-005).

## R5. Display text vs Quran text in examples
- **Decision**: an Example has `quran` (pure Mushaf substring, verified) and optional `label` (display
  wrapper such as «اللام في «الٓمٓ»» or «(وقفًا)») plus `note`. Generators show `label ?? quran`;
  verification reads only `quran`.
- **Rationale**: many prototype examples mix commentary with Quran text; separating them makes
  verification possible without losing the teaching wording.

## R6. Ambiguity rule
- **Decision**: each Example lists **all** concept ids it contains (`tags`). For «صنّف» and «صح ولا
  غلط», an example is eligible for concept X only if none of its other tags are among that item's
  options. The unit test asserts: for every generated item across 500 seeded sessions, the correct
  answer is the only option present in `tags`.
- **Rationale**: matches PROMPT §5.3 («ءامنوا وعملوا» has بدل + تمكين).

## R7. Spot («لوّن الحكم») word indexing
- **Decision**: words = ayah text split on single spaces, dropping standalone `۝` tokens (same as the
  prototype). Stored `answer` = 0-based indexes. Test re-splits and asserts each indexed word contains
  the target concept per a per-item `expectWords` list copied from the note.
- **Rationale**: the prototype once had an off-by-one; the test pins it.

## R8. PWA / offline
- **Decision**: `vite-plugin-pwa`, `registerType: 'autoUpdate'`, `generateSW` precaching all built
  assets incl. fonts and `book/*.jpg` (~3.7 MB). A small «تحديث جاهز» toast is not needed with
  autoUpdate.
- **Rationale**: whole app ≈ 5 MB; well within GitHub Pages and phone cache limits.

## R9. Fonts
- **Decision**: `@fontsource/cairo` weights 400/600/800 arabic+latin subsets; `@fontsource/scheherazade-new`
  400/700 arabic subset; `font-display: swap`.
- **Rationale**: offline, no Google requests (privacy).

## R10. Book page images
- **Decision**: copy `reference/img/*.jpg` into `public/book/` at build via a tiny Vite plugin;
  re-encode to WebP (quality 80) in the copy step if `sharp` is available, else ship JPG.
  `VITE_INCLUDE_BOOK_PAGES` defaults **true** (Sheikh approved).

## R11. Export / import code
- **Decision**: `TUHFA1.` + base64url(JSON progress) + `.` + 4-char checksum (FNV-1a). Invalid prefix /
  checksum / schema → error, no change.
- **Alternatives**: compressed (CompressionStream) — not on all iOS versions; QR — v1.1.

## R12. Streak date
- **Decision**: local calendar date `YYYY-MM-DD` via `toLocaleDateString('en-CA')` (prototype method).

## R13. Mascot «نقطة»
- **Decision**: one inline SVG ink-dot with 4 poses (idle, stretch-2/4/6, happy bounce, thinking);
  CSS transforms only; static pose under reduced motion. Designed in the `tuhfa-brand` pass.

## R14. CI / deploy
- **Decision**: `.github/workflows/deploy.yml`: `npm ci` → lint → typecheck → `test:unit` → `validate`
  → `build` → Playwright (chromium only) against `vite preview` → `upload-pages-artifact` →
  `deploy-pages`. PRs run everything except deploy.

## R15. Sheikh's course order for placeholders
- **Decision**: provisional order from PDF numbering until confirmed: مقدمات (00–02) → النون الساكنة
  والتنوين (03–05) → الغنة (05) → الميم الساكنة (06) → اللامات (07) → المدود (08–09) → remaining
  Tuhfa chapters (المثلان والمتقاربان والمتجانسان، أقسام المد، أحكام المد، اللازم) folded into Madd
  where the book does. Order lives only in `course.ts` → reorder = data change.
- **Open**: founder to confirm.
