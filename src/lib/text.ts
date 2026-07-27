/* Shared text formatting.

   Names, cities and degree fields are stored the way they will be printed on a
   university application, so the first letter of every word is capitalized as
   the student types. Only the first letter is touched: "PhD", "McCarthy" and
   "IBM" keep the capitals the student meant. */

/** Word separators that start a new word: whitespace, hyphens and apostrophes. */
const BOUNDARY = /(^|[\s\-'’])(\p{L})/gu;

/**
 * Capitalizes the first letter of every word, leaving the rest untouched.
 * Unicode-aware, so accented and non-Latin scripts behave correctly.
 *
 *   "abderrahmane el amrani" → "Abderrahmane El Amrani"
 *   "computer science"       → "Computer Science"
 *   "PhD in maths"           → "PhD In Maths"
 */
export function titleCase(input: string): string {
  return input.replace(BOUNDARY, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase());
}
