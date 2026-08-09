/* Locale scaffolding for email.
 *
 * Only English is fully translated today — the rest exist so a template
 * never has to change shape when a language is filled in later, only its
 * dictionary. getDictionary() merges a locale's partial dictionary over the
 * English base, so a half-translated locale still renders complete: every
 * missing key silently falls back to English rather than showing blank.
 *
 * Arabic is RTL. The dictionary mechanism doesn't solve that by itself —
 * table-based RTL email layout is a real, separate effort (mirrored columns,
 * dir="rtl" on the outer table, text-align flips throughout every shared
 * component). Flagged here rather than silently ignored: en/fr/de components
 * do not attempt to lay out correctly under `dir="rtl"` yet. */

export const LOCALES = ["en", "fr", "ar", "de"] as const;
export type Locale = typeof LOCALES[number];
export const DEFAULT_LOCALE: Locale = "en";
export const RTL_LOCALES: readonly Locale[] = ["ar"];
export const isRtl = (locale: Locale) => RTL_LOCALES.includes(locale);

export type EmailDictionary = {
  tagline: string;
  footerPlatform: string;
  footerSupport: string;
  footerPrivacy: string;
  footerTerms: string;
  footerRights: string;
  viewInBrowser: string;
  ignoreIfNotYou: string;
};

import { en } from "./en";
import { fr } from "./fr";
import { ar } from "./ar";
import { de } from "./de";

const DICTIONARIES: Record<Locale, Partial<EmailDictionary>> = { en, fr, ar, de };

/** Always returns a complete dictionary — missing keys fall back to English. */
export function getDictionary(locale: Locale): EmailDictionary {
  return { ...en, ...DICTIONARIES[locale] };
}
