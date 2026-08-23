import { INTAKE_OPTIONS } from "@/config/intakes";
import type { CountryFlow } from "./types";
import { FIELD_OPTIONS, ENGLISH_LEVELS, ENGLISH_TESTS } from "@/lib/programs/catalog";

// Graduation years from 2019 up to the current year (newest first).
const GRAD_YEARS = Array.from({ length: new Date().getFullYear() - 2019 + 1 }, (_, i) => { const y = String(new Date().getFullYear() - i); return { value: y, label: y }; });

/* Lithuania's full Phase-B flow. Content relocated verbatim from the original
   wizard (intake select + education fields + step 2/3/4 placeholders). Field
   labels, options, and validation rules are unchanged from the first build. */
export const lithuaniaFlow: CountryFlow = {
  countryCode: "LT",
  available: true,
  steps: [
    {
      id: "timing_education",
      stepperLabel: "Studies",
      title: "Your studies and timing",
      description: "Your last degree and when you'd like to start, so we can match programs to you.",
      sections: [
        {
          eyebrow: "Your timing",
          sectionTitle: "When you want to start",
          fields: [
            {
              kind: "select",
              key: "intake_term",
              label: "When do you want to start?",
              question: "When do you want to start?",
              emoji: "calendar",
              required: true,
              placeholder: "Select an intake",
              options: INTAKE_OPTIONS,
            },
          ],
        },
        {
          eyebrow: "Your education",
          sectionTitle: "What you've done and what's next",
          fields: [
            {
              kind: "segmented",
              key: "last_degree",
              label: "What is your last degree?",
              question: "What is your last degree?",
              emoji: "school",
              required: true,
              options: [
                { value: "high_school", label: "High school - Baccalauréat" },
                { value: "bachelor", label: "Bachelor's - Licence" },
              ],
            },
            { kind: "select", key: "last_degree_year", label: "Year of last degree", question: "Which year did you finish it?", emoji: "calendar", required: true, placeholder: "Select year", options: GRAD_YEARS, row: 1 },
            { kind: "text", key: "last_degree_field", label: "Field of study", question: "What did you study?", subtitle: "The subject written on your diploma.", emoji: "books", required: true, sanitize: "titlecase", placeholder: "e.g. Economics", row: 1 },
            { kind: "text", key: "last_degree_grade", label: "Grade", question: "What was your final grade?", subtitle: "Out of 20. You need at least 10 to apply.", emoji: "hundred", hint: "min 10 / 20", required: true, sanitize: "decimal", inputMode: "decimal", numeric: true, min: 10, max: 20, placeholder: "14.5", row: 1 },
            {
              kind: "segmented",
              key: "target_degree",
              label: "What degree do you want to study abroad?",
              question: "What do you want to study abroad?",
              emoji: "target",
              required: true,
              options: [
                { value: "bachelor", label: "Bachelor's - Licence" },
                { value: "master", label: "Master's" },
              ],
              disableOptionWhen: { field: "last_degree", equals: "high_school", option: "master", note: "Master's requires a completed Bachelor's degree." },
              forceValueWhen: { field: "last_degree", equals: "high_school", value: "bachelor" },
            },
          ],
        },
      ],
    },
    {
      id: "program_setup",
      stepperLabel: "Program",
      title: "Set up your program profile",
      description: "Tell us what you're looking for, and we'll match you to real Lithuanian programs from our database.",
      custom: "program",
      sections: [
        {
          eyebrow: "What you're looking for",
          sectionTitle: "Your program preferences",
          fields: [
            { kind: "multiselect", key: "field_of_interest", label: "Field of interest", question: "Which fields interest you?", subtitle: "Pick up to 2. We rank real programmes against them.", emoji: "compass", hint: "pick up to 2", required: true, maxSelect: 2, options: FIELD_OPTIONS },
            { kind: "text", key: "max_budget", label: "Max tuition budget", question: "What is your yearly tuition budget?", subtitle: "In euros per year. Programmes start from around 2,800 €, with an average of around 4,500 €.", footnote: "The lowest tuition we can match you to is 2,800 € per year.", emoji: "euro", hint: "€ per year, min 2800", required: true, sanitize: "digits", inputMode: "numeric", numeric: true, min: 2800, maxLength: 6, placeholder: "recommended 4500+ €" },
            /* Desktop: `row: 1` puts these two side by side (.af-row-2 is a
               2-column grid — see groupFields() in page.tsx, which only pairs
               fields that are *adjacent* in this array, so english_level had
               to move up next to has_english_test rather than stay after the
               conditional test-detail fields). .af-row-2 collapses to a
               single column under 860px, same as every other paired row. */
            { kind: "segmented", key: "has_english_test", label: "Do you have an English test?", question: "Do you already have an English test?", emoji: "memo", required: true, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }], row: 1 },
            { kind: "select", key: "english_test_type", label: "Which English test?", question: "Which test did you take?", emoji: "memo", required: true, placeholder: "Choose a test", options: [...ENGLISH_TESTS, { value: "other", label: "Other" }], phoneColumns: 2, showWhen: { field: "has_english_test", equals: "yes" }, row: 1 },
            /* "Other" is a real answer, so it asks which test rather than
               leaving the file saying nothing more than "other". Its score is
               not asked: an unknown test has no scale we can compare. */
            { kind: "text", key: "english_test_other", label: "Test name", question: "Which test is it?", emoji: "memo", required: true, sanitize: "titlecase", maxLength: 60, placeholder: "e.g. PTE Academic", showWhen: [{ field: "has_english_test", equals: "yes" }, { field: "english_test_type", equals: "other" }] },
            { kind: "text", key: "english_test_score", label: "Test score", question: "What score did you get?", subtitle: "Numbers only, exactly as it appears on your certificate.", emoji: "hundred", hint: "numbers only", required: true, sanitize: "decimal", inputMode: "decimal", numeric: true, placeholder: "your test score", showWhen: [{ field: "has_english_test", equals: "yes" }, { field: "english_test_type", notEmpty: true }, { field: "english_test_type", notEquals: "other" }], row: 2 },
            { kind: "select", key: "english_level", label: "Your English speaking level", question: "How well do you speak English?", emoji: "speaking", scale: true, required: true, placeholder: "Choose a level", options: ENGLISH_LEVELS, row: 2 },
          ],
        },
      ],
    },
    { id: "pricing", stepperLabel: "Pricing", title: "Pricing & Checkout", description: "Pick the level of hand-holding that fits you, then complete your payment.", sections: [], custom: "pricing" },
    { id: "roadmap", stepperLabel: "Roadmap", title: "Your roadmap is ready", description: "Review everything below. Once you click Done, we generate your personalized roadmap.", sections: [], placeholder: "roadmap" },
  ],
};
