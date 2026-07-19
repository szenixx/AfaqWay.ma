/* Loads the Lithuania programme dataset and derives the dropdown vocabularies
   straight from it (single source of truth — no hand-kept parallel lists). */

import raw from "./programs.lithuania.json";
import type { Program } from "./types";

export const PROGRAMS = raw as Program[];

// Field-of-interest options come from the data, so they can never drift from it.
export const FIELD_OPTIONS = Array.from(new Set(PROGRAMS.map((p) => p.field)))
  .filter(Boolean)
  .sort()
  .map((f) => ({ value: f, label: f }));

export const ENGLISH_LEVELS = [
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Proficient" },
];

export const ENGLISH_TESTS = [
  { value: "Duolingo", label: "Duolingo English Test" },
  { value: "IELTS", label: "IELTS" },
  { value: "TOEFL", label: "TOEFL" },
  { value: "Cambridge", label: "Cambridge (FCE/CAE)" },
  { value: "EnglishCore", label: "English Test Core" },
];
