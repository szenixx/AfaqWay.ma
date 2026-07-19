/* Shared types for the per-country onboarding flow engine.
   Phase A (personal details + destination) is universal and lives in the wizard.
   Phase B (everything after a country is picked) is defined here, one file per
   country. Adding a country = add one file + one registry line, never touch the wizard. */

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  kind: "text" | "select" | "segmented" | "multiselect";
  key: string; // stored at country_flow_answers[stepId][key]
  label: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  options?: FieldOption[]; // select | segmented | multiselect
  maxSelect?: number; // multiselect: max choices (value stored pipe-joined)
  inputMode?: "text" | "numeric" | "decimal";
  sanitize?: "digits" | "decimal"; // strip disallowed chars as the user types
  maxLength?: number;
  pattern?: string; // regex source; value must match to be valid
  numeric?: boolean; // persist as a JSON number (else string)
  min?: number;
  max?: number; // numeric range validation
  row?: number; // consecutive fields sharing a row render side by side
  // generic cross-field rules (interpreted by the wizard, keeps it country-agnostic)
  disableOptionWhen?: { field: string; equals: string; option: string; note?: string };
  forceValueWhen?: { field: string; equals: string; value: string };
  showWhen?: { field: string; equals: string }; // render + validate only when condition holds
}

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
