---
description: "Task list for Tuhfa v1 — Madd module"
---

# Tasks: Tuhfa v1 — Madd module, playable end to end

**Input**: `specs/001-madd-v1/` (plan, spec, research, data-model, contracts, quickstart)
**Tests**: required by the constitution (Principle VI) — unit + validate + e2e.
**Milestones**: M1–M6 from plan.md. One branch + worktree per milestone
(`feat/m1-scaffold` → `D:\Company\80-Worktrees\Tuhfa-M1`, etc.).

## Format: `[ID] [P?] [Story] Description`
[P] = parallel-safe (different files, no unmet dependency). Story tags map to spec.md user stories.

---

## Phase 1: Setup — M1 (day 1) 🎯 empty app live

- [x] T001 Create GitHub repo `ahmedGaid/tuhfa` (public), push `main`, enable Pages → "GitHub Actions"
- [x] T002 Scaffold Vite + Preact + TS strict at repo root: `package.json`, `vite.config.ts` (`base` from `VITE_BASE`, default `/tuhfa/`), `tsconfig.json`, `index.html` (`lang="ar" dir="rtl"`)
- [x] T003 [P] ESLint (flat config, `no-restricted-imports` engine→content/modules) + Prettier + `.editorconfig` + `.gitattributes` (LF)
- [x] T004 [P] Vitest config (`vitest.config.ts`, jsdom) + one smoke test in `tests/unit/smoke.test.ts`
- [x] T005 [P] Playwright config (`playwright.config.ts`, 390×844 + 360×740, webServer = `vite preview`) + `tests/e2e/smoke.spec.ts`
- [x] T006 [P] Fonts: `@fontsource/cairo` (400/600/800) + `@fontsource/scheherazade-new` (400/700) imported in `src/ui/fonts.ts`
- [x] T007 Theme tokens in `src/ui/theme.css`: neutral ink/greys, light+dark via `prefers-color-scheme` + `[data-theme]`, `--ok`/`--bad` feedback only, Madd category vars, tactile button styles, focus ring, reduced-motion block (values from `tuhfa-brand` skill)
- [x] T008 Hash router `src/ui/router.ts` + app shell `src/main.tsx` + bottom tab bar (المسار · راجع · المكتبة · حسابي) with placeholder screens
- [x] T009 `.github/workflows/deploy.yml`: ci job (lint, typecheck, unit, build, e2e) on PR+push; deploy job on `main` (upload-pages-artifact + deploy-pages)
- [x] T010 Verify live URL loads at 390×844, no overflow at 360; screenshot to `docs/screens/m1.png`

**Checkpoint M1**: `ahmedgaid.github.io/tuhfa` shows the RTL shell with 4 tabs; CI green.

---

## Phase 2: Foundational content — M2 (day 1–2) ⚠️ blocks every story

- [x] T011 `src/content/schema.ts`: zod schemas + types for Course, ModuleRef, Module, Category, Concept, Example, Unit, LessonSpec, Lesson, Question, SpotItem, TreeNode, Extras (data-model.md)
- [x] T012 `src/content/course.ts`: module registry in provisional Sheikh order (research R15); Madd `ready`, all others `soon` with title + icon only
- [x] T013 Download Tanzil Uthmani text to `data/quran-uthmani.txt` + `data/TANZIL-LICENSE.md` (attribution)
- [x] T014 `scripts/extract-prototype.ts`: evaluate prototype arrays (L, C, U, D, SP, M, R, T, PG, RANK) in a sandbox and emit `src/content/modules/madd/*.ts` verbatim (split Example into `quran`/`label`/`note`; R5)
- [x] T015 Run extraction; hand-fix only what the script cannot split; commit generated Madd data
- [x] T016 `scripts/locate-ayah.ts` (R4): assign refs + `verified` for unique hits; write candidates for the rest
- [x] T017 [P] `scripts/verify-quran.ts` (R3) + `tests/unit/verify-quran.test.ts` (normaliser cases)
- [x] T018 [P] `tests/unit/ambiguity.test.ts` (R6) — 500 seeded sessions, correct answer only option in tags
- [x] T019 [P] `tests/unit/spot-indexes.test.ts` (R7) — every SpotItem answer matches `expectWords`
- [x] T020 `scripts/content-notes.ts` → `CONTENT_NOTES.md`: unverified examples with candidates, prototype↔book disagreements, thin concepts
- [x] T021 Read book pages `reference/img/*` + `reference/source/part1.pdf`/`part2.pdf` against extracted Madd data; log every disagreement in `CONTENT_NOTES.md` (book wins)
- [x] T022 `scripts/validate.ts` + `npm run validate` (schema → verify → ambiguity → spot → colour ΔE); add to CI
- [x] T023 [P] `tests/unit/content-counts.test.ts`: 21 lessons, 17 concepts, 57 questions, 10 spot, tree root, ruler, turuq present (SC-003)
- [x] T024 [P] `src/content/modules/_template/` with commented sample data that passes validate

**Checkpoint M2**: `npm run validate` green; `CONTENT_NOTES.md` ready for founder review.

---

## Phase 3: US1 + US2 — play a lesson with all exercise types — M3 (day 2–4) 🎯 MVP

### Tests first
- [x] T025 [P] [US2] `tests/unit/generators.test.ts`: each of 10 generators builds valid items for Madd and `_template`, never uses `verified:false`, grade is pure
- [x] T026 [P] [US1] `tests/unit/session.test.ts`: teach card first for new concept, size 10–15, wrong items re-queued ≤2 times, map ≤1 per lesson
- [x] T027 [P] [US1] `tests/unit/scoring.test.ts`: XP (+10/+20/+10 perfect), combo at 3, stars thresholds 90/70

### Engine
- [x] T028 [P] [US2] `src/engine/rng.ts` (seeded) + `src/engine/types.ts` (Item, Grade, Generator)
- [x] T029 [P] [US2] Generators `classify.ts`, `amount.ts`, `ruling.ts`, `truefalse.ts` in `src/engine/generators/`
- [x] T030 [P] [US2] Generators `complete.ts`, `match.ts`, `order.ts` in `src/engine/generators/`
- [x] T031 [P] [US2] Generators `spot.ts`, `map.ts` (4 levels), `bank.ts` in `src/engine/generators/`
- [x] T032 [US1] `src/engine/session.ts` (queue builder + re-queue) and `src/engine/scoring.ts`

### UI
- [x] T033 [P] [US1] Components: `Button`, `Sheet`, `ProgressBar`, `QuranText`, `Badge`, `Mascot` (نقطة, 4 poses) in `src/ui/components/` — the first five in `ui.tsx`
- [x] T034 [US1] `TeachCard` + `FeedbackSheet` (aria-live, example always shown) in `src/ui/components/`
- [x] T035 [P] [US2] Exercise views `src/ui/exercises/{Classify,Amount,Ruling,TrueFalse,Complete}.tsx` — built as one `Choice.tsx` (classify · amount · ruling · fill · question) + `TrueFalse.tsx`
- [x] T036 [P] [US2] Exercise views `src/ui/exercises/{Match,Order,Spot,Map,Bank}.tsx` (all keyboard-playable) — Map = `MapFill.tsx`, Bank = `Choice.tsx`
- [x] T037 [US1] `src/ui/screens/Lesson.tsx` (top progress, exit confirm, combo badge) + `Complete.tsx` (stars, XP, accuracy, نقطة, warm message)
- [x] T038 [US1] `tests/e2e/lesson.spec.ts`: play Madd lesson 1 end to end at 390×844, keyboard-only pass for one exercise of each type

**Checkpoint M3**: any Madd lesson reachable via `#/lesson/madd/<id>` plays to completion.

---

## Phase 4: US3 — path, progress, habit — M4 (day 4–5)

- [x] T039 [P] [US3] `tests/unit/streak.test.ts` + `tests/unit/storage.test.ts` (migrate, corrupt, memory fallback)
- [x] T040 [US3] `src/state/storage.ts`, `progress.ts`, `streak.ts`, `settings.ts` (signals; contract progress-storage.md)
- [x] T041 [US3] `src/ui/screens/Path.tsx`: module bands (category colour), winding nodes, checkpoint chests, «قريبًا» modules non-blocking, pulse current (reduced-motion off)
- [x] T042 [US3] Unlock rules in `src/state/progress.ts` (in-module order; ready modules open; teacher mode)
- [x] T043 [P] [US3] Header: streak flame + daily-goal `Ring` component
- [x] T044 [P] [US3] `src/audio/sfx.ts` (WebAudio right/wrong/complete) + confetti (reduced-motion off)
- [x] T045 [US3] `src/ui/screens/Settings.tsx` (goal 20/50/100, sound, teacher mode, theme) + `Welcome.tsx` (نقطة + Sheikh credit, once)
- [x] T046 [US3] Wire lesson completion → progress (stars max, XP by day, streak, SRS update, mistakes)
- [x] T047 [US3] `tests/e2e/path.spec.ts`: complete 2 lessons, reload, stars + unlock persisted; fake clock streak = 2

**Checkpoint M4**: whole Madd module playable from the path with persistent progress.

---

## Phase 5: US4 + US5 + US6 — review, library, data — M5 (day 5–6)

### US4 Review
- [x] T048 [P] [US4] `tests/unit/srs.test.ts` (box moves, intervals 1/2/4/7/14, due selection)
- [x] T049 [US4] `src/engine/srs.ts` + review session builder (mistakes / due concepts)
- [x] T050 [US4] `src/ui/screens/Review.tsx` («راجع غلطاتي», «تمرين اليوم», empty state)

### US5 Library
- [x] T051 [P] [US5] Book images: Vite copy step `reference/img` → `public/book/` (WebP if possible), `VITE_INCLUDE_BOOK_PAGES` default true
- [x] T052 [P] [US5] `TreeView` (zoom buttons, horizontal scroll inside container) + `Lightbox` (pinch/zoom, Esc, focus trap)
- [x] T053 [US5] `src/ui/screens/Library.tsx` (module groups, lesson list) + `LibraryLesson.tsx` (sanitised html, family colour, page button)
- [x] T054 [P] [US5] Generic `Ruler` + `TuruqTable` components (ش filled badge, ط outlined badge)
- [x] T055 [US5] «انضم للقناة» button (invite link from `course.ts` config, opens externally)

### US6 Data & About
- [x] T056 [P] [US6] `tests/unit/exportCode.test.ts` (round-trip, bad prefix/checksum/schema → no change)
- [x] T057 [US6] `src/state/exportCode.ts` + `src/ui/screens/Profile.tsx` (XP, streak, export, import with confirm)
- [x] T058 [P] [US6] `src/ui/screens/About.tsx`: Sheikh credit (exact text FR-019), Tanzil attribution, version

**Checkpoint M5**: US4–US6 acceptance scenarios pass manually per quickstart.md.

---

## Phase 6: US6 offline + US7 + polish — M6 (day 6–7) 🚀 launch

- [x] T059 [US6] `vite-plugin-pwa` (autoUpdate, precache incl. fonts + book), manifest (Arabic name «تحفة», RTL, icons from نقطة), `tests/e2e/offline.spec.ts`
- [x] T060 [P] [US7] `CONTENT_GUIDE.md` (Arabic + English) walking through `_template` → register → validate
- [x] T061 [P] [US7] `tests/unit/template-module.test.ts`: `_template` registered in a test course plays a generated session with no engine change
- [x] T062 [P] `tests/e2e/overflow-360.spec.ts`: every screen, `scrollWidth <= clientWidth`
- [x] T063 [P] CI grep gate: `--ok`/`--bad` tokens used only in feedback/answer-state files (Principle III)
- [x] T064 `tests/e2e/full-madd.spec.ts`: teacher mode, play every lesson + checkpoint with scripted correct answers (SC-002)
- [x] T065 A11y pass (axe in Playwright on each screen) + fix findings
- [~] T066 Bundle size check (`size-limit` or build report ≤150 KB gz) + Lighthouse mobile run; record scores in `docs/lighthouse-v1.md` — size gate done (90 KB gz); Lighthouse run pending (founder, see docs/lighthouse-v1.md)
- [ ] T067 README.md (Arabic + English): what, run locally, deploy your own copy (enable Pages → GitHub Actions), edit content, credits
- [ ] T068 Founder review round on `CONTENT_NOTES.md`; flip approved examples to `verified:true`; re-run validate
- [ ] T069 Merge to `main`, confirm live, screenshots 390×844 of every screen in `docs/screens/`

**Checkpoint v1**: live, offline, full Madd play-through green, SC-001…SC-007 met.

---

## Dependencies & order

- M1 → M2 → (M3 ∥ library parts of M5: T051–T055) → M4 → rest of M5 → M6.
- Within phases, [P] tasks touch different files and can run together.
- T021 and T068 need founder/human judgement; everything else is agent-executable.

## v1.1 backlog (not in this tasks list)
Intro module (in order) · اكتشف الغلطة · الطريق · اسمع وحدّد (clips) · Telegram member links (after
JSON export) · certificate · transcripts pipeline.
