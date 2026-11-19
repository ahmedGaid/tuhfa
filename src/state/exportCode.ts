/**
 * Progress export code (contract progress-storage.md, US6):
 *   `TUHFA1.` + base64url(UTF-8 JSON of Progress) + `.` + 4-char FNV-1a checksum (base36).
 * Import never touches state: it returns the parsed Progress or the reason it was rejected.
 */
import { migrate } from './storage.ts';
import { ProgressSchema, VERSION, type Progress } from './schema.ts';

export const PREFIX = 'TUHFA1.';

export type ImportError = 'prefix' | 'checksum' | 'future' | 'schema';
export type ImportResult = { ok: true; progress: Progress } | { ok: false; error: ImportError };

/** FNV-1a 32-bit → 4 base36 chars. */
export function checksum(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return (h % 36 ** 4).toString(36).padStart(4, '0');
}

function toBase64Url(text: string): string {
  let bin = '';
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function exportCode(p: Progress): string {
  const payload = toBase64Url(JSON.stringify(p));
  return `${PREFIX}${payload}.${checksum(payload)}`;
}

export function importCode(raw: string): ImportResult {
  // people paste with spaces / line breaks from chat apps
  const code = raw.replace(/\s+/g, '');
  if (!code.startsWith(PREFIX)) return { ok: false, error: 'prefix' };
  const body = code.slice(PREFIX.length);
  const dot = body.lastIndexOf('.');
  if (dot <= 0) return { ok: false, error: 'checksum' };
  const payload = body.slice(0, dot);
  if (!/^[\w-]+$/.test(payload) || checksum(payload) !== body.slice(dot + 1))
    return { ok: false, error: 'checksum' };

  let data: unknown;
  try {
    data = JSON.parse(fromBase64Url(payload));
  } catch {
    return { ok: false, error: 'schema' };
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { ok: false, error: 'schema' };
  const version = (data as { version?: unknown }).version;
  if (typeof version === 'number' && version > VERSION) return { ok: false, error: 'future' };
  const parsed = ProgressSchema.safeParse(migrate(data as Record<string, unknown>));
  return parsed.success ? { ok: true, progress: parsed.data } : { ok: false, error: 'schema' };
}
