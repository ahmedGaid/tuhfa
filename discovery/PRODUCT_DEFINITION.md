# Tuhfa (تحفة) — Product Definition

Status: **DRAFT — awaiting founder approval.** After approval this feeds Spec Kit
(constitution → specify → clarify → plan → tasks).
Inputs: `PROMPT.md` (full original spec) + `discovery/DISCOVERY.md` (founder decisions, which win over PROMPT).

## 1. Vision
A free, Duolingo-style web app that lets Sheikh Jaber's students master the Tajweed rules of
**متن تحفة الأطفال** (Hafs ʿan ʿĀṣim) by playing short lessons — learning a rule, practising it on
real Quranic words, and keeping it through review — without a teacher in the room.

## 2. Principles
1. **A wrong rule is worse than a missing one.** Content comes only from the Sheikh's book and lessons. No invented rules. Unverified Quran text never reaches a student.
2. **Respectful joy.** Warm, spiritual encouragement («ما شاء الله عليك!»), no punishment (no hearts), no childish noise.
3. **Colour = meaning.** Each rule family has one colour + icon everywhere. Green/red only for right/wrong.
4. **Phone first, offline always.** 360 px, RTL, installs as an app, works with no network after first visit.
5. **Content, not code.** A new chapter is a data folder, never engine code.
6. **Free forever.** Static site on GitHub Pages; no server, no accounts, no ads, nothing sold.

## 3. Persona (launch)
**طالب الدورة** — young adult/adult man or woman in Egypt, attends the Sheikh's Tuhfa course,
listens to recordings on Telegram, studies on the phone in spare minutes. Already studied the earlier
chapters in class; now on Madd. Needs: drill what was just taught, see the rule in the Mushaf, revise before the next class.
Later: anyone online learning Tajweed.

## 4. Core journeys
1. **First open** → short welcome (what Tuhfa is, credit to the Sheikh) → course path with Madd open → tap the first Madd lesson.
2. **Lesson** → teach card (rule, amount, ruling, 2–3 examples) → 10–15 mixed exercises → feedback sheet after each (right/wrong, explanation, Quranic example + note) → wrong ones return later → complete screen (stars, XP, accuracy, «نقطة» celebrates).
3. **Daily return** → streak + daily goal ring → continue next node or «راجع» (due concepts / my mistakes).
4. **Library** → read any of the 21 Madd lessons, ruler, Shatibiyyah/Tayyibah table, book tree, book page images; «انضم للقناة» button.
5. **New device** → export progress code → paste on the other device.

## 5. Information architecture
Tabs: **المسار** (path) · **راجع** (practice/mistakes) · **المكتبة** (library) · **حسابي** (streak, XP, goal, settings, export/import, about).
Course → Modules (Tuhfa chapters, Sheikh's order) → Units (rule families) → Lessons → Exercises.

## 6. UX spec (delta from PROMPT §3)
- **No hearts.** Mistakes are free; each wrong answer re-queues up to 2 more times.
- Unlock: lessons in order inside a module; **ready modules are always open**; «قريبًا» modules never block.
- Stars 1–3 by accuracy (≥90 / ≥70 / else). XP +10 correct, +20 finish, +10 perfect. Combo after 3. Streak + daily goal 20/50/100.
- Teacher mode (Settings) unlocks everything.
- WebAudio sound effects with on/off; confetti; all motion off under `prefers-reduced-motion`.
- Exercise types v1: صنّف · المقدار · الحكم · لوّن الحكم · بنك الأسئلة · صح ولا غلط · وصّل · رتّب · كمّل التعريف · احفظ الخريطة. v1.1: اكتشف الغلطة · الطريق · اسمع وحدّد (clips).

## 7. Brand direction
- Name **تحفة / Tuhfa**. Mascot **«نقطة»** — an ink dot from Arabic calligraphy that stretches with madd length and bounces on success. Never a living creature.
- Voice: Egyptian Arabic, warm and spiritual, short, always with an example. Tajweed terms in Fusha.
- Type: Cairo (UI), Scheherazade New (Quran). Calm neutral background, light + dark.
- Madd family colours fixed (PROMPT §4): gold · purple · sky · pink. Green/red reserved for feedback.
- Detailed tokens come in the `tuhfa-brand` skill, not here.

## 8. Platform
PWA on GitHub Pages (`ahmedgaid.github.io/tuhfa`) now. Google Play (TWA wrapper of the same site) later.

## 9. Content & data strategy
- Madd: extract every array from `reference/prototype.html` (L, C, D, SP, M, R, T, PG, RANK) into typed TS data; book wins over prototype; disagreements → `CONTENT_NOTES.md`.
- Quran text: verified against bundled Tanzil Uthmani at build time (`verify-quran.ts` fails CI). `verified:false` examples are **excluded from exercises** until the founder reviews them.
- Ambiguity test + spot-index test (PROMPT §5.3).
- Other chapters: built later from PDFs in `reference/source/` + transcripts, in the Sheikh's order; until then «قريبًا».
- Founder = content reviewer. Claude adds each new lesson the founder brings.

## 10. Telegram (channel is private)
- «انضم للقناة» button with the invite link.
- Per-lesson member links `t.me/c/<channel_id>/<msg_id>` once the JSON export exists. No embedded widget.
- Full recordings never re-hosted. Short clips (approved) for «اسمع وحدّد» in v1.1.

## 11. Technical architecture (from PROMPT §2, unchanged)
Vite + TypeScript + Preact · zod schemas · hash routing · localStorage `v1` with migrations ·
vite-plugin-pwa · self-hosted fonts · Vitest + Playwright (390×844) · ESLint + Prettier ·
GitHub Actions → Pages. Bundle ≤150 KB gz (excluding fonts).

## 12. Security & privacy
No accounts, no personal data leaves the device. Optional name only for the certificate, stored locally.
No bot tokens, no direct Telegram file URLs.

## 13. Scope
- **v1 (≤1 week, before the next Madd class):** full Madd module (all 21 lessons / 17 concepts / 57 Qs / 10 spot ayat / tree / ruler / table), all 10 prototype exercise types, teach cards, feedback, XP/combo/stars/streak/goal, path with «قريبًا» modules, library (Madd), mistakes review + Leitner SRS, export/import, PWA offline, «نقطة» v1, About + credit, book page images, CI deploy.
- **v1.1:** intro module (in order) · اكتشف الغلطة · الطريق · اسمع وحدّد clips · Telegram member links (after export) · certificate.
- **Later:** each remaining chapter as its PDF/transcript is processed · Google Play · reminders · leaderboard.

## 14. Risks
1. One-week deadline → if it slips, cut order: certificate → SRS polish → احفظ الخريطة level 4 → library extras. Never cut content verification.
2. Founder is sole reviewer → unverified examples hidden; ask Sheikh to skim `CONTENT_NOTES.md`.
3. Audio transcription (1.4 GB) slow on CPU → not on the v1 path.
4. Course order still unconfirmed → blocks the intro module only.

## 15. Acceptance (v1)
PROMPT §9 items that apply to Madd, minus hearts, minus public-Telegram items, plus: ready modules
always open; no unverified Quran string shown; «نقطة» appears on lesson-complete; site live at
`ahmedgaid.github.io/tuhfa`.
