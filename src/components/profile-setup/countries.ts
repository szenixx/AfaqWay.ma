/* Destination grid metadata (Phase A). Country-specific QUESTIONS now live in
   the flow registry (src/lib/onboarding/countryFlows), not here. This file is
   only the selection-card data. `available` mirrors the registry. */

export type CountryCode = "LT" | "HU" | "LV" | "PL";

export type CountryConfig = {
  code: CountryCode;
  name: string;
  available: boolean;
  stripes: string[]; // horizontal tricolor bars, real flag colours (never recoloured)
};

export const COUNTRIES: CountryConfig[] = [
  { code: "LT", name: "Lithuania", available: true, stripes: ["#FDB913", "#006A44", "#C1272D"] },
  { code: "HU", name: "Hungary", available: false, stripes: ["#CD2A3E", "#FFFFFF", "#436F4D"] },
  { code: "LV", name: "Latvia", available: false, stripes: ["#9E3039", "#FFFFFF", "#9E3039"] },
  { code: "PL", name: "Poland", available: false, stripes: ["#FFFFFF", "#DC143C"] },
];

export const countryByCode = (code: string | null | undefined) => COUNTRIES.find((c) => c.code === code) ?? null;
