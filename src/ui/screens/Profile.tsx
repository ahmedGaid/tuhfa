/**
 * «حسابي» tab (T057, US6): facts (XP, streak, lessons), settings, moving progress to another device
 * with an export code (import asks before replacing anything), and a link to «عن تحفة».
 */
import { useState } from 'preact/hooks';
import { today } from '../../state/date.ts';
import { exportCode, importCode, type ImportError } from '../../state/exportCode.ts';
import { progress, replaceProgress } from '../../state/progress.ts';
import { shownStreak } from '../../state/streak.ts';
import { Button, Sheet } from '../components/ui.tsx';
import { num } from '../format.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { Settings } from './Settings.tsx';
import './Settings.css';

export function Profile() {
  const p = progress.value;
  return (
    <div class="me">
      <h1 class="me__title">{t.tabs.me}</h1>

      <section aria-labelledby="me-stats">
        <h2 id="me-stats" class="me__h">
          {t.settings.stats}
        </h2>
        <dl class="me__facts">
          <div>
            <dt>{t.settings.xpTotal}</dt>
            <dd>⭐ {num(p.xp.total)}</dd>
          </div>
          <div>
            <dt>{t.settings.streak}</dt>
            <dd>{num(shownStreak(p.streak, today()))}</dd>
          </div>
          <div>
            <dt>{t.settings.lessonsDone}</dt>
            <dd>{num(Object.keys(p.lessons).length)}</dd>
          </div>
        </dl>
      </section>

      <Settings />
      <DataSection />

      <a class="btn btn--alt me__about" href={href('about')}>
        {t.profile.about}
      </a>
    </div>
  );
}

function DataSection() {
  const [code, setCode] = useState<string | null>(null);
  const [copy, setCopy] = useState<'idle' | 'done' | 'fail'>('idle');
  const [input, setInput] = useState('');
  const [error, setError] = useState<ImportError | null>(null);
  const [pending, setPending] = useState<ReturnType<typeof importCode> | null>(null);
  const [imported, setImported] = useState(false);

  const show = () => {
    setCode(exportCode(progress.peek()));
    setCopy('idle');
  };
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(code!);
      setCopy('done');
    } catch {
      setCopy('fail');
    }
  };
  const check = (e: Event) => {
    e.preventDefault();
    setImported(false);
    const r = importCode(input);
    if (r.ok) {
      setError(null);
      setPending(r);
    } else setError(r.error);
  };
  const confirm = () => {
    if (pending?.ok) replaceProgress(pending.progress);
    setPending(null);
    setInput('');
    setCode(null);
    setImported(true);
  };

  return (
    <section aria-labelledby="me-data" class="me__data">
      <h2 id="me-data" class="me__h">
        {t.profile.data}
      </h2>
      <p class="me__hint">{t.profile.dataHint}</p>
      {code === null ? (
        <Button variant="alt" onClick={show}>
          {t.profile.exportShow}
        </Button>
      ) : (
        <div class="me__code">
          <textarea
            readOnly
            dir="ltr"
            rows={4}
            aria-label={t.profile.exportShow}
            value={code}
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button variant="alt" onClick={doCopy}>
            {copy === 'done' ? t.profile.copied : t.profile.copy}
          </Button>
          {copy === 'fail' && (
            <p class="me__hint" role="status">
              {t.profile.copyFail}
            </p>
          )}
        </div>
      )}

      <form class="me__import" onSubmit={check}>
        <label for="me-import" class="me__label">
          {t.profile.importTitle}
        </label>
        <textarea
          id="me-import"
          dir="ltr"
          rows={3}
          placeholder={t.profile.importLabel}
          value={input}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'me-import-err' : undefined}
          onInput={(e) => {
            setInput(e.currentTarget.value);
            setError(null);
          }}
        />
        {error && (
          <p id="me-import-err" class="me__error" role="alert">
            {t.profile.errors[error]}
          </p>
        )}
        {imported && (
          <p class="me__hint" role="status">
            {t.profile.imported}
          </p>
        )}
        <Button type="submit" variant="alt" disabled={!input.trim()}>
          {t.profile.importBtn}
        </Button>
      </form>

      {pending && (
        <div class="scrim">
          <Sheet role="dialog" label={t.profile.confirmTitle}>
            <h2 class="me__confirm-title">{t.profile.confirmTitle}</h2>
            <p>{t.profile.confirmBody}</p>
            <div class="me__confirm-actions">
              <Button variant="alt" onClick={() => setPending(null)} autoFocus>
                {t.profile.confirmNo}
              </Button>
              <Button onClick={confirm}>{t.profile.confirmYes}</Button>
            </div>
          </Sheet>
        </div>
      )}
    </section>
  );
}
