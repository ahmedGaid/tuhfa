/goal Tuhfa — M2 content done on feat/m2-content (pushed, not merged; main @ 2122034 is live at https://ahmedgaid.github.io/tuhfa/). Gates local: lint · format · typecheck · unit 33 · validate 0/0 · build (JS 10 KB gz) · e2e 4/4
NEXT: founder reviews CONTENT_NOTES.md (tick lines, or the one "apply all of section A" line) → `npm run content:apply` → `npm run validate`; founder OK → merge M2 to main. Then M3 = Phase 3 (generators, session, lesson UI) on feat/m3-lesson, worktree D:\Company\80-Worktrees\Tuhfa-M3
READ FIRST: tuhfa-status top entry · CONTENT_NOTES.md (sections A–G; G1 = 4 book-vs-prototype decisions) · specs/001-madd-v1/tasks.md Phase 3 · contracts/content-module.md · src/content/schema.ts
OWNERSHIP: check `git worktree list` (expect main + Tuhfa-M2 until M2 merges)
SCOPE: M3 writes engine + UI. Engine never imports module content (lint rule). Exercises use only `verified:true` examples — today most Madd concepts have 0 verified examples, so generators must skip a type cleanly when its pool is empty. Already in src/engine: rng.ts (mulberry32 + shuffle), ambiguity.ts (eligibleExamples), spot.ts (spotWords) — reuse, don't redo
FIT: Opus. EST: 4–6 h (M3 is the biggest milestone; split at the T032/T033 boundary if needed)
ALSO OPEN: CONTENT_NOTES review (blocks a full M3 play-through) · G1 decisions (badal amount, Shatibiyya ٤ vs ٤/٥, «ءامنوا وعملوا» tags, ءآلآن تسهيل note) · Telegram JSON export (v1.1) · Sheikh's chapter order · tuhfa-brand word list · remote branches feat/m1-scaffold, fix/m1-format deletable
BLOCKED, don't re-ask: nothing
