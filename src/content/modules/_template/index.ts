/**
 * TEMPLATE for a new باب (chapter). Copy this folder to `src/content/modules/<id>/`, replace every
 * value, then register it in `src/content/course.ts` (status 'ready', load: () => import(...)).
 * `npm run validate` checks it. Contract: specs/001-madd-v1/contracts/content-module.md.
 *
 * Rules (constitution I):
 * - Rules, definitions and wording come from the Sheikh's book / lessons — never from memory.
 * - Quran text is copied from data/quran-uthmani.txt (Tanzil). Use `npm run content:locate` to get
 *   refs; until an example is verified it stays hidden from exercises.
 * - Data only: no functions, no imports except types from schema.ts. Big modules split into
 *   categories.ts, concepts.ts, units.ts, lessons.ts, tree.ts, questions.ts, spot.ts, extras.ts.
 *
 * Everything below is PLACEHOLDER text that only shows the shape.
 */
import type { Module } from '../../schema.ts';

const template: Module = {
  id: 'template', // kebab-case, equals the ModuleRef id in course.ts
  title: 'اسم الباب',
  rulings: ['حكم ١', 'حكم ٢'], // closed list used by concept.ruling and «الحكم» items (optional)
  // Wording of generated exercises. Placeholders: {name} {amount} {ruling} {title} {value}
  prompts: {
    classify: 'أنهي حكم في الكلمة دي؟',
    amount: '{name} مقداره إيه؟',
    ruling: 'حكم {name} إيه؟',
    rulingExplain: 'شرح قصير للأحكام',
    tfAmount: '{name} مقداره: {value}',
    tfConcept: 'الحكم في الكلمة دي: {value}',
    fill: 'كمّل تعريف {name}:',
    match: 'وصّل كل حكم بمثاله',
    order: 'رتّب من الأقوى للأضعف',
    spot: 'دوس على كل كلمة فيها: {title}',
  },
  // Rule families. Colour = a pair from the shared category palette (never green/red, ΔE ≥ 15).
  categories: [{ id: 'family-a', name: 'عائلة أ', icon: 'أ', color: { light: '#0a7ea8', dark: '#5cc6ea' } }],
  concepts: [
    {
      id: 'rule-a',
      category: 'family-a',
      name: 'اسم القاعدة',
      rule: 'القاعدة في سطر واحد كما في الكتاب.',
      amount: 'المقدار أو طريقة التطبيق',
      ruling: 'حكم ١',
      examples: [
        {
          quran: 'ٱلْحَمْدُ لِلَّهِ', // exact Tanzil substring
          label: 'ٱلْحَمْدُ لِلَّهِ (مثال)', // optional display wrapper; omit when not needed
          note: 'فين القاعدة في المثال',
          ref: { sura: 1, aya: 2 },
          verified: true, // only after verify passes (npm run validate)
          tags: ['rule-a'], // EVERY concept present in the example (ambiguity rule)
        },
      ],
      definition: ['أول التعريف ', 'الكلمة الناقصة', ' آخر التعريف'], // for «كمّل التعريف»
    },
  ],
  units: [
    {
      id: 'unit-a',
      title: 'عائلة أ',
      category: 'family-a',
      lessons: [
        { id: 'unit-a-1', title: 'اسم القاعدة', newConcept: 'rule-a', practise: ['rule-a'], kind: 'lesson' },
        // every unit ends with a checkpoint; the last unit ends with the module checkpoint
        { id: 'final', title: 'اختبار الباب', practise: ['rule-a'], kind: 'module-checkpoint', size: 15 },
      ],
    },
  ],
  // Library text. Quran spans as <q-t>…</q-t>. `pages` = image ids in public/pages/.
  lessons: [{ title: 'عنوان الدرس', tag: 'وسم', category: 'family-a', html: '<p>شرح الدرس.</p>', pages: [] }],
  // The chapter map as drawn in the book. hideAt: «احفظ الخريطة» levels that blank this name.
  tree: {
    t: 'اسم الباب',
    c: [{ t: 'عائلة أ', category: 'family-a', hideAt: [1], c: [{ t: 'اسم القاعدة', hideAt: [2] }] }],
  },
  // Optional: questions, spot, rank, extras (ruler, turuq, rankCard) — see modules/madd for full examples.
};

export default template;
