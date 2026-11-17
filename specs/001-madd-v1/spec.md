# Feature Specification: Tuhfa v1 — Madd module, playable end to end

**Feature Branch**: `docs/discovery` (spec) → build branches per milestone

**Created**: 2026-11-17

**Status**: Draft

**Input**: User description: "Build Tuhfa v1 per discovery/PRODUCT_DEFINITION.md: a free, offline,
Arabic, Duolingo-style course where the Madd module is fully playable, every other Tuhfa chapter shows
as «قريبًا», and content is pure data so new chapters need no new code. Ship within ~1 week."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a Madd lesson from start to finish (Priority: P1)

A course student opens Tuhfa on their phone, sees the course path with the Madd module open, taps the
first lesson, reads a short teach card about المد الطبيعي, answers 10–15 mixed exercises with instant
feedback after each, and finishes on a celebration screen showing stars, XP and accuracy.

**Why this priority**: This is the product. Without it nothing else matters, and it is what students
need before the Sheikh's next Madd class.

**Independent Test**: Open the live site on a 390×844 phone viewport, play lesson 1 of unit 1 to the
end, and see the completion screen; reload and see the lesson marked done with its stars.

**Acceptance Scenarios**:

1. **Given** a first-time visitor, **When** they open the site, **Then** they see a short welcome with
   the credit to the Sheikh and then the course path with the Madd module open and its first lesson
   ready.
2. **Given** a lesson that introduces a new concept, **When** it starts, **Then** a teach card shows the
   concept name, one-line rule, amount (مقدار), ruling (حكم) and 2–3 verified Quranic examples, with a
   «فهمت، يلا نتمرّن» button.
3. **Given** any exercise, **When** the student answers, **Then** a bottom sheet says right or wrong,
   shows the correct answer, a short explanation, and a Quranic example with a note on where the madd
   is and how long it is held.
4. **Given** a wrong answer, **When** the session continues, **Then** the same item returns later in
   the session (at most 2 more times) and the student loses nothing.
5. **Given** 3 correct answers in a row, **When** the third is confirmed, **Then** a combo indicator
   appears.
6. **Given** the last exercise is answered, **When** the lesson ends, **Then** the student sees 1–3
   stars (≥90% = 3, ≥70% = 2, else 1), XP earned (+10 per correct, +20 finish, +10 perfect), accuracy,
   and «نقطة» celebrating, with a warm message like «ما شاء الله عليك! ربنا يفتح عليك».

---

### User Story 2 - Every exercise type, driven only by content data (Priority: P1)

Lessons mix all ten exercise types — صنّف، المقدار، الحكم، صح ولا غلط، كمّل التعريف، وصّل، رتّب،
لوّن الحكم، احفظ الخريطة، بنك الأسئلة — generated from the module's concept data so each session differs.

**Why this priority**: The founder chose all ten for v1; variety is what makes practice stick. Driving
them from data is what lets the other chapters arrive later without code.

**Independent Test**: Use the teacher-mode toggle to open every lesson; confirm each type appears and
is answerable by tap and by keyboard; swap in the `_template` module's sample data and confirm the
same types render with no code change.

**Acceptance Scenarios**:

1. **Given** a «صنّف» item, **When** it is generated, **Then** the shown word contains exactly one of
   the offered rule types (no ambiguous items).
2. **Given** a «لوّن الحكم» item, **When** the student taps words in the ayah and confirms, **Then**
   grading uses the stored correct word positions, and those positions are proven correct by an
   automated test.
3. **Given** «احفظ الخريطة», **When** the student fills blank nodes of the Madd tree from a word bank,
   **Then** it works at 4 levels (structure, names, full map, examples).
4. **Given** «رتّب», **When** the student taps madd types from strongest to weakest, **Then** the order
   is graded against the book's strength ranking.
5. **Given** any example whose Quranic text is not yet verified, **When** exercises are generated,
   **Then** that example is never used.

---

### User Story 3 - The course path, progress and daily habit (Priority: P2)

The home screen shows the whole course as one winding path: a header band per module in the Sheikh's
order, one node per lesson, a bigger node per unit checkpoint. The Madd module and its units follow the
book's family tree. Other chapters show as «قريبًا». A streak flame and a daily-goal ring encourage a
little study every day.

**Why this priority**: Turns single lessons into a course and gives a reason to come back; needed for
v1 but less critical than the lesson itself.

**Independent Test**: Complete two lessons on day 1 and one on day 2 (simulated clock); confirm stars
on nodes, next node unlocked, streak = 2, and daily-goal ring progress.

**Acceptance Scenarios**:

1. **Given** the path, **When** it renders, **Then** modules appear in the Sheikh's lesson order, Madd
   is open, and every «قريبًا» module shows only a title and icon and never locks a later module.
2. **Given** a module, **When** a lesson is not yet completed, **Then** the lessons after it in that
   module are locked; the current node pulses (no pulse with reduced motion).
3. **Given** a completed lesson, **When** the student replays it with better accuracy, **Then** its
   stars go up and never go down.
4. **Given** the teacher-mode toggle in Settings, **When** it is on, **Then** every lesson is open.
5. **Given** at least one lesson completed on consecutive days, **When** the student opens the app,
   **Then** the streak count reflects those days; a missed day resets it.
6. **Given** a daily goal of 20/50/100 XP chosen in Settings, **When** XP is earned today, **Then** the
   ring fills proportionally.
7. **Given** sound is on, **When** answers are right/wrong or a lesson ends, **Then** short generated
   sound effects play; a toggle turns them off.

---

### User Story 4 - Review: my mistakes and due concepts (Priority: P2)

A «راجع» tab offers «راجع غلطاتي» (concepts the student got wrong) and a practice session of concepts
that are due by spaced repetition (Leitner boxes 1–5, intervals 1/2/4/7/14 days).

**Why this priority**: Retention is the point of a Duolingo-style course, but students can learn
without it on day one.

**Independent Test**: Answer a concept wrong, open «راجع غلطاتي», see it practised; advance the clock
and see due concepts appear in practice.

**Acceptance Scenarios**:

1. **Given** a concept answered wrong, **When** the student opens «راجع غلطاتي», **Then** a session is
   built from their wrong concepts.
2. **Given** a concept answered right in review, **When** it is graded, **Then** it moves up one box;
   wrong moves it to box 1.
3. **Given** no concepts are due, **When** the student opens practice, **Then** they see a friendly
   message and a way to continue the path.

---

### User Story 5 - Library: read and look things up (Priority: P2)

A «المكتبة» tab lists the Madd module's 21 lessons in full: each explanation, the harakat ruler, the
Shatibiyyah/Tayyibah comparison table, the interactive book tree (zoomable, scrolls sideways in its own
box), and a «📄 شوف الصفحة من الكتاب» button that opens the original book page in a zoomable viewer.
A «انضم للقناة» button opens the course's Telegram channel invite.

**Why this priority**: Students revise from the library before class; it reuses the same content.

**Independent Test**: Open the library, read lesson 7, open its book page, zoom, close; open the tree
and scroll it sideways at 360 px without the page itself scrolling sideways.

**Acceptance Scenarios**:

1. **Given** the library, **When** a lesson is opened, **Then** its explanation, family colour, and
   linked book pages (per the prototype's page mapping) are shown.
2. **Given** «انضم للقناة», **When** tapped, **Then** the Telegram invite link opens outside the app.
3. **Given** the ruler and the comparison table, **When** shown, **Then** Shatibiyyah is a filled dark
   badge and Tayyibah an outlined badge (shape, not colour).

---

### User Story 6 - Installs, works offline, moves between devices (Priority: P3)

The student adds Tuhfa to the home screen and later opens it with no internet. When changing phones,
they copy an export code from «حسابي» and paste it on the new device.

**Why this priority**: Important for Egyptian mobile users, but the course is usable online first.

**Independent Test**: Load once, go offline, reload, play a lesson. Export a code, clear storage,
import it, and see identical progress.

**Acceptance Scenarios**:

1. **Given** one online visit, **When** the device goes offline, **Then** the full app including fonts
   and book pages works.
2. **Given** an export code, **When** imported on a fresh device, **Then** stars, XP, streak, review
   boxes and settings are restored; an invalid code shows a clear error and changes nothing.

---

### User Story 7 - Add a new chapter as content only (Priority: P3)

The founder brings a new lesson; Claude (or a teacher with a text editor) copies the `_template`
module, fills categories, concepts, lessons, tree, questions and spot-ayat, registers it in the course
list, and runs one validate command that checks schema, ambiguity, Quran text and word positions.

**Why this priority**: Not needed by students in week one, but it is the architecture promise that
makes every later chapter cheap.

**Independent Test**: Fill the `_template` with sample data, register it, run validate, and see it
appear on the path and play — without touching engine files.

**Acceptance Scenarios**:

1. **Given** a content folder with an example tagged with two candidate rules, **When** validate runs,
   **Then** it fails and names the example.
2. **Given** a `verified: true` example whose text differs from the Mushaf text, **When** validate
   runs, **Then** it fails and names the reference.

---

### Edge Cases

- Storage unavailable (private browsing, blocked storage): the app still plays; a notice says progress
  will not be saved.
- Stored progress from an older storage version: migrated, never wiped.
- A lesson whose concepts have too few verified examples to build 10 items: the session uses what is
  available (minimum set by plan) and the gap is listed in `CONTENT_NOTES.md`.
- Very long Arabic labels at 360 px: wrap cleanly, never overflow.
- Day boundary for streak: the device's local date.
- A student leaves mid-lesson: progress for that lesson is not counted; returning restarts it.
- Reduced motion: no pulse, shake or confetti; «نقطة» changes pose without animation.

## Requirements *(mandatory)*

### Functional Requirements

**Course & content**
- **FR-001**: The course MUST list all Tuhfa chapters in the Sheikh's lesson order; only modules with
  source content are playable, the rest show «قريبًا» with title and icon only.
- **FR-002**: The Madd module MUST include every item from the prototype: 21 lessons, 17 concepts, 57
  hand-written questions, 10 spot-the-madd ayat, the full book tree, the harakat ruler, the
  Shatibiyyah/Tayyibah table, the page mapping and the strength ranking.
- **FR-003**: Madd units MUST follow the book's families: المد الأصلي · بسبب الهمز · بسبب السكون · بسبب
  معنوي · مراتب المدود + الشاطبية والطيبة · مراجعة شاملة; each unit ends with a checkpoint lesson, the
  module ends with a module checkpoint.
- **FR-004**: Where the prototype and the book disagree, the book MUST win and each disagreement MUST be
  listed in `CONTENT_NOTES.md`.
- **FR-005**: Every Quranic example MUST have a surah:ayah reference and a verified flag; unverified
  examples MUST NOT appear in exercises and MUST be listed for founder review.
- **FR-006**: Adding a module MUST require only content files plus one registration entry; a
  `_template` module and a bilingual `CONTENT_GUIDE.md` MUST exist.

**Lessons**
- **FR-007**: Lessons MUST be 10–15 exercises, introduce at most one new concept with a teach card
  first, and draw exercises from all ten v1 types using the module's data.
- **FR-008**: Feedback MUST follow every answer as described in User Story 1, scenario 3, and be
  announced to screen readers.
- **FR-009**: There MUST be no hearts or lives; wrong answers re-queue up to 2 more times.
- **FR-010**: XP, combo, stars and the completion screen MUST behave as in User Story 1.

**Path & habit**
- **FR-011**: Lesson unlocking, module openness, stars, teacher mode, streak, daily goal and sound
  toggle MUST behave as in User Story 3.

**Review**
- **FR-012**: Mistakes review and Leitner spaced repetition MUST behave as in User Story 4.

**Library**
- **FR-013**: The library MUST provide everything in User Story 5, including book page images.
- **FR-014**: A «انضم للقناة» button MUST open the channel invite link. No embedded Telegram player; no
  Telegram bot tokens or direct file URLs anywhere.

**Profile, data & platform**
- **FR-015**: Progress MUST be stored only on the device, versioned with migrations, and exportable /
  importable as a code.
- **FR-016**: The app MUST be installable and fully usable offline after one visit.
- **FR-017**: All UI MUST be Arabic, right-to-left, phone-first, with Arabic numerals in learner text,
  light and dark themes, and keyboard-playable lessons.
- **FR-018**: Category colours MUST be applied consistently (Madd: gold/purple/sky/pink with their
  icons); green and red MUST appear only in answer feedback.
- **FR-019**: An About page MUST show: «المحتوى مأخوذ من دروس فضيلة الشيخ جابر في شرح متن تحفة
  الأطفال، جزاه الله خيرًا», plus the Quran text source credit.
- **FR-020**: The mascot «نقطة» (ink dot) MUST appear at least on the welcome and lesson-complete
  screens.

### Key Entities

- **Course**: ordered list of modules.
- **Module**: a Tuhfa chapter — id, title, icon, colour, status (ready / coming soon), categories,
  concepts, lessons, units, tree, optional questions, spot-ayat, optional extras (ruler, turuq table,
  page images).
- **Category**: a rule family inside a module — name, colour, icon.
- **Concept**: one rule — name, category, one-line rule, amount/application, ruling, examples,
  definition with one blank word.
- **Example**: Quranic word or phrase — text, surah:ayah, verified flag, note, concept tags.
- **Lesson / Unit**: ordered groups of concepts with explanation text; units end in checkpoints.
- **Question**: hand-written MCQ — prompt, options, answer, category, explanation, example.
- **Spot item**: ayah words, target rule, correct word positions, note.
- **Learner progress**: per-lesson stars, XP totals, daily XP, streak, Leitner box + due date per
  concept, mistakes list, settings (goal, sound, teacher mode, theme), storage version.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time student reaches the first exercise within 30 seconds of opening the site.
- **SC-002**: A student can play the entire Madd module (every lesson and checkpoint) with no dead end,
  confirmed by an automated full play-through on a phone-sized screen.
- **SC-003**: 100% of prototype content items (21/17/57/10 + tree + ruler + table) are present.
- **SC-004**: 0 unverified Quranic strings are shown to students; 0 ambiguous classification items
  exist; 100% of spot-the-madd positions pass their test.
- **SC-005**: After one visit, a full lesson can be played with the network off.
- **SC-006**: Mobile Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
- **SC-007**: The site is live at `ahmedgaid.github.io/tuhfa` before the Sheikh's next Madd class
  (target ≤ 7 days from 2026-11-17).
- **SC-008**: Within 1 month of launch, the founder reports that most course students have used it and
  the Sheikh recommends it (qualitative).

## Assumptions

- Students have a modern phone browser (Chrome on Android, Safari on iOS) and one online visit.
- The prototype's content is the starting point; the book (`reference/source/`) corrects it.
- The founder is the content reviewer and will review `CONTENT_NOTES.md` quickly enough for launch;
  until then, unverified examples are simply hidden.
- The Sheikh's lesson order for non-Madd chapters is not yet confirmed; «قريبًا» placeholders use the
  PDF numbering as a provisional order and are reordered later without code changes.
- The Telegram JSON export is not available; per-lesson Telegram links, the listening exercise
  (clips), «اكتشف الغلطة», «الطريق», the intro module and the certificate are out of v1 scope (v1.1).
- Leaderboards, reminders/notifications and the Play Store build are out of scope.
