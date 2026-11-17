# Tuhfa (تحفة) Constitution

## Core Principles

### I. Content Integrity (NON-NEGOTIABLE)
A wrong Tajweed rule taught to a student is worse than a missing one.
- Rules, definitions and examples MUST come only from the Sheikh's book chapters (`reference/source/`)
  or his recorded lessons. Nothing is written from model memory. Where the prototype and the book
  disagree, the book wins and the disagreement is logged in `CONTENT_NOTES.md`.
- A topic with no source chapter MUST appear only as a «قريبًا» placeholder (title + icon).
- Every Quranic string MUST carry a `surah:ayah` reference and a `verified` flag. Quranic text is
  never taken from a transcript. `scripts/verify-quran.ts` compares every `verified: true` string
  to the bundled Tanzil Uthmani text and fails CI on any mismatch.
- Examples marked `verified: false` MUST NOT be shown to students in exercises; they are listed in
  `CONTENT_NOTES.md` for the founder (content reviewer).
- Exercise ambiguity (one word tagged with two candidate rules) and spot-the-rule word indexes are
  enforced by automated tests.

### II. Content, Not Code
The engine knows no Tajweed topic. Adding or fixing a module is a data-only change:
- Every module lives in `src/content/modules/<id>/`, conforms to one shared zod schema, and is
  registered in `course.ts`. A `_template` module and `CONTENT_GUIDE.md` (Arabic + English) exist.
- Every exercise generator MUST work for any module's data; module-specific branches in engine code
  are a constitution violation.
- `npm run validate` (schema + ambiguity + Quran verification + spot indexes) MUST pass before merge.

### III. Semantic Color and Respectful Joy
- Each rule category has exactly one color and one icon, applied everywhere it appears. Green and
  red are reserved for answer feedback only; primary buttons are neutral ink.
- The tone is warm, spiritual and encouraging (Egyptian Arabic; Tajweed terms in Fusha). There is no
  punishment mechanic: no hearts, no lives, nothing sold, nothing gated.
- The mascot «نقطة» is an ink dot, never a living creature.

### IV. Phone-First, Arabic-First, Offline-Always
- `<html lang="ar" dir="rtl">`; designed at 360–430 px first; no horizontal page overflow at 360 px.
- Arabic numerals in learner-facing text. Cairo for UI, Scheherazade New for Quran, both self-hosted.
- The app installs as a PWA and works fully offline after the first visit.
- Accessibility: semantic buttons, keyboard-playable lessons, `aria-live` feedback, 44 px targets,
  visible focus; `prefers-reduced-motion` disables pulses, shakes and confetti.

### V. Free and Static
- Static files only, deployed to GitHub Pages by GitHub Actions. No server, no accounts, no paid
  services, no analytics that send personal data.
- All progress lives in `localStorage` behind a versioned storage module with migrations; progress
  can be exported/imported as a code.
- No Telegram bot tokens or direct Telegram file URLs. Full lesson recordings are never re-hosted;
  only founder-approved short clips may ship.

### VI. Verified Delivery
- Unit tests (Vitest) cover generators, scoring, SRS, streak, storage migrations, ambiguity and
  spot indexes. E2E (Playwright, 390×844) plays every Madd unit.
- A change is "done" only when lint, typecheck, tests and build are green AND it has been seen
  working in the browser at 390×844.
- JS bundle stays ≤150 KB gzipped excluding fonts. Lighthouse mobile targets: Performance ≥90,
  Accessibility ≥95, Best Practices ≥95, PWA installable.

### VII. Smallest Shippable Slice
- Ship the thinnest end-to-end slice first (an empty app live on Pages), then widen.
- v1 scope is the Madd module; later chapters arrive as content. Future features (leaderboard,
  reminders, Play Store) never slide into a release silently.

## Technology Constraints

Vite + TypeScript (strict) + Preact; zod for content schemas; hash routing (`#/…`);
vite-plugin-pwa; `@fontsource/cairo` + `@fontsource/scheherazade-new`; ESLint + Prettier;
Vitest + Playwright. `base` read from an env var so forks deploy to their own `/<repo>/`.
WebAudio for sound effects (no audio files for SFX). New runtime dependencies need a one-line
justification in the plan.

## Development Workflow

- One task = one branch = one worktree (`D:\Company\80-Worktrees\Tuhfa-*`). Never develop on `main`.
- Conventional commits; explicit `git add <paths>`; push the branch at the end of every task.
- Founder decisions live in `discovery/DISCOVERY.md` and override `PROMPT.md` where they differ.
- Content added from a new lesson is reviewed by the founder via `CONTENT_NOTES.md` before it is
  marked `verified: true`.
- Every close-out gives a copy-pasteable "How to test" block and updates the `tuhfa-status` skill.

## Governance

This constitution supersedes `PROMPT.md` and all other practice docs where they conflict, except
explicit founder decisions recorded in `discovery/DISCOVERY.md`, which are folded in here by
amendment. Amendments: edit this file, bump the version (MAJOR = principle removed/redefined,
MINOR = principle/section added, PATCH = wording), record the date, and note it in the commit.
Every plan's "Constitution Check" gate MUST list each principle and how the plan complies; any
deviation needs a written justification in the plan's Complexity Tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-11-17 | **Last Amended**: 2026-11-17
