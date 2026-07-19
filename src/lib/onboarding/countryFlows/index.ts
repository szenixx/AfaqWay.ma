import type { CountryFlow } from "./types";
import { lithuaniaFlow } from "./lithuania";

/* Country flow registry. To launch a country, add its flow file and one line
   here. Countries with no flow yet stay null (their card is greyed out and
   unselectable in Phase A, so no flow is ever looked up for them). */
export const COUNTRY_FLOWS: Record<string, CountryFlow | null> = {
  LT: lithuaniaFlow,
  HU: null, // Hungary — coming soon (add hungary.ts + set here)
  LV: null, // Latvia — coming soon
  PL: null, // Poland — coming soon
};

export function getCountryFlow(code: string | null | undefined): CountryFlow | null {
  if (!code) return null;
  return COUNTRY_FLOWS[code] ?? null;
}

export type { CountryFlow, CountryFlowStep, FieldDef, FieldSection, FieldOption } from "./types";
