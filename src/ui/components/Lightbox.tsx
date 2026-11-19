/**
 * Book page viewer (T052): a modal <dialog> (focus stays inside, Esc closes), zoom toggle, and the
 * image scrolls (and pinch-zooms on phones) inside its own box.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '../strings.ar.ts';
import './Lightbox.css';

export function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal?.();
    const back = document.activeElement as HTMLElement | null;
    return () => back?.focus?.();
  }, []);

  return (
    <dialog
      ref={ref}
      class={`lb${zoomed ? ' lb--zoom' : ''}`}
      aria-label={t.library.viewer}
      onClose={onClose}
    >
      <div class="lb__bar">
        <button type="button" class="lb__btn" onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed}>
          {t.library.zoom}
        </button>
        <button type="button" class="lb__btn" onClick={() => ref.current?.close()} autoFocus>
          ✕ {t.library.close}
        </button>
      </div>
      <div class="lb__scroll">
        <img src={src} alt={alt} onClick={() => setZoomed((z) => !z)} />
      </div>
    </dialog>
  );
}
