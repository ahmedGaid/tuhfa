import { describe, expect, it } from 'vitest';
import { parseHash, href } from '../../src/ui/router';

describe('hash router', () => {
  it('defaults to the path tab', () => {
    expect(parseHash('')).toEqual({ name: 'path', params: [] });
    expect(parseHash('#/')).toEqual({ name: 'path', params: [] });
  });

  it('splits name and params and ignores a trailing slash', () => {
    expect(parseHash('#/lesson/madd/l1/')).toEqual({ name: 'lesson', params: ['madd', 'l1'] });
  });

  it('round-trips Arabic params', () => {
    const h = href('library', 'المد');
    expect(parseHash(h)).toEqual({ name: 'library', params: ['المد'] });
  });
});
