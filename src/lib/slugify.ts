/**
 * Latin text loses its accents ("Été" → "ete"). Arabic letters stay, since Arabic URLs rank fine,
 * but its vowel marks go. Recomposing first keeps letters like "أ" in one piece.
 */
export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/(\p{Script=Latin})[̀-ͯ]+/gu, '$1')
    .normalize('NFC')
    .replace(/\p{M}/gu, '')
    .replace(/[œ]/g, 'oe')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
