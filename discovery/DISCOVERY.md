# Tuhfa (تحفة) — live discovery model

Source spec: `PROMPT.md` (repo root). This file records what the founder decided **on top of** that spec.
Updated after every answer batch. Sections never mixed.

_Last update: 2026-11-17 — round 1 (16 answers)._

## CONFIRMED (founder explicitly decided)

### Identity
- **Name: تحفة — Tuhfa.** Skills prefix: `tuhfa-*`.
- **Separate product** from Tagweed (`D:\Company\10-Products\Tagweed`, the teacher-management app). No shared brand, repo or code.
- Repo **public** on GitHub account `ahmedGaid`, deployed free to GitHub Pages.

### Audience
- Primary learner: **young adults and adults** (not children). Men and women, same app, no gender split.
- Launch audience: **the Sheikh's course students first**, then open to anyone.
- **No teacher dashboard.** Each student's progress is private to their device (localStorage). No backend.

### Content and authority
- Sheikh Jaber's course on **متن تحفة الأطفال**. Course is **ongoing**; new lessons keep coming.
- **Claude converts each new lesson into content** when the founder brings it (founder does not hand-edit).
- **Sheikh approved publishing** both book page images and short audio clips → `VITE_INCLUDE_BOOK_PAGES` and `VITE_INCLUDE_CLIPS` may default to `true` once wired (PROMPT §5.5 asked for this confirmation).
- **Content reviewer = the founder.** `CONTENT_NOTES.md` is written for the founder to review.
- **Module order = the Sheikh's lesson order** (as he teaches the Tuhfa), not PROMPT §3.1's default list.
- Theory chapters (متن التحفة · مبادئ علم التجويد · حكم التجويد) → **an intro module** with short explanations and MCQs, first on the path.
- PDFs `08-أحكام المد والقصر` and `09-أحكام المد والقصر` are **two different parts** of the Madd chapter.

### Telegram
- Channel is **public**.
- No JSON export yet → **build the library from local audio/PDF files now**; add `t.me` links when the export arrives.

### Experience (changes vs PROMPT)
- **No hearts.** Mistakes cost nothing; wrong answers just come back later in the session. (Overrides PROMPT §3.3 hearts + «خلصت القلوب» screen.)
- Tone after a correct answer: **warm and spiritual** — «ما شاء الله عليك! ربنا يفتح عليك، كمّل كمّل 🌟».
- **Mascot: open** — founder asked for 3 proposals.
- **No daily reminders/notifications** now; revisit with the Play Store app. Streak + daily goal stay in-app.
- **No leaderboard/leagues** in v1 (needs a server) → FUTURE.

### Platform
- **PWA now, Google Play later** from the same code (e.g. TWA wrapper).

### Scope and timing
- **Deadline: before the Sheikh's next Madd lesson** (urgent).
- **v1 = Madd module fully playable + every other module shown as «قريبًا»** (plus the intro module if it fits the deadline — see OPEN).
- Success at 3 months: course students use it regularly · all course chapters built · the Sheikh recommends it · people outside the course use it.

## INFERRED (strongly implied, not decided)
- Exercise types, XP, combo, streak, daily goal, stars, SRS, mistakes review, export/import: as PROMPT §3, minus hearts.
- Gamification should feel **respectful**, not childish (adult audience + spiritual tone).
- Leaderboard dropped partly because competition may feel wrong for Quran study (founder chose "later", not "never").

## OPEN
1. Telegram channel **username** (for `t.me/<channel>` links).
2. **Credit wording** for the Sheikh on the About page (founder's exact words).
3. Mascot: 3 proposals to show (non-living symbol vs character vs none).
4. Does the intro module have to ship in v1, or right after Madd?
5. Book PDFs (`reference/source/`, `PDF Files/`) in the **public** repo? Currently git-ignored. Page images are committed.
6. Rename the folder `Tagweed Doulingo` → `Tuhfa`, and GitHub repo name (`tuhfa`?).
7. Exact Sheikh lesson order — derive from audio numbering (lessons 1–28 + مقرأة) and PDF numbering; confirm with founder.
8. Is there a date for the "next Madd lesson"? Sets the v1 cut.

## CONFLICTS
- **PDF numbering**: two files numbered `05` (الغنة · الإدغام والقلب والإخفاء); لامات is `07`, Madd is `08` + `09`; audio lessons 22–28 are already Madd. Need the real order.
- **Deadline vs "all chapters ready"**: success wants every chapter; deadline wants Madd now. Resolved by phasing (Madd first).
- **PROMPT hearts vs founder "no hearts"** → founder wins.

## RISKS
- **Founder is the only content reviewer.** If not a qualified Tajweed teacher, wrong rulings may ship. Mitigation: every Quranic string verified against Tanzil by script; `verified:false` examples hidden from exercises until reviewed; ask the Sheikh to skim `CONTENT_NOTES.md` once.
- **Deadline** is tight for a full Madd module with 12 exercise types. Mitigation: ship Madd with the core types first, add the rest after.
- **Course order unclear** → path could teach out of order vs the class.
- Transcribing ~1.4 GB of audio locally (faster-whisper large-v3) is slow on CPU; may not fit the deadline. Not needed for v1 Madd (prototype already has the content).

## IDEAS (not requirements)
- «احفظ المتن» exercise — memorise the Tuhfa verses (founder chose the intro module without it for now).
- Women/men sections not needed; one app.
- Play Store build brings real reminders.
