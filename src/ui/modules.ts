/** Loads and parses a ready module once (lazy chunk per module). UI-side: the engine never imports content. */
import { course } from '../content/course.ts';
import { ModuleSchema, type ParsedModule } from '../content/schema.ts';
import type { ParsedLessonSpec } from '../engine/session.ts';

const cache = new Map<string, Promise<ParsedModule | null>>();

export function loadModule(id: string): Promise<ParsedModule | null> {
  let p = cache.get(id);
  if (!p) {
    const ref = course.modules.find((m) => m.id === id);
    p =
      ref?.status === 'ready' ? ref.load().then((m) => ModuleSchema.parse(m.default)) : Promise.resolve(null);
    cache.set(id, p);
  }
  return p;
}

export const lessonsOf = (m: ParsedModule): ParsedLessonSpec[] => m.units.flatMap((u) => u.lessons);

/** Inline custom property for a category colour pair (`--cat`), from the module's data. */
export function catStyle(m: ParsedModule, categoryId: string | undefined): Record<string, string> {
  const c = categoryId ? m.categories.find((x) => x.id === categoryId) : undefined;
  return c ? { '--cat': `light-dark(${c.color.light}, ${c.color.dark})` } : {};
}

export const firstLessonHref = '#/lesson/madd/asli-1';
