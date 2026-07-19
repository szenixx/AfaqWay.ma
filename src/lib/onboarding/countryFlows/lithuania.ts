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
              required: true,
              placeholder: "Select an intake",
              options: [
                { value: "Autumn 2027 (September)", label: "Autumn 2027 (September)" },
                { value: "Autumn 2028 (September)", label: "Autumn 2028 (September)" },
              ],
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
              required: true,
              options: [
                { value: "high_school", label: "High school" },
                { value: "bachelor", label: "Bachelor's" },
              ],
            },
            { kind: "select", key: "last_degree_year", label: "Year of last degree", required: true, placeholder: "Select year", options: GRAD_YEARS, row: 1 },
            { kind: "text", key: "last_degree_field", label: "Field of study", required: true, placeholder: "e.g. Economics", row: 1 },
            { kind: "text", key: "last_degree_grade", label: "Grade", hint: "min 10 / 20", required: true, sanitize: "decimal", inputMode: "decimal", numeric: true, min: 10, max: 20, placeholder: "14.5", row: 1 },
            {
              kind: "segmented",
              key: "target_degree",
              label: "What degree do you want to study abroad?",
              required: true,
              options: [
                { value: "bachelor", label: "Bachelor's" },
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
            { kind: "multiselect", key: "field_of_interest", label: "Field of interest", hint: "pick up to 2", required: true, maxSelect: 2, options: FIELD_OPTIONS },
            { kind: "text", key: "max_budget", label: "Max tuition budget", hint: "€ per year, min 2800", required: true, sanitize: "digits", inputMode: "numeric", numeric: true, min: 2800, maxLength: 6, placeholder: "e.g. 4000" },
            { kind: "segmented", key: "has_english_test", label: "Do you have an English test?", required: true, options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
            { kind: "select", key: "english_test_type", label: "Which English test?", required: true, placeholder: "Choose a test", options: ENGLISH_TESTS, showWhen: { field: "has_english_test", equals: "yes" }, row: 2 },
            { kind: "text", key: "english_test_score", label: "Test score", hint: "numbers only", required: true, sanitize: "decimal", inputMode: "decimal", numeric: true, placeholder: "your test score", showWhen: { field: "has_english_test", equals: "yes" }, row: 2 },
            { kind: "select", key: "english_level", label: "Your English speaking level", required: true, placeholder: "Choose a level", options: ENGLISH_LEVELS },
          ],
        },
      ],
    },
    { id: "pricing", stepperLabel: "Pricing", title: "Pricing & Checkout", description: "Pick the level of hand-holding that fits you, then complete your payment.", sections: [], custom: "pricing" },
    { id: "roadmap", stepperLabel: "Roadmap", title: "Your roadmap is ready", description: "Review everything below. Once you click Done, we generate your personalized roadmap.", sections: [], placeholder: "roadmap" },
  ],
};
