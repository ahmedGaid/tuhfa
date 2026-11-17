# Decisions — Tuhfa

Newest first. Founder product decisions live in `discovery/DISCOVERY.md`; this file records
technical decisions and overrides of the shared house standard (`ag-ui-standard`).

| #    | Date       | Decision                                                                                                                            | Why                                                                      |
| ---- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| D-05 | 2026-11-17 | Stack versions at M1: Vite 8, Preact 11, zod 4, TypeScript 5.9 (not 7: typescript-eslint supports < 6.1), Vitest 5, Playwright 1.65 | Current majors; research.md named older majors before install            |
| D-04 | 2026-11-17 | Override ag-ui-standard rule 10: confetti + «نقطة» bounce allowed on lesson / checkpoint complete only                              | Duolingo model chosen by founder; finishing a lesson is not routine work |
| D-03 | 2026-11-17 | Override ag-ui-standard rule 6: Arabic-only UI; strings still in one catalog `src/ui/strings.ar.ts`                                 | Audience is Arabic-speaking (PROMPT §1)                                  |
| D-02 | 2026-11-17 | Neutrals + Madd category colours taken verbatim from the student-tested prototype                                                   | PROMPT §4: "already tested with students' feedback; keep them"           |
| D-01 | 2026-11-17 | Hash routing, no router library                                                                                                     | GitHub Pages has no rewrites; ~40 lines                                  |
