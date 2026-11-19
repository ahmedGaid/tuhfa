# دليل إضافة باب جديد — Content guide

<div dir="rtl">

## بالعربي

الباب الجديد في تحفة = **بيانات بس**، من غير أي كود جديد. المحرّك (`src/engine`) بيبني التمارين
العشرة لوحده من البيانات.

### قبل ما تبدأ — قواعد ثابتة

- **القواعد والتعريفات من كتاب فضيلة الشيخ جابر ودروسه بس**، مش من الذاكرة ولا من مصدر تاني.
- **نص القرآن من `data/quran-uthmani.txt` (تنزيل) بس.** أي مثال مش متأكدين منه يفضل
  `verified: false`، وده معناه إنه **مش هيظهر** في التمارين لحد ما يتراجع.
- ألوان الأقسام من لوحة الألوان المشتركة، **أبدًا مش أخضر ولا أحمر** (دول للصح والغلط بس).

### الخطوات

1. **انسخ القالب**: انسخ فولدر `src/content/modules/_template/` إلى `src/content/modules/<id>/`
   (`<id>` بالإنجليزي وبشَرطة، زي `noon-sakinah`).
2. **املأ البيانات** في `index.ts` (ولو كبرت، قسّمها ملفات زي باب المد: `concepts.ts` و`units.ts` …):
   - `categories` — عائلات الأحكام، لكل واحدة اسم وأيقونة ولون.
   - `concepts` — كل حكم: القاعدة في سطر، المقدار، الأمثلة، والتعريف (٣ أجزاء: قبل، الكلمة
     الناقصة، بعد).
   - `units` ← `lessons` — الوحدات والدروس بالترتيب؛ كل وحدة تخلص بـ«اختبار الوحدة»، وآخر وحدة تخلص
     بـ«اختبار الباب».
   - `lessons` (المكتبة) و`tree` (خريطة الباب كما في الكتاب).
3. **هات مراجع الآيات**: `node scripts/locate-ayah.ts <id> && node scripts/content-notes.ts <id>`
   بيدوّر على كل مثال في نص تنزيل، ويكتب المرشّحين في `CONTENT_NOTES.md` للمراجعة. بعد المراجعة نفس
   الأمر مع `--apply` بعد `<id>`.
4. **سجّل الباب** في `src/content/course.ts`: غيّر `status` من `'soon'` لـ`'ready'`، وزوّد `color`
   و`load: () => import('./modules/<id>/index.ts')`.
5. **افحص**: `npm run validate` لازم يعدّي (الشكل، نص القرآن، الالتباس، كلمات «دوس على الكلمة»،
   الألوان). وبعده `npm run test:unit`.
6. **جرّب**: `npm run dev`، فعّل «وضع المدرّس» من «حسابي»، والعب كل درس في الباب الجديد.
7. **افتح PR** من فرع جديد. الدمج في `main` = نشر للناس، فمحتاج موافقة.

</div>

## In English

A new chapter (باب) is **data only** — no engine or UI change. The engine builds all ten exercise
kinds from the data.

### Hard rules

- Rules and definitions come **only** from Sheikh Jaber's book and lessons — never from memory.
- Quran text comes **only** from `data/quran-uthmani.txt` (Tanzil). Anything not verified stays
  `verified: false` and is **hidden** from exercises.
- Category colours come from the shared palette; **never green or red** (feedback only).

### Steps

1. **Copy** `src/content/modules/_template/` to `src/content/modules/<id>/` (kebab-case id).
2. **Fill the data** (shape and comments are in the template; full example: `modules/madd/`).
   Schema: `src/content/schema.ts`. Contract: `specs/001-madd-v1/contracts/content-module.md`.
3. **Find ayah refs**: `node scripts/locate-ayah.ts <id> && node scripts/content-notes.ts <id>`
   searches Tanzil for every example and writes candidates to `CONTENT_NOTES.md`; after review, run
   it again with `--apply` after `<id>` (the `npm run content:*` scripts are wired to Madd).
4. **Register** in `src/content/course.ts`: `status: 'ready'`, a `color`, and
   `load: () => import('./modules/<id>/index.ts')`.
5. **Check**: `npm run validate` (schema · Tanzil match · ambiguity · spot indexes · colour distance),
   then `npm run test:unit`. `tests/unit/template-module.test.ts` shows a module playing end to end.
6. **Try it**: `npm run dev`, turn on «وضع المدرّس» in «حسابي», play every lesson of the new chapter.
7. **Open a PR** from a new branch. Merging to `main` publishes the site, so it needs the founder's OK.

Book page images: put `<id>.jpg` in `reference/img/` and list the ids in a library lesson's `pages`.
