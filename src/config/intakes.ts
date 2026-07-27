/* Every intake the platform offers, defined once.

   Any selector that asks a student when they want to start reads this list, so
   adding a future intake is a one-line change here. Order is chronological, the
   soonest intake first, and that order is what every selector shows.

   Arabic labels ship with the data so the intake list is ready the moment the
   language switcher is wired to real translations. */

export type Intake = {
  /** Stored in the database, and in profiles.intake_term. Do not reword. */
  value: string;
  label: string;
  labelAr: string;
  year: number;
};

export const INTAKES: Intake[] = [
  { value: "Autumn 2027 (September)", label: "Autumn 2027 (September)", labelAr: "خريف 2027 (سبتمبر)", year: 2027 },
  { value: "Autumn 2028 (September)", label: "Autumn 2028 (September)", labelAr: "خريف 2028 (سبتمبر)", year: 2028 },
  { value: "Autumn 2029 (September)", label: "Autumn 2029 (September)", labelAr: "خريف 2029 (سبتمبر)", year: 2029 },
];

/** Options for a Select control, in chronological order. */
export const INTAKE_OPTIONS = INTAKES.map((i) => ({ value: i.value, label: i.label }));

export const intakeByValue = (v: string | null | undefined) => INTAKES.find((i) => i.value === v) ?? null;
