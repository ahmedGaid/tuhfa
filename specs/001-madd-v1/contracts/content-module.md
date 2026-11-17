# Contract: Content module folder

Every playable module is a folder `src/content/modules/<id>/` whose `index.ts` default-exports a
value that parses with `ModuleSchema` (`src/content/schema.ts`). Shapes: see [data-model.md](../data-model.md).

## Files (convention, not enforced)
`index.ts` (assembles) · `categories.ts` · `concepts.ts` · `units.ts` · `lessons.ts` · `tree.ts` ·
`questions.ts` · `spot.ts` · optional `extras.ts`.

## Registration
Add one `ModuleRef` to `src/content/course.ts` with `status: 'ready'` and
`load: () => import('./modules/<id>')`.

## `npm run validate` guarantees (CI-blocking)
1. Schema parse succeeds (ids unique, references resolve, colours valid hex, 2–4 options, answer
   index in range, `definition` has exactly 3 parts with non-empty blank).
2. Every `verified:true` Example/Question example/SpotItem ayah matches Tanzil (research R3).
3. Ambiguity: no Example used for concept X carries another tag that a «صنّف»/«صح ولا غلط» item for X
   could offer (research R6).
4. Spot: every `answer` index exists and `words[i]` equals `expectWords[k]` (research R7).
5. Every concept has ≥ 2 verified examples **or** is listed under "thin concepts" in `CONTENT_NOTES.md`
   (warning, not failure).
6. Category colours are not within ΔE 15 of the feedback green/red tokens.

## Must NOT
- Contain code other than data literals and imports of types/helpers from `schema.ts`.
- Be imported by anything under `src/engine/**` (lint rule).
