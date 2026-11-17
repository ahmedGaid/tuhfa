# Implementation Plan: Tuhfa v1 — Madd module, playable end to end

**Branch**: `001-madd-v1` (docs on `docs/discovery`; code on one branch per milestone) | **Date**: 2026-11-17 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-madd-v1/spec.md`

## Summary

Rebuild the single-file Madd prototype (`reference/prototype.html`) as a structured, static,
offline PWA: a generic content schema + engine that knows no Tajweed topic, the Madd module extracted
into typed data, ten data-driven exercise generators, a Duolingo-style path with XP/streak/stars (no
hearts), review (mistakes + Leitner), a library, and progress export/import — deployed to GitHub Pages
at `ahmedgaid.github.io/tuhfa` within ~7 days. Content integrity is enforced by build-time scripts
(Quran text verified against Tanzil Uthmani; ambiguity and spot-index tests).

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node 24 for tooling

**Primary Dependencies**: Preact 10 + `@preact/signals` (state), Vite 6, zod 3 (content schema),
`vite-plugin-pwa` (Workbox generateSW), `@fontsource/cairo` + `@fontsource/scheherazade-new`
(arabic subsets only). No router library (≈40-line hash router). No UI kit.

**Storage**: `localStorage` key `tuhfa:v1`, behind `src/state/storage.ts` (versioned, migrations,
in-memory fallback when storage throws)

**Testing**: Vitest (unit, jsdom) · Playwright (e2e, Chromium, 390×844 + 360×740) ·
`tsx` scripts for content validation

**Target Platform**: Mobile browsers (Chrome Android, Safari iOS 16+), desktop secondary; GitHub Pages

**Project Type**: Static single-page web app (PWA)

**Performance Goals**: first exercise reachable < 30 s on first visit (SC-001); JS ≤ 150 KB gz
excluding fonts; Lighthouse mobile Perf ≥ 90, A11y ≥ 95, BP ≥ 95

**Constraints**: offline after first visit; no server; no secrets; RTL Arabic; 360 px min width;
`base` from `VITE_BASE` (default `/tuhfa/`)

**Scale/Scope**: 1 playable module (21 lessons → ~24 playable nodes incl. checkpoints), 12
placeholder modules, ~8 screens, 10 exercise types, ~150 Quran example strings, 26 book page images

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How this plan complies | Status |
|---|---|---|
| I. Content Integrity | `scripts/extract-prototype.ts` copies data verbatim (no retyping); `scripts/verify-quran.ts` + `scripts/locate-ayah.ts` against committed Tanzil Uthmani; generators filter `verified:false`; `CONTENT_NOTES.md` generated; ambiguity + spot tests in `npm run validate` | ✅ |
| II. Content, Not Code | One zod `ModuleSchema`; `src/engine/**` imports only types; lint rule (`no-restricted-imports`) bans `src/content/modules/*` imports from `src/engine/**`; `_template` module + `CONTENT_GUIDE.md` | ✅ |
| III. Semantic Color & Respectful Joy | Category colours come from content → CSS custom props `--cat`; feedback tokens `--ok/--bad` used only in `Feedback`/answer states (grep gate in CI); no hearts in data model; «نقطة» SVG mascot | ✅ |
| IV. Phone/Arabic/Offline | `dir="rtl"`, 360 px e2e overflow check, fonts self-hosted, Workbox precache, reduced-motion CSS + JS guard, `aria-live` feedback | ✅ |
| V. Free & Static | GitHub Pages via Actions; localStorage only; Telegram = invite link only; no clips in v1 | ✅ |
| VI. Verified Delivery | CI: lint · typecheck · unit · validate · build · e2e; size-limit check; Lighthouse run in M7 | ✅ |
| VII. Smallest Slice | M1 ships an empty live app; milestones each end deployable | ✅ |

Post-design re-check (after data-model + contracts): ✅ no violations; Complexity Tracking empty.

## Milestones (7-day schedule)

Each milestone = one branch + worktree (`D:\Company\80-Worktrees\Tuhfa-M<n>`), merged to `main`
when green; every merge auto-deploys.

| # | Day | Scope | Done when |
|---|---|---|---|
| M1 | 1 | Scaffold, theme tokens, fonts, RTL shell, hash router, tab bar, CI + Pages deploy | Empty app live at `ahmedgaid.github.io/tuhfa`, CI green |
| M2 | 1–2 | Content schema, Madd extraction, Tanzil text, verify/locate/ambiguity/spot scripts, `CONTENT_NOTES.md`, `_template`, `npm run validate` | 21/17/57/10/tree/ruler/table present; validate green |
| M3 | 2–4 | Engine: session builder, 10 generators, scoring, re-queue; Lesson screen, teach card, feedback sheet, completion screen | Any Madd lesson playable end to end |
| M4 | 4–5 | Path screen, unlock rules, stars, XP/combo, streak, daily goal, settings (goal/sound/teacher/theme), SFX, confetti, «نقطة» | Whole module playable from the path; streak works |
| M5 | 5–6 | Library (lessons, ruler, turuq table, tree, page lightbox, «انضم للقناة»), Review (mistakes + Leitner), export/import, About | US4–US6 acceptance pass |
| M6 | 6–7 | PWA offline, a11y pass, Lighthouse, e2e full play-through, README (ar/en), `CONTENT_GUIDE.md`, launch | All SC met except SC-008 |

**Parallelism**: after M2 merges, M3 (engine + lesson) and M5-library (read-only screens) touch
disjoint folders and may run as two sessions; M4 depends on M3's result types.

**Cut order if late** (never cut verification): certificate (already v1.1) → Leitner polish → احفظ
الخريطة level 4 → tree zoom → confetti.

## Project Structure

### Documentation (this feature)

```text
specs/001-madd-v1/
├── plan.md              # this file
├── research.md          # Phase 0 decisions
├── data-model.md        # entities, fields, validation, state transitions
├── quickstart.md        # run + validate guide
├── contracts/
│   ├── content-module.md   # the content contract every module folder must satisfy
│   ├── exercise-generator.md
│   └── progress-storage.md # storage + export code format
└── tasks.md             # /speckit-tasks output
```

### Source Code (repository root)

```text
src/
  content/
    schema.ts              # zod schemas + inferred types (the contract)
    course.ts              # module order, status, registry
    modules/
      _template/           # copy-me module with sample data + comments
      madd/                # categories, concepts, lessons, units, questions, spot, tree, ruler, turuq, pages, rank
  engine/
    session.ts             # builds a lesson queue from a LessonSpec + module data
    generators/            # one file per exercise type, all implement Generator<T>
    grade.ts               # answer checking per type
    scoring.ts             # XP, combo, stars
    srs.ts                 # Leitner boxes
    rng.ts                 # seeded RNG (tests reproducible)
  state/
    storage.ts             # versioned localStorage + migrations + memory fallback
    progress.ts            # signals: lessons, xp, mistakes, srs
    streak.ts              # streak + daily goal (local date)
    settings.ts
    exportCode.ts
  ui/
    theme.css              # tokens (light/dark), category vars, feedback vars
    components/            # Button, Sheet, ProgressBar, QuranText, Badge, Mascot (نقطة), Ring, Lightbox, TreeView
    exercises/             # one view per exercise type
    screens/               # Welcome, Path, Lesson, Complete, Review, Library, LibraryLesson, Profile, Settings, About
    router.ts
  audio/sfx.ts             # WebAudio tones
  main.tsx
public/
  icons/ , book/ (a-*.jpg, b-*.jpg — copied from reference/img at build)
scripts/
  extract-prototype.ts     # one-shot: prototype arrays → src/content/modules/madd/*.ts
  locate-ayah.ts           # suggests surah:ayah for each example
  verify-quran.ts          # fails on any verified:true mismatch
  content-notes.ts         # regenerates CONTENT_NOTES.md
  validate.ts              # schema + ambiguity + spot + verify (npm run validate)
data/
  quran-uthmani.txt        # Tanzil Uthmani (build-time only, never shipped)
tests/
  unit/                    # generators, grade, scoring, srs, streak, storage, exportCode, ambiguity, spot
  e2e/                     # smoke, play-unit-*.spec.ts, offline, overflow-360
.github/workflows/deploy.yml
```

**Structure Decision**: single static web project; content/engine/state/ui separation enforces
Principle II.

## Complexity Tracking

No violations.
