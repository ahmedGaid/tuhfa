# Data Model — Tuhfa v1

Content entities are static (shipped in the bundle, validated at build). Learner entities live in
`localStorage`. Field names are the TypeScript names in `src/content/schema.ts` / `src/state/*`.

## Content

### Course
| Field | Type | Rule |
|---|---|---|
| modules | `ModuleRef[]` | order = path order (Sheikh's order) |

### ModuleRef
| Field | Type | Rule |
|---|---|---|
| id | string | kebab-case, unique |
| title | string | Arabic |
| icon | string | 1–2 chars or icon id |
| color | `{light, dark}` hex | module band colour; never the feedback green/red |
| status | `'ready' \| 'soon'` | `soon` → only title + icon shown |
| load | `() => Promise<Module>` | only for `ready` (lazy chunk per module) |

### Module
| Field | Type | Rule |
|---|---|---|
| id | string | equals ModuleRef.id |
| categories | `Category[]` | 1–8 |
| concepts | `Concept[]` | ids unique within module |
| units | `Unit[]` | ≥1; last unit may be review-only |
| lessons | `Lesson[]` | library text, ordered |
| tree | `TreeNode` | the chapter map as in the book |
| questions | `Question[]` | optional |
| spot | `SpotItem[]` | optional |
| rank | `string[]` | optional; strongest → weakest, used by «رتّب» |
| extras | `{ ruler?, turuq?, pages? }` | optional, rendered by generic components |

### Category
`{ id, name, color:{light,dark}, icon }` — colour from the shared category palette.
Madd: `asli` gold ا · `hamz` purple ء · `sukun` sky ـْ · `manawi` pink ♡.

### Concept
| Field | Type | Rule |
|---|---|---|
| id | string | unique in module |
| category | Category.id | must exist |
| name | string | e.g. «المد المنفصل» |
| rule | string | one line |
| amount | string | مقدار / how applied |
| ruling | `string?` | e.g. واجب / جائز / لازم (closed list per module: `module.rulings`) |
| examples | `Example[]` | ≥1 |
| definition | `[before, blank, after]` | for «كمّل التعريف» |
| distractorGroup | string? | concepts in the same group are confusable (better wrong options) |

### Example
| Field | Type | Rule |
|---|---|---|
| quran | string | exact Mushaf substring (Tanzil Uthmani) |
| label | string? | display wrapper, e.g. «(وقفًا)» |
| note | string | where the rule is and how long |
| ref | `{sura, aya, ayaTo?}?` | required when `verified` |
| verified | boolean | false → hidden from exercises |
| tags | `Concept.id[]` | every concept present in `quran` (ambiguity rule) |

### Unit
`{ id, title, category?, lessons: LessonSpec[] }` — last LessonSpec of each unit is a checkpoint.

### LessonSpec (playable node)
| Field | Type | Rule |
|---|---|---|
| id | string | unique in module |
| title | string | |
| newConcept | Concept.id? | triggers teach card |
| practise | Concept.id[] | pool for mixed items |
| kind | `'lesson' \| 'checkpoint' \| 'module-checkpoint'` | |
| types | ExerciseType[]? | override default mix |
| size | number | 10–15 (default 12) |
| libraryLesson | number? | link to `lessons[i]` |

### Lesson (library text)
`{ title, tag, html, pages: string[] }` — `html` is sanitised at build (allow-list tags) and Quran spans use `<q-t>` marker.

### Question
`{ id, prompt, options[2..4], answer:index, category, explain, example:{quran,note,ref?,verified} }`

### SpotItem
`{ id, unit, concept, ayah, ref, answer:number[], note, expectWords:string[] }`

### TreeNode
`{ t, e?, n?, c?: TreeNode[], hideLevel?: 1|2|3|4 }` — `hideLevel` drives «احفظ الخريطة» levels.

### Extras
- `ruler`: `{ label, fixed, optional, category, tariq:'ش'|'ط'|'both' }[]`
- `turuq`: `{ name, shatibiyya, tayyiba, note }[]`
- `pages`: `string[][]` (page image ids per library lesson)

## Learner state (`tuhfa:v1`)

```text
Progress {
  version: 1
  lessons: { [moduleId/lessonId]: { stars: 1|2|3, best: number /*accuracy 0..1*/, done: ISODate } }
  xp: { total: number, byDay: { [YYYY-MM-DD]: number } }
  streak: { count: number, lastDay: YYYY-MM-DD | null }
  srs: { [moduleId/conceptId]: { box: 1..5, due: YYYY-MM-DD, wrong: number } }
  mistakes: string[]            // moduleId/conceptId, most recent first, unique
  settings: { goal: 20|50|100, sound: boolean, teacher: boolean, theme: 'auto'|'light'|'dark' }
  seenWelcome: boolean
}
```

### State transitions
- **Lesson complete** → stars = max(old, new); xp += earned; byDay[today] += earned; streak update;
  each concept answered: right → box+1 (max 5), due = today + [1,2,4,7,14][box-1]; wrong → box 1,
  due = tomorrow, push to `mistakes`.
- **Streak**: lastDay = today → unchanged; lastDay = yesterday → count+1; else → count = 1.
  Streak shown as 0 if lastDay < yesterday.
- **Mistake cleared**: concept answered right twice in a review session → removed from `mistakes`.
- **Abandoned lesson**: nothing persisted.
- **Migrations**: `migrate[n](state) → state(n+1)`; unknown future version → read-only notice, no write.
