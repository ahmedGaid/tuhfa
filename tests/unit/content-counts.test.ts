import { describe, expect, it } from 'vitest';
import { course } from '../../src/content/course.ts';
import madd from '../../src/content/modules/madd/index.ts';
import { ModuleSchema } from '../../src/content/schema.ts';

// SC-003 — the full prototype content made it into the Madd module
describe('Madd content counts', () => {
  const m = ModuleSchema.parse(madd);

  it('parses with the module schema', () => {
    expect(m.id).toBe('madd');
  });
  it('has 21 library lessons, 17 concepts, 57 questions, 10 spot ayat', () => {
    expect(m.lessons).toHaveLength(21);
    expect(m.concepts).toHaveLength(17);
    expect(m.questions).toHaveLength(57);
    expect(m.spot).toHaveLength(10);
  });
  it('has the tree, the ruler, the turuq table, the rank order and the rank card', () => {
    expect(m.tree.t).toBeTruthy();
    expect(m.tree.c?.length).toBeGreaterThan(0);
    expect(m.extras?.ruler?.length).toBeGreaterThan(0);
    expect(m.extras?.turuq?.length).toBeGreaterThan(0);
    expect(m.rank?.length).toBeGreaterThan(1);
    expect(m.extras?.rankCard).toBeDefined();
  });
  it('has 6 units following the book families, ending in a module checkpoint', () => {
    expect(m.units).toHaveLength(6);
    expect(m.units.at(-1)?.lessons.at(-1)?.kind).toBe('module-checkpoint');
    m.units.forEach((u) => expect(u.lessons.at(-1)?.kind).not.toBe('lesson'));
  });
  it('is the one ready module on the course path', () => {
    const ready = course.modules.filter((x) => x.status === 'ready');
    expect(ready.map((x) => x.id)).toEqual(['madd']);
  });
});
