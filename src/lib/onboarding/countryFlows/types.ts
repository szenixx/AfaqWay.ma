/* Shared types for the per-country onboarding flow engine.
   Phase A (personal details + destination) is universal and lives in the wizard.
   Phase B (everything after a country is picked) is defined here, one file per
   country. Adding a country = add one file + one registry line, never touch the wizard. */

export interface FieldOption {
  value: string;
  label: string;
  /* Both are for the one-question-per-screen onboarding, which renders an
     option as a row: `emoji` is a key of src/lib/onboarding/emojiMap.json,
     `sub` a second line under the label. The classic wizard reads neither. */
  emoji?: string;
  sub?: string;
}

export interface FieldDef {
  kind: "text" | "select" | "segmented" | "multiselect";
  key: string; // stored at country_flow_answers[stepId][key]
  label: string;
  /* The one-question-per-screen onboarding (/profile-setup) shows a field on a
     screen of its own, so it needs the label phrased as a spoken question and
     an iOS emoji to carry it. Both are optional: the classic wizard
     (/profile-setup/classic) ignores them, and a field without them falls back
     to `label` and a default emoji. `emoji` is a key of
     src/lib/onboarding/emojiMap.json. */
  question?: string;
  subtitle?: string;
  /** Fine print rendered under the control, not under the question. */
  footnote?: string;
  emoji?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[]; // select | segmented | multiselect
  maxSelect?: number; // multiselect: max choices (value stored pipe-joined)
  scale?: boolean;    // options are an ordered scale: each one shows a level meter
  inputMode?: "text" | "numeric" | "decimal";
  sanitize?: "digits" | "decimal" | "titlecase"; // reshape the value as the user types
  maxLength?: number;
  pattern?: string; // regex source; value must match to be valid
  numeric?: boolean; // persist as a JSON number (else string)
  min?: number;
  max?: number; // numeric range validation
  row?: number; // consecutive fields sharing a row render side by side
  // generic cross-field rules (interpreted by the wizard, keeps it country-agnostic)
  disableOptionWhen?: { field: string; equals: string; option: string; note?: string };
  forceValueWhen?: { field: string; equals: string; value: string };
  // render + validate only when condition(s) hold; an array means ALL must hold
  showWhen?: ShowCond | ShowCond[];
}

/* `notEmpty` exists because `notEquals` alone answers "yes" for a field nobody
   has filled in yet: "" is not "other", so a rule guarding on notEquals would
   reveal its field before its trigger had been answered at all. */
export type ShowCond = { field: string; equals?: string; notEquals?: string; notEmpty?: boolean };

export interface FieldSection {
  eyebrow: string;
  sectionTitle: string;
  fields: FieldDef[];
}

export type StepPlaceholder = "program" | "pricing" | "roadmap";

export interface CountryFlowStep {
  id: string; // 'timing_education' | 'program_setup' | 'pricing' | 'roadmap'
  stepperLabel: string; // short label for the stepper / step list
  title: string;
  description: string;
  sections: FieldSection[]; // empty for a placeholder step
  placeholder?: StepPlaceholder; // when set, the wizard renders the built-in placeholder body
  custom?: "program" | "pricing"; // when set, the wizard renders bespoke UI
}

export interface CountryFlow {
  countryCode: string;
  available: boolean;
  steps: CountryFlowStep[];
}
