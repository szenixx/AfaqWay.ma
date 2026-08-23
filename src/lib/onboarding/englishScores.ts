/* What each English test can actually report.

   One place, because two things need it and they must not drift: the validator
   that stops an impossible score being saved, and the short note under the
   input that tells a student the range before they type. */

export type ScoreRule = {
  /** The note shown under the input. Kept to one short line. */
  note: string;
  /** True when `n` is a score this test can genuinely report. */
  accepts: (n: number) => boolean;
};

const step = (n: number, of: number) => Math.abs(n / of - Math.round(n / of)) < 1e-9;
const between = (n: number, lo: number, hi: number) => n >= lo && n <= hi;

const RULES: Record<string, ScoreRule> = {
  /* Reported as whole and half bands, so 6.5 is valid and 6.7 is not. */
  IELTS: {
    note: "IELTS bands run 0 to 9, in half steps.",
    accepts: (n) => between(n, 0, 9) && step(n, 0.5),
  },

  /* TOEFL iBT moved to a 1-6 scale in January 2026, in half points. Score
     reports through the transition also carry the familiar 0-120 total, and
     rows already in the database hold that older number, so BOTH are accepted
     rather than invalidating a score a student is reading off a real report. */
  TOEFL: {
    note: "TOEFL runs 1 to 6 in half points. A 0 to 120 total is still accepted.",
    accepts: (n) =>
      (between(n, 1, 6) && step(n, 0.5)) || (between(n, 0, 120) && Number.isInteger(n)),
  },

  /* The Cambridge English Scale spans roughly 80-230 ACROSS the exams; no
     single exam reports the whole of it, so the range is accepted in full and
     the note says which it is rather than implying every value is possible on
     whichever paper the student sat. */
  Cambridge: {
    note: "On the Cambridge English Scale, 80 to 230 depending on the exam.",
    accepts: (n) => between(n, 80, 230) && Number.isInteger(n),
  },

  /* Reported in fives. */
  Duolingo: {
    note: "Duolingo scores run 10 to 160, in steps of 5.",
    accepts: (n) => between(n, 10, 160) && step(n, 5),
  },

  EnglishCore: {
    note: "English Test Core runs 0 to 599.",
    accepts: (n) => between(n, 0, 599) && Number.isInteger(n),
  },
};

/** The rule for a test, or null when the test is unknown or "other". */
export const scoreRule = (test: string): ScoreRule | null => RULES[test] ?? null;

/* An unknown test is not judged: "Other" lets a student name a paper the list
   does not carry, and inventing a range for it would reject a real score. */
export function validScore(test: string, raw: string): boolean {
  const rule = scoreRule(test);
  const n = Number(raw.trim().replace(",", "."));
  if (raw.trim() === "" || Number.isNaN(n)) return false;
  return rule ? rule.accepts(n) : n >= 0;
}
