# Build a Duolingo-style Tajweed learning web app (full course)

You are building a production-quality, free, static web app that teaches **the complete Tajweed course** (riwayat Hafs ʿan ʿĀṣim) to Arabic-speaking students. Examples of topics: الاستعاذة والبسملة، النون الساكنة والتنوين، الميم الساكنة، النون والميم المشددتان، اللامات، الإدغام، المدود، التفخيم والترقيق، القلقلة، مخارج الحروف وصفاتها، الوقف والابتداء… The learning experience must be modeled on **Duolingo**: a student who has never studied the material should be able to learn it just by playing through the course.

**The Madd module (المدود) is already designed and prototyped** (see `reference/`). It is the **first complete module** and the template for all the others. The engine, design system and exercise types must be **generic, so that every other Tajweed topic can be added as content, without new code**.

The app must be deployable **for free on GitHub Pages** (static files only, no server, no paid services).

---

## 0. What is in this repository already (read it first)

```
reference/
  prototype.html        ← a working single-file prototype. It is the SOURCE OF TRUTH for content.
  img/a-1.jpg … a-4.jpg ← book pages, part 1 (overview map, المد الأصلي, الطبيعي, الطبيعي الحرفي)
  img/b-01.jpg … b-22.jpg ← book pages, part 2 (التمكين … مراتب المدود)
  source/part1.pdf, source/part2.pdf ← the original book chapters (Madd)
  source/*.pdf          ← ALL other book chapters (added by me)
  telegram/result.json  ← export of the course's PUBLIC Telegram channel (added by me), see below
  telegram/files/…      ← the audio and PDF files from that export (for transcription only, never committed)
```

**The Telegram channel is the home of all audio and PDF lessons.** The app links to it; it does not re-host the full recordings. I will export the channel with **Telegram Desktop → channel menu → Export chat history → format: JSON**, with audio files and files included, and put the output in `reference/telegram/`.

This prototype covers **only the Madd chapter**. All the other chapters of the book are in `reference/source/`, and the teacher's audio explanations are on the Telegram channel (exported to `reference/telegram/`).

Before writing any code:

1. Open `reference/prototype.html` and read **all** of it. It contains every piece of content you need, as JavaScript arrays:
   - `L`: 21 lessons (title, tag, HTML explanation in Egyptian Arabic with Quranic examples)
   - `C`: 17 concepts (one per madd type), each with family, rule, amount (مقدار), ruling (حكم), examples, and a fill-in-the-blank definition
   - `D`: 57 hand-written multiple-choice questions, each with category, explanation, and a Quranic example plus note
   - `SP`: 10 "spot the madd in the ayah" exercises (ayah words + target type + correct word indexes + note)
   - `M`: the full "أحكام المد والقصر" tree, exactly as drawn in the book (page a-1)
   - `R` / `T`: the harakat ruler and the Shatibiyyah vs Tayyibah comparison table
   - `PG`: which book page images belong to which lesson
   - `RANK`: madd strength order
2. Look at the book page images to understand the original structure and wording.
3. **Extract all content into typed JSON/TS data files.** Do not retype it from memory, and do not invent new rules. Where the prototype and the book disagree, the book wins. List every disagreement in `CONTENT_NOTES.md`.

The prototype works and has been tested, but it is one 900-line file with no structure. Rebuild it properly. Keep everything it does, and improve on it as described below.

### 0.1 Using the teacher's audio

The audio is the teacher explaining the book. Use it in two ways:

**A. As a content source**
- Transcribe every audio file in `reference/telegram/files/` locally with an open-source model, e.g. `faster-whisper` (`large-v3`, `language="ar"`), with word timestamps. Save the transcripts as `reference/transcripts/<file>.json` and `.md`. Don't use paid APIs.
- Use the transcripts to write lesson explanations, teach cards and feedback **in the teacher's own words and examples**, kept short and in Egyptian Arabic like the prototype.
- **The PDF is the authority for rules.** If the audio and the PDF disagree, follow the PDF and record the disagreement in `CONTENT_NOTES.md`.
- **Never take Quranic text from a transcript.** Speech-to-text gets Quran wrong. Identify the ayah, then take the text from the verified Uthmani source (section 5).
- The teacher's extra tips that aren't in the book (common mistakes, memory tricks) are valuable. Add them as "💡 من الشيخ" notes, each linked to its timestamp.

**B. Organize the Telegram channel into a professional course library**

Parse `reference/telegram/result.json` and build a clean, structured catalog. Each message gives you a message `id`, `date`, `file`/`file_name`, `mime_type`, `duration_seconds`, `performer`/`title`, and the caption `text`.

1. **Classify every message**: audio lesson, PDF, announcement, or other. Ignore what isn't course material.
2. **Map each resource to the course**: module → lesson → part. Use the caption, file name, order of posting, and the transcript to decide. Detect series, such as «الدرس ٣ - الجزء ٢».
3. **Generate `src/content/library.ts`** (typed and validated), one entry per resource:
   `{ id, module, lesson, part, kind: 'audio'|'pdf', title, description, durationSec?, pages?, postedAt, telegramUrl: 'https://t.me/<channel>/<id>', topics: conceptIds[] }`
   - Write clean Arabic titles, e.g. «المدود — الدرس ٣: المد المنفصل والمتصل (الجزء ١)», instead of raw file names.
   - Write a one-line description from the transcript.
   - Link each entry to the concepts it covers.
4. **Write `reference/MAPPING.md`**: a table of every channel message → where it was placed (or why it was skipped). **Ask me to review it before building on it.** Anything you weren't sure about goes in a "needs review" section.
5. **The library screen («المكتبة»)** shows the course in order, for each module and lesson:
   - the lesson's audio parts and PDF, as clean cards with title, duration or page count, a short description, and the rules covered
   - a "🎧 اسمع على تليجرام" or "📄 افتح الملف على تليجرام" button that opens the Telegram post
   - an optional embedded Telegram post (official widget: `<script async src="https://telegram.org/js/telegram-widget.js" data-telegram-post="<channel>/<id>">`), loaded only when the student taps "شغّل هنا", so the page stays fast
   - a "✔ سمعته" / "✔ قرأته" checkbox stored in progress, with per-module completion (e.g. «٤ من ٧ دروس»)
   - search across titles, descriptions and rules, and filters by module and type (audio / PDF)
   - "ابدأ من هنا": the next unheard resource in course order
6. **Link the learning path to the library:**
   - Every teach card has «🎧 اسمع شرح الشيخ» → the Telegram post that explains that rule, with "من الدقيقة ٣:١٥" taken from the transcript timestamps (Telegram can't start at a timestamp, so show it as text).
   - After a lesson where the student made several mistakes, suggest the matching Telegram lesson.
7. **Never use the Telegram Bot API, bot tokens or direct Telegram file URLs in the app.** They expose secrets and break. Only use public `t.me` links and the official post widget. Telegram must be a **public channel** for this to work; if the export shows it's private, stop and tell me.

**Short clips hosted in the app (optional)**
- For the listening exercise «اسمع وحدّد» (the student hears the teacher read an example and picks the rule), cut **short clips** (a few seconds each) from the exported audio with ffmpeg. Encode them as mono Opus 32 kbps + AAC 48 kbps and host them with the app. They're small, so they fit GitHub Pages easily and work offline.
- **List every clip in `CONTENT_NOTES.md` for me to approve**, and only include approved clips.
- Never re-host full lessons; those stay on Telegram.
- Keep `reference/telegram/files/` **out of git** (`.gitignore`). It's only for transcription and cutting clips.

### 0.2 Other Tajweed modules: never invent content

- Build a module **only from a chapter that is in `reference/source/`**. For every chapter there, extract its content into the same data format as Madd, and list anything unclear in `CONTENT_NOTES.md`.
- For topics that have **no source chapter yet**, show them on the course path as **"قريبًا" (coming soon)** placeholder modules, with just a title and an icon. **Do not write Tajweed rules, definitions or examples for them from your own knowledge.** A wrong Tajweed rule taught to a student is worse than a missing one.
- When you finish, tell me which chapters you need so I can add them.

---

## 1. Audience and language

- Students of Quran and Tajweed, mostly in Egypt, often on phones.
- **UI and explanations in Egyptian Arabic** (العامية المصرية). Tajweed terms stay in Fusha (المد المنفصل، الجواز، اللزوم…). Copy the tone of the prototype: short, friendly, concrete, with an example every time.
- Fully **RTL** (`<html lang="ar" dir="rtl">`), **mobile-first** (design at 360–430 px wide, then scale up).
- Arabic numerals (٠١٢٣…) in learner-facing text, as in the prototype.

---

## 2. Tech stack (static, free, GitHub Pages)

- **Vite + TypeScript + Preact** (or vanilla TS with small components if you prefer, but justify it in the README). Keep the JS bundle small, under about 150 KB gzipped excluding fonts.
- **No backend.** All progress goes in `localStorage` behind a versioned storage module (`v1`, with migrations).
- **Hash routing** (`#/unit/2/lesson/1`) so deep links work on GitHub Pages without server rewrites.
- **PWA**: manifest, icons, and a service worker (e.g. `vite-plugin-pwa`) so the app installs on phones and works fully offline after the first visit.
- **Self-host the fonts** with `@fontsource/cairo` and `@fontsource/scheherazade-new`, so they work offline and don't depend on Google.
- Set `base` in `vite.config.ts` correctly for a project page (`/<repo-name>/`), and read it from an env var so forks work.
- Add a **GitHub Actions workflow** (`.github/workflows/deploy.yml`) that installs, runs tests, builds, and deploys to Pages using `actions/upload-pages-artifact` + `actions/deploy-pages`.
- Linting and formatting: ESLint + Prettier. Tests: **Vitest** (unit) and **Playwright** (e2e on a mobile viewport).

---

## 3. Learning design: follow Duolingo

### 3.1 Course structure

- **Course → Modules (Tajweed topics) → Units → Lessons → Exercises.**
- The home screen shows the whole course as one path, with a header band for each module (like Duolingo's sections). Modules unlock in order. Module order follows the book, or this default order if the book doesn't say: الاستعاذة والبسملة ← النون الساكنة والتنوين ← الميم الساكنة ← النون والميم المشددتان ← اللامات ← الإدغام ← المدود ← التفخيم والترقيق ← القلقلة ← مخارج الحروف ← صفات الحروف ← الوقف والابتداء.
- Every module ends with a **module checkpoint**. The course ends with a **final review** that mixes all modules.
- **Madd module.** Its units follow the madd **families** (from the book's tree):
  1. المد الأصلي (الطبيعي، الطبيعي الحرفي، التمكين، العوض، الصلة الصغرى)
  2. المد الفرعي بسبب الهمز (المنفصل، الصلة الكبرى، البدل، المتصل)
  3. المد الفرعي بسبب السكون (اللازم الكلمي والحرفي، الحروف المقطعة، التسهيل، العارض، اللين)
  4. المد الفرعي بسبب معنوي (التعظيم، التبرئة)
  5. مراتب المدود + الشاطبية والطيبة
  6. مراجعة شاملة
- Other modules follow the same pattern: one unit per **category** in that chapter's own tree or classification (e.g. النون الساكنة: إظهار / إدغام / إقلاب / إخفاء).
- Split each unit into **short lessons** (about 3–5 minutes, 10–15 exercises each). One new concept per lesson, then a mixed "checkpoint" lesson at the end of the unit.

### 3.2 Learning path (home screen)

- A vertical winding path of round nodes like Duolingo, one node per lesson, with a bigger chest or trophy node for each unit checkpoint.
- Nodes are **locked until the previous one is completed**. The current node pulses (respect `prefers-reduced-motion`).
- Each completed lesson shows **1–3 stars** based on accuracy (90%+ = 3, 70%+ = 2, otherwise 1). Lessons can be replayed to improve stars.
- Add a small "teacher mode" toggle in Settings that unlocks everything.

### 3.3 Inside a lesson

- **Teach card first.** When a concept appears for the first time, show a short card with the name, a one-line rule, the amount, the ruling, 2–3 Quranic examples, and a "فهمت، يلا نتمرّن" button.
- **Then mixed exercises.** Use every type below, and generate them from the concept data so that each session is different. Every exercise type must work for **any** module, not just Madd. For example, "لوّن الحكم" (the generalized "لوّن المد") works for إخفاء or قلقلة too, and "احفظ الخريطة" works with any chapter's tree:

| Type | What the student does |
|---|---|
| صنّف | Sees a Quranic word or phrase in large type and picks which madd it contains |
| المقدار | Picks the number of harakat for a madd |
| الحكم | Picks واجب / جائز / لازم |
| صح ولا غلط | Two big buttons |
| كمّل التعريف | Fills a blank in a definition from a word bank |
| وصّل | Matches 4–5 madd names to examples by tapping pairs |
| رتّب | Orders madd types from strongest to weakest by tapping |
| لوّن الحكم | Sees a full ayah and taps every word that contains a given rule (e.g. «المد المنفصل»، «الإخفاء»، «القلقلة») |
| احفظ الخريطة | Fills blank nodes in a chapter's tree from a word bank, at 4 levels (structure, names, full map, examples) |
| بنك الأسئلة | Uses each module's hand-written MCQs (Madd has 57, in `D`) |
| **New: اكتشف الغلطة** | "القارئ قصر المتصل حركتين" → is that correct? Why? |
| **New: الطريق** | Shows a rule and a طريق (الشاطبية / الطيبة), and the student picks what is allowed. Only for rules where the book says the two طرق differ |

- **Feedback after every answer**, using a bottom sheet like Duolingo's: correct or incorrect, the correct answer, a short explanation, **and always a Quranic example with a note** saying where the madd is and how long it is held.
- **Wrong answers come back later in the same session** (up to 2 more times).
- **Hearts:** 5 per lesson, and each mistake costs one. At 0, show a "خلصت القلوب" screen with "retry" and "review the lesson" options. Hearts refill fully at the start of each lesson. Don't sell or gate anything, because the app is free.
- **XP:** +10 per correct answer, +20 for finishing a lesson, +10 bonus for a perfect lesson. **Combo** indicator after 3 correct answers in a row.
- **Streak:** counts consecutive days with at least one completed lesson, with a flame icon. **Daily goal** ring with a selectable goal (20/50/100 XP).
- **Celebrations:** sound effects generated with WebAudio (no audio files), confetti, and a lesson-complete screen with stars, XP and accuracy. Add a sound on/off toggle.

### 3.4 Review and retention

- **Mistakes review:** store every concept the student got wrong. Add a "راجع غلطاتي" practice session built from those concepts.
- **Spaced repetition:** a simple Leitner box per concept (boxes 1–5, with intervals of 1/2/4/7/14 days). The "Practice" button picks concepts that are due.
- **Lessons library:** a separate tab grouped by module. For Madd, that means all 21 lessons in full, each with:
  - the explanation
  - the harakat ruler
  - the Shatibiyyah/Tayyibah table
  - the interactive book tree (zoomable, horizontally scrollable)
  - a "📄 شوف الصفحة من الكتاب" button that opens the original page image in a zoomable lightbox (mapping is in `PG`)

### 3.5 Progress portability (no backend)

- **Export / import progress** as a short text code or JSON that the student can copy into another device.
- Optional: a printable "certificate" page when all units are complete, with the student's name.

---

## 4. Visual design system: semantic colors

Colors carry meaning, and nothing is colored at random. The student should be able to remember a rule by its **color, icon and position**.

- **Each module defines its own categories in content** (Madd: 4 families). Each category gets one color and one icon from a shared **category palette** of 6–8 colors that are accessible in light and dark mode and never green or red. Inside a module, a category's color is applied everywhere it appears.
- **Each module also has a module color**, used for its header band on the path and its icon.
- **Green and red stay reserved for answer feedback across the whole app.**

The Madd module's colors (already tested with students' feedback; keep them):

| Meaning | Color (light / dark) | Icon | Used for |
|---|---|---|---|
| المد الأصلي | gold `#b07400` / `#f2b84b` | ا | everything in this family |
| بسبب الهمز | purple `#7446c9` / `#b393f2` | ء | everything in this family |
| بسبب السكون | sky blue `#0a7ea8` / `#5cc6ea` | ـْ | everything in this family |
| بسبب معنوي | pink `#c2337a` / `#f487bd` | ♡ | everything in this family |
| Correct answer **only** | green `#1f9d55` / `#4fd18b` | ✔ | feedback only |
| Wrong answer **only** | red `#d63a3a` / `#ff7272` | ✘ | feedback only |
| UI chrome | neutral ink / grays | — | buttons, tabs, progress bars |

- **Never** use green or red for anything other than answer feedback. Primary buttons are neutral dark ink, not green.
- The family color is applied consistently to lesson borders and numbers, path nodes, ruler rows, tree nodes, question tags, example boxes and Quranic text inside them.
- الشاطبية = filled dark badge; الطيبة = outlined badge (shape, not color).
- Fonts: **Cairo** for UI and explanations, **Scheherazade New** for Quranic text (larger size, generous line height).
- Light and dark themes (`prefers-color-scheme`), with a calm neutral background. **Don't** use pure white on pure black.
- Tactile, Duolingo-like buttons (bottom border "depth" and a press animation), 44 px minimum touch targets, visible focus states.

---

## 5. Content integrity (very important)

The prototype's Quranic examples were typed by an AI and **have not been verified against a Mushaf**. Before publishing:

1. Every Quranic string must be checked against a trusted Uthmani text. Recommended: **Tanzil Uthmani text** (tanzil.net). If you bundle it, follow its license (verbatim text only, attribution required) and credit it in the app's About page.
2. Give each example a **surah:ayah reference** and a `verified: boolean` field. Write `scripts/verify-quran.ts`, which compares every example to the bundled text and fails CI if any `verified: true` example doesn't match.
3. **Exercise ambiguity check (all modules):** in "صنّف" and "صح ولا غلط", a word must contain only **one** of the candidate rule types (e.g. «ءامنوا وعملوا» contains both بدل and تمكين, so it can't be used to classify تمكين). Write a Vitest test that fails if an example is tagged with more than one concept that could appear as an option. For "لوّن الحكم", the correct word indexes must be tested, because the prototype once had an off-by-one bug there.
4. Add a `CONTENT_NOTES.md` that lists every example still marked `verified: false`, so a qualified Tajweed teacher can review them.
5. **Book page images and audio clips:** both come from the teacher. **Ask me before including them in the public build.** Put them behind build flags (`VITE_INCLUDE_BOOK_PAGES`, `VITE_INCLUDE_CLIPS`) that default to `false`, until I confirm I have permission to publish them. Telegram links can be on by default, because the channel is public. Credit the teacher in the About page in the wording I give you.

---

## 5.1 Adding a new Tajweed module (content authoring)

The engine must not know about any specific topic. Adding a module should take content only:

1. Copy `src/content/modules/_template/` to a new folder.
2. Fill in the following (plus the module's entries in `library.ts` and any approved clips):
   - **categories**: id, name, color, icon
   - **concepts**: name, category, one-line rule, ruling, amount or how it is applied, examples with surah:ayah, and a definition with one blank word
   - **lessons**: the explanation in Egyptian Arabic
   - **tree**: the chapter's classification, as drawn in the book
   - **questions**: optional hand-written MCQs
   - **spot ayat**: an ayah, a target rule, and the indexes of the correct words
3. Register the module in `course.ts`.
4. Run `npm run validate`, which runs the schema check, ambiguity check, Quran verification and spot-index check.

Write this up as `CONTENT_GUIDE.md` (in Arabic and English), so a Tajweed teacher with no coding background can add or fix content with a text editor and a pull request.

---

## 6. Accessibility and quality bar

- Semantic HTML, proper `button`s, ARIA where needed, a fully keyboard-playable lesson, and screen-reader announcements for feedback (`aria-live`).
- `prefers-reduced-motion` turns off pulses, shakes and confetti.
- Lighthouse on mobile: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, PWA installable.
- No layout overflow at 360 px. Long Arabic labels wrap cleanly. The book tree scrolls horizontally, inside its own container.

---

## 7. Suggested project structure

```
src/
  content/
    course.ts       module order, titles, icons, colors, status (ready / coming soon)
    schema.ts       shared types + runtime validation (e.g. zod) for every module
    modules/
      madd/         categories.ts, concepts.ts, lessons.ts, questions.ts, spot.ts, tree.ts, ruler.ts, turuq.ts, pages.ts
      noon-sakina/  … same files, added only when its chapter is provided
      …
  engine/         session.ts (builds lesson queues), generators/*.ts (one per exercise type), scoring.ts, srs.ts
  state/          storage.ts (versioned), progress.ts, streak.ts, settings.ts
  ui/             components/, screens/ (Path, Lesson, Feedback, Library, Review, Profile, Settings), theme.css
  audio/          sfx.ts (WebAudio)
  main.tsx
tests/            unit tests (generators, srs, streak, ambiguity, spot indexes) + e2e (play every unit on a mobile viewport)
scripts/          extract-from-prototype.ts (optional), verify-quran.ts
public/           icons, manifest
```

---

## 8. How to work

1. **Plan first.** Write `PLAN.md` with milestones and get the skeleton building and deploying to GitHub Pages early (milestone 1 = an empty app live on Pages).
2. Then work milestone by milestone, with small commits and tests passing at each step:
   - M1: scaffold, CI, Pages deploy, theme, fonts, RTL
   - M2: generic content schema + course/module structure; Madd content extracted into typed data; validation tests
   - M3: lesson engine with all exercise types and feedback
   - M4: path, hearts, XP, streak, daily goal, stars, celebrations
   - M5: library (per module: lessons, interactive tree, book pages behind a flag; Madd extras: ruler, comparison table)
   - M5.5: transcribe the audio; build a module for every other chapter in `reference/source/` (content only, using PDF + transcripts); add "قريبًا" placeholders for anything missing
   - M5.6: parse the Telegram export → `library.ts` + `MAPPING.md` (wait for my review) → library screen, teach-card links, listening exercise (approved clips only)
   - M6: mistakes review + spaced repetition + export/import progress
   - M7: PWA/offline, accessibility pass, Lighthouse, e2e tests
3. After each milestone, run the app on a 390×844 viewport, take screenshots, and check them yourself.
4. Write the `README.md` in **Arabic and English**, covering: what the app is, how to run it locally, how to deploy your own copy to GitHub Pages (step by step, including enabling Pages → "GitHub Actions" in repo settings), how to edit content, and content credits.

---

## 9. Acceptance criteria

- [ ] `npm run build` produces a static site, and the GitHub Actions workflow deploys it to `https://<user>.github.io/<repo>/`.
- [ ] Works offline after the first load, and can be installed on Android and iOS.
- [ ] The course path shows all Tajweed modules. Madd is fully playable. Every chapter provided in `reference/source/` is built as a module, and the rest show "قريبًا".
- [ ] A new student can go through the whole Madd module using only the lessons and exercises, with teach cards, all exercise types, hearts, XP, streak, stars and review.
- [ ] Every one of the Madd module's 21 lessons, 17 concepts, 57 questions, 10 ayah exercises, the tree, the ruler and the Shatibiyyah/Tayyibah table from the prototype is present.
- [ ] Adding a module needs no engine code: there is a `_template` module, a `CONTENT_GUIDE.md`, and `npm run validate`.
- [ ] No Tajweed content was written for a topic without a source chapter.
- [ ] Every audio and PDF post in the Telegram channel appears in the library under the right module and lesson, with a clean title, description, duration or page count, and a working `t.me` link, or is listed as skipped in `MAPPING.md` with a reason.
- [ ] Teach cards link to the right Telegram lesson and show the minute where the rule is explained.
- [ ] No bot tokens or direct Telegram file URLs anywhere in the code. Full recordings are not re-hosted. The build stays within GitHub Pages limits.
- [ ] Transcripts are saved in `reference/transcripts/`, and no Quranic text comes from a transcript.
- [ ] The semantic color system is applied everywhere, and green and red appear only in answer feedback.
- [ ] Unit + e2e tests pass in CI. The ambiguity test and the "spot the madd" index test pass.
- [ ] `CONTENT_NOTES.md` lists all unverified Quranic text, and the book images are off by default.
