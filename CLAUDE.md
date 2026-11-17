# Tuhfa (تحفة) — working agreement for AI agents

Free, static, offline PWA that teaches Tajweed (Hafs) Duolingo-style from Sheikh Jaber's course on
متن تحفة الأطفال. Arabic (Egyptian) · RTL · phone-first · no backend · no hearts.

## Read first
1. `tuhfa-status` skill (position + NEXT ACTION) — or run `tuhfa-resume`.
2. `.specify/memory/constitution.md` — 7 principles; violations block merge.
3. `specs/001-madd-v1/` — spec, plan, tasks. `discovery/DISCOVERY.md` = founder decisions (wins over `PROMPT.md`).
4. UI / copy / colour / Arabic wording → `ag-ui-standard`, then `tuhfa-brand`.

## Hard rules
- **Never write Tajweed rules, definitions or Quran text from memory.** Rules come from the Sheikh's
  book/lessons; Quran text only from `data/quran-uthmani.txt` (Tanzil). Unverified → hidden.
- Engine code (`src/engine/**`) never imports module content. New chapter = data only.
- Green/red only for answer feedback. Raw colours only in `src/ui/theme.css`.
- No server, no accounts, no Telegram bot tokens or direct file URLs; full recordings never re-hosted.
- One task = one branch = one worktree under `D:\Company\80-Worktrees\Tuhfa-*`. Never commit on `main`.
  Push every feature branch. Merging to `main` = public deploy → founder OK first.

## Gates (before "done")
```bash
npm run lint && npm run format:check && npm run typecheck && npm run test:unit && npm run validate && npm run build && npm run test:e2e
```
Then look at the touched screens at 390×844 (and 360 for overflow).

## Session hand-off (always)
Update `tuhfa-status`, overwrite `docs/NEXT_GOAL.md` with the `/goal` pointer block, give a
**How to test** block, commit + push.
