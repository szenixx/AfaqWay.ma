/* Programme recommendation engine.

   Pure, UI-independent, deterministic. No AI / ML / LLM — only arithmetic and
   filtering over the programme database. Every recommendation comes from the
   dataset; nothing is invented. Results are ranked by a weighted compatibility
   score and the list is NEVER empty: programmes that fail some requirement are
   still returned, ranked lower, each carrying human-readable reasons why they
   are not a perfect match.

   To add or reweight criteria, edit WEIGHTS + the scoreProgram() axes only. */

import type { Program, StudentProfile, MatchReason, Recommendation } from "./types";

// Field of interest is the dominant signal, then degree, then the numeric fits.
export const WEIGHTS = { field: 45, degree: 20, budget: 15, grade: 12, english: 8 } as const;

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const cefrIndex = (lvl: string | null | undefined) => (lvl ? CEFR.indexOf(lvl.toUpperCase()) : -1);
const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-US");
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

// Does the student's English satisfy the programme? Returns null when we simply
// don't have enough info to judge (treated as "no penalty").
const lowerBound = (s: string) => { const m = String(s).match(/\d+/); return m ? Number(m[0]) : null; };

function englishOutcome(p: Program, s: StudentProfile): { fit: number; reason: MatchReason | null } {
  // Duolingo has a concrete numeric minimum in the dataset.
  if (s.hasTest && (s.testType || "").toLowerCase() === "duolingo" && p.duolingo_min != null && s.testScore != null) {
    if (s.testScore >= p.duolingo_min) return { fit: 1, reason: null };
    return { fit: clamp01(s.testScore / p.duolingo_min), reason: { kind: "english", ok: false, text: `Needs Duolingo ${p.duolingo_min}+, you entered ${s.testScore}` } };
  }
  // English Test Core has a numeric requirement (e.g. "400-499") but is not always accepted.
  if (s.hasTest && (s.testType || "").toLowerCase() === "englishcore" && s.testScore != null) {
    const min = lowerBound(p.english_core);
    if (min == null) return { fit: 1, reason: null };
    if (s.testScore >= min) return { fit: 1, reason: null };
    return { fit: clamp01(s.testScore / min), reason: { kind: "english", ok: false, text: `English Core needs ${min}+, you entered ${s.testScore}` } };
  }
  // Otherwise compare CEFR levels (student's self-assessed level vs requirement).
  const need = cefrIndex(p.cefr_min);
  const have = cefrIndex(s.englishLevel);
  if (need < 0 || have < 0) return { fit: 1, reason: null }; // unknown → don't penalise
  if (have >= need) return { fit: 1, reason: null };
  return { fit: clamp01((have + 1) / (need + 1)), reason: { kind: "english", ok: false, text: `Requires English ${p.cefr_min}, your level is ${s.englishLevel}` } };
}

export function scoreProgram(p: Program, s: StudentProfile): Recommendation {
  const reasons: MatchReason[] = [];
  let score = 0;

  // Field of interest (highest priority) — matches any of the student's 1-2 fields.
  const fieldOk = s.fields.length > 0 && s.fields.includes(p.field);
  score += fieldOk ? WEIGHTS.field : 0;
  if (!fieldOk) reasons.push({ kind: "field", ok: false, text: `Different field: ${p.field}${s.fields.length ? ` (you chose ${s.fields.join(", ")})` : ""}` });

  // Degree the student wants to study.
  const degreeOk = !!s.degree && p.degree.toLowerCase() === s.degree.toLowerCase();
  score += degreeOk ? WEIGHTS.degree : 0;
  if (!degreeOk) reasons.push({ kind: "degree", ok: false, text: `This is a ${p.degree}'s programme, you want a ${s.degree}'s` });

  // Tuition within budget.
  if (s.maxBudget == null || p.tuition_eur == null) {
    score += WEIGHTS.budget; // no constraint / unknown → full
  } else if (p.tuition_eur <= s.maxBudget) {
    score += WEIGHTS.budget;
  } else {
    score += WEIGHTS.budget * clamp01(s.maxBudget / p.tuition_eur);
    reasons.push({ kind: "budget", ok: false, text: `Tuition ${eur(p.tuition_eur)}/yr is above your ${eur(s.maxBudget)} budget` });
  }

  // Academic grade meets the programme minimum (min_grade is a 0..1 fraction).
  if (s.grade20 == null || p.min_grade == null) {
    score += WEIGHTS.grade;
  } else {
    const need20 = p.min_grade * 20;
    const have = s.grade20;
    if (have >= need20) score += WEIGHTS.grade;
    else {
      score += WEIGHTS.grade * clamp01(have / need20);
      reasons.push({ kind: "grade", ok: false, text: `Needs grade ≥ ${need20.toFixed(1)}/20, you entered ${have}/20` });
    }
  }

  // English requirement.
  const eng = englishOutcome(p, s);
  score += WEIGHTS.english * eng.fit;
  if (eng.reason) reasons.push(eng.reason);

  return { program: p, score: Math.round(score), perfect: reasons.length === 0, reasons };
}

/** Rank every programme by compatibility. Never returns an empty list. */
export function recommend(profile: StudentProfile, programs: Program[]): Recommendation[] {
  return programs
    .map((p) => scoreProgram(p, profile))
    .sort((a, b) => b.score - a.score || (a.program.tuition_eur ?? 1e9) - (b.program.tuition_eur ?? 1e9));
}

/** "I know the program" — free-text search, each hit still scored vs the profile. */
export function searchPrograms(query: string, profile: StudentProfile, programs: Program[]): Recommendation[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = programs.filter((p) => `${p.name} ${p.university} ${p.field}`.toLowerCase().includes(q));
  return hits.map((p) => scoreProgram(p, profile)).sort((a, b) => b.score - a.score);
}
