/* University logo service.

   Logos are supplied as files under public/assets/universities/<slug>/logo.*
   and indexed into manifest.json by scripts/index-university-assets.mjs (which
   runs automatically before dev and build). The app imports that manifest
   statically, so lookups are instant, nothing is fetched at render time, and
   adding a file is the only step needed for it to appear everywhere.

   Nothing here generates or substitutes a logo: a university with no file
   simply has none, and the component shows its loading surface instead. */

import manifest from "../../public/assets/universities/manifest.json";
import { UNIVERSITIES, findUniversity, type University } from "./universities";

export type UniversityLogos = { logo: string | null; logoDark: string | null };

const EMPTY: UniversityLogos = { logo: null, logoDark: null };

type Manifest = { universities?: Record<string, Partial<UniversityLogos>>; indexedAt?: string };
const M = manifest as Manifest;

/** The logo files supplied for one university, by slug. */
export function assetsFor(slug: string | null | undefined): UniversityLogos {
  if (!slug) return EMPTY;
  const raw = M.universities?.[slug];
  return raw ? { ...EMPTY, ...raw } : EMPTY;
}

/** The logo, preferring the dark-surface variant when one was supplied. */
export function logoPath(slug: string | null | undefined, onDark = false): string | null {
  const a = assetsFor(slug);
  return (onDark && a.logoDark) || a.logo;
}

export const hasLogo = (slug: string | null | undefined) => !!logoPath(slug);

/** Resolves a university and its logo from any stored name. */
export function universityLogo(name: string | null | undefined): { university: University | null } & UniversityLogos {
  const university = findUniversity(name);
  return { university, ...assetsFor(university?.slug) };
}

/** Which universities are still waiting for a logo file. */
export const missingLogos = () => UNIVERSITIES.filter((u) => !logoPath(u.slug)).map((u) => u.slug);
