/goal Tuhfa — M6 launch polish (T059–T067) done on feat/m6-launch (pushed, PR #7 open, NO auto-merge; main = M5, live at https://ahmedgaid.github.io/tuhfa/). Gates local: lint (+ green/red gate) · format · typecheck · unit 112 · validate 0/0 · build · size 90 KB gz of 150 · e2e 63 passed
NEXT: founder-side launch steps, then T069. (1) T068 CONTENT_NOTES review → `npm run content:apply` → validate (2) Lighthouse mobile → scores into docs/lighthouse-v1.md (3) founder OK → merge PR #7 = public launch → confirm live, offline install on a real phone, delete Tuhfa-M6 worktree + feat/m6-launch (pre-approved, D-09)
READ FIRST: tuhfa-status top entry · specs/001-madd-v1/tasks.md Phase 6 · CONTENT_NOTES.md · docs/DECISIONS.md (D-06..D-10)
OWNERSHIP: check `git worktree list` (Tuhfa-M6 = this milestone)
SCOPE: content:apply only flips founder-ticked examples; never type Quran text. If CI on PR #7 fails, fix on feat/m6-launch
FIT: Sonnet (content:apply + merge) · Opus if review surfaces book-vs-data disagreements. EST: 1–2 h after founder review
ALSO OPEN: tuhfa-brand word list (incl. «وضع المدرّس», «هدفك اليومي», «اختبار الباب») unconfirmed · «نقطة» drawing still the placeholder · repo has no LICENSE (founder choice) · Telegram JSON export (v1.1) · Sheikh's chapter order (intro module only) · v1.1 backlog in tasks.md
BLOCKED, don't re-ask: T068 needs the founder's CONTENT_NOTES ticks; merge needs the founder's OK
