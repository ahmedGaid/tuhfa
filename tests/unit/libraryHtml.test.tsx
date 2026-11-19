import { render } from 'preact';
import { describe, expect, it } from 'vitest';
import { lessons } from '../../src/content/modules/madd/lessons.ts';
import { renderLibraryHtml } from '../../src/ui/libraryHtml.tsx';

function html(src: string, slots = {}) {
  const root = document.createElement('div');
  render(<>{renderLibraryHtml(src, slots)}</>, root);
  return root;
}

describe('library html (allow-list)', () => {
  it('keeps allowed tags and classes, Quran spans become Quran text', () => {
    const r = html('<p class="tip">قال <q-t>قَالَ</q-t> <b>حركتين</b></p>');
    expect(r.innerHTML).toBe(
      '<p class="lib__tip">قال <span class="quran lib__q" lang="ar">قَالَ</span> <b>حركتين</b></p>',
    );
  });

  it('drops scripts, handlers, links and unknown attributes, keeping text', () => {
    const r = html(
      '<p onclick="x()" style="color:red">a<script>alert(1)</script><a href="javascript:x">b</a><img src=x onerror=alert(1)></p>',
    );
    expect(r.innerHTML).toBe('<p>ab</p>');
  });

  it('swaps the tree placeholder for the slot and drops the prototype action button', () => {
    const r = html(
      '<div class="mapwrap" data-mode="read"></div><div class="act"><button id="toMap">x</button></div>',
      {
        tree: () => <i>tree</i>,
      },
    );
    expect(r.innerHTML).toBe('<div><i>tree</i></div>');
  });

  it('renders every Madd library lesson without leftovers', () => {
    for (const l of lessons) {
      const r = html(l.html, { tree: () => <i /> });
      expect(r.querySelector('script,button,[onclick],[style],q-t')).toBeNull();
      expect(r.textContent!.length).toBeGreaterThan(20);
    }
  });
});
