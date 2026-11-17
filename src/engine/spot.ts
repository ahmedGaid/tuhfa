/**
 * «لوّن الحكم» word split (research R7): words = ayah text split on whitespace, dropping tokens that
 * are only ayah-end / pause marks (۝ ۖ ۗ ۘ ۙ ۚ ۛ ۞ ۩). Answer indexes are 0-based into this list.
 * Used by the spot exercise, the validator and the tests — one definition, no off-by-one drift.
 */
const MARK_ONLY = /^[ۖ-ۛ۝۞۩]+$/;

export function spotWords(ayah: string): string[] {
  return ayah.split(/\s+/).filter((w) => w !== '' && !MARK_ONLY.test(w));
}
