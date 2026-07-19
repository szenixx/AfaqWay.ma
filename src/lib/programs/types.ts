/* Programme recommendation engine — shared types. Pure data, no UI, no AI. */

export interface Program {
  id: number;
  degree: string; // "Bachelor" | "Master"
  field: string;
  name: string;
  intake: string;
  study_period: string;
  university: string;
  tuition_eur: number | null;
  duolingo_min: number | null;
  cefr_min: string | null; // A1..C2
  english_core: string;
  min_grade: number | null; // 0..1 fraction of the max grade
  url: string;
  deadline: string;
  app_fee_eur: number | null;
}

export interface StudentProfile {
  degree: string; // Bachelor | Master (from step 1 target degree)
  fields: string[]; // 1-2 fields of interest
  maxBudget: number | null; // € / year
  grade20: number | null; // student grade out of 20 (from step 1)
  englishLevel: string | null; // self-assessed CEFR A1..C2
  hasTest: boolean;
  testType: string | null; // Duolingo | IELTS | TOEFL | Cambridge
  testScore: number | null;
}

// One criterion outcome, used both for scoring and for the "why not a perfect
// match" explanations the UI shows.
export interface MatchReason {
  kind: "field" | "degree" | "budget" | "grade" | "english";
  ok: boolean;
  text: string;
}

export interface Recommendation {
  program: Program;
  score: number; // 0..100
  perfect: boolean; // every criterion met
  reasons: MatchReason[]; // failing criteria only (why it's not perfect)
}
