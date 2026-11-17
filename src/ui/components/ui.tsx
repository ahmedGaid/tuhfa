/**
 * Small shared pieces of the lesson UI (T033): Button, Sheet, ProgressBar, QuranText, Badge.
 * Tokens only (theme.css); a category colour arrives as the `--cat` custom property.
 */
import type { ButtonHTMLAttributes, ComponentChildren } from 'preact';
import type { ExampleView } from '../../engine/types.ts';
import './ui.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'alt' | 'quiet' };

export function Button({ variant = 'primary', class: cls, ...rest }: ButtonProps) {
  return <button type="button" class={`btn btn--${variant} ${cls ?? ''}`} {...rest} />;
}

/** Floating bottom sheet (the only elevated surface besides dialogs). */
export function Sheet({
  tone,
  label,
  children,
  role = 'region',
}: {
  tone?: 'ok' | 'bad' | undefined;
  label: string;
  children: ComponentChildren;
  role?: 'region' | 'dialog';
}) {
  return (
    <div class="sheet-wrap">
      <section
        class={`sheet${tone ? ` sheet--${tone}` : ''}`}
        role={role}
        aria-label={label}
        aria-modal={role === 'dialog' ? 'true' : undefined}
      >
        {children}
      </section>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const v = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      class="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
    >
      <i style={{ inlineSize: `${v}%` }} />
    </div>
  );
}

/** Quran text from verified data only. A label («اللام في «الٓمٓ»») is shown as is; bare text gets ﴿ ﴾. */
export function QuranText({ example, size = 'md' }: { example: ExampleView; size?: 'md' | 'lg' }) {
  return (
    <span class={`quran quran--${size}`} lang="ar">
      {example.label ?? `﴿${example.quran}﴾`}
    </span>
  );
}

/** Category badge: colour always travels with its icon and name (ag-ui-standard rule 3). */
export function Badge({
  icon,
  text,
  style,
}: {
  icon?: string | undefined;
  text: string;
  style?: Record<string, string>;
}) {
  return (
    <span class="badge" style={style}>
      {icon && (
        <span class="badge__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {text}
    </span>
  );
}
