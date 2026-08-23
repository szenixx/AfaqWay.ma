/* The onboarding's data layer: the shape of what a student answers, how it is
   read out of and written back into `profiles`, and what counts as valid.

   Extracted from the original wizard so the two onboarding presentations (the
   Talkpal-style journey at /profile-setup and the classic wizard kept at
   /profile-setup/classic) read and write byte-identical rows. Presentation is
   the only thing that differs between them; this file is the contract. */

import { titleCase } from "@/lib/text";
import { countryByCode } from "@/components/profile-setup/countries";
import type { CountryFlow, FieldDef } from "./countryFlows/types";

export type Personal = {
  full_name: string;
  gender: string;
  date_of_birth: string;
  city: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  destination_country: string;
  has_passport: string; // yes | no
};

export const EMPTY_PERSONAL: Personal = {
  full_name: "", gender: "", date_of_birth: "", city: "",
  whatsapp_country_code: "+212", whatsapp_number: "", destination_country: "", has_passport: "",
};

/** country_flow_answers, flattened to strings for the controls to edit. */
export type Cfa = Record<string, Record<string, string>>;

export const str = (v: unknown) => (typeof v === "string" ? v : "");

export function personalFromRow(r: Record<string, unknown>): Personal {
  return {
    full_name: str(r.full_name), gender: str(r.gender), date_of_birth: str(r.date_of_birth), city: str(r.city),
    whatsapp_country_code: str(r.whatsapp_country_code) || "+212", whatsapp_number: str(r.whatsapp_number),
    destination_country: str(r.destination_country), has_passport: str(r.has_passport),
  };
}

export function personalPatch(p: Personal) {
  return {
    full_name: p.full_name || null, gender: p.gender || null, date_of_birth: p.date_of_birth || null, city: p.city || null,
    whatsapp_country_code: p.whatsapp_country_code || null, whatsapp_number: p.whatsapp_number || null,
    destination_country: p.destination_country || null, has_passport: p.has_passport || null,
  };
}

export function cfaFromJson(json: unknown): Cfa {
  const out: Cfa = {};
  if (json && typeof json === "object") {
    for (const [stepId, vals] of Object.entries(json as Record<string, unknown>)) {
      out[stepId] = {};
      if (vals && typeof vals === "object") for (const [k, v] of Object.entries(vals as Record<string, unknown>)) out[stepId][k] = v == null ? "" : String(v);
    }
  }
  return out;
}

export function cfaToJson(flow: CountryFlow | null, cfa: Cfa) {
  if (!flow) return {};
  const out: Record<string, Record<string, string | number>> = {};
  for (const step of flow.steps) {
    const vals = cfa[step.id];
    if (!vals) continue;
    const numericKeys = new Set<string>();
    for (const sec of step.sections) for (const f of sec.fields) if (f.numeric) numericKeys.add(f.key);
    const obj: Record<string, string | number> = {};
    // preserve every stored key (incl. non-field keys like selected_programs)
    for (const [k, v] of Object.entries(vals)) {
      if (v === undefined || v === "") continue;
      obj[k] = numericKeys.has(k) ? Number(v) : v;
    }
    if (Object.keys(obj).length) out[step.id] = obj;
  }
  return out;
}

export const hasCfaData = (cfa: Cfa) => Object.values(cfa).some((s) => Object.values(s).some((v) => v !== ""));

export const validWhatsapp = (n: string) => /^\d{6,15}$/.test(n.replace(/\s/g, ""));

/** The dialling code the Moroccan rules below apply to. */
export const MOROCCO_DIAL = "+212";

/* A Moroccan mobile, written either way a student actually writes it:
   national with the trunk zero (0612345678, ten digits) or international
   without it (612345678, nine digits). Mobile prefixes are 6 and 7; landlines
   (5) are rejected, because this number has to receive WhatsApp. */
export function validMoroccanMobile(n: string): boolean {
  const d = n.replace(/\D/g, "");
  if (d.startsWith("0")) return /^0[67]\d{8}$/.test(d);
  return /^[67]\d{8}$/.test(d);
}

/* The code is deliberately free text so a student living outside Morocco can
   still be reached (see PhoneAnswer), so the strict rules apply only when the
   number IS Moroccan. Any other code keeps the generic length check rather
   than rejecting a perfectly good foreign number. */
export function validWhatsappFor(code: string, n: string): boolean {
  const c = code.replace(/\s/g, "");
  return c === MOROCCO_DIAL || c === "212" ? validMoroccanMobile(n) : validWhatsapp(n);
}

/* Whole years elapsed, counted off the actual calendar rather than a division:
   subtracting the years and then stepping back one if this year's birthday has
   not happened yet is what makes 29 February and end-of-month dates come out
   right. Computed against today every time, never a hardcoded cut-off year. */
export function ageFrom(dob: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim());
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const born = new Date(y, mo - 1, d);
  if (born.getFullYear() !== y || born.getMonth() !== mo - 1 || born.getDate() !== d) return null;
  if (born > today) return null;
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/** The floor the journey enforces: older than 16, so 17 and up. */
export const MIN_AGE = 17;
export const isOldEnough = (dob: string) => {
  const a = ageFrom(dob);
  return a !== null && a >= MIN_AGE;
};

export function validatePersonal(p: Personal): boolean {
  if (!p.full_name.trim() || !p.gender || !p.date_of_birth || !p.city.trim()) return false;
  if (!validWhatsapp(p.whatsapp_number)) return false;
  const c = countryByCode(p.destination_country);
  return !!(c && c.available);
}

export function validateField(f: FieldDef, v: string): boolean {
  if (v === "") return !f.required;
  if (f.pattern && !new RegExp(f.pattern).test(v)) return false;
  if (f.numeric || f.min != null || f.max != null) {
    const n = Number(v);
    if (Number.isNaN(n)) return false;
    if (f.min != null && n < f.min) return false;
    if (f.max != null && n > f.max) return false;
  }
  if ((f.kind === "select" || f.kind === "segmented") && f.options && !f.options.some((o) => o.value === v)) return false;
  return true;
}

export function fieldVisible(f: FieldDef, vals: Record<string, string>): boolean {
  if (!f.showWhen) return true;
  const conds = Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen];
  return conds.every((c) => {
    if (c.equals !== undefined) return vals[c.field] === c.equals;
    if (c.notEmpty) return (vals[c.field] ?? "") !== "";
    if (c.notEquals !== undefined) return vals[c.field] !== c.notEquals;
    return true;
  });
}

/* Everything a student TYPES stays in the Latin alphabet, in both languages.

   These values leave the product: they go onto a passport-matched application,
   a university form and a visa file, all of which are filled in Latin script.
   A name or a city typed in Arabic would have to be transliterated by hand
   later, by someone guessing at the spelling the student actually uses.

   French accents are kept, because Moroccan documents carry them — Benaïssa,
   Fès, Économie. The ranges are Latin-1 Supplement and Latin Extended-A, which
   is where those live; Arabic script falls outside both and is dropped as it
   is typed, including Arabic-Indic digits. */
export const latinOnly = (v: string) => v.replace(/[^A-Za-z\u00C0-\u017F0-9 .,'\u2019\-]/g, "");

export function sanitize(f: Pick<FieldDef, "sanitize" | "maxLength">, raw: string): string {
  let v = raw;
  if (f.sanitize === "digits") v = v.replace(/[^\d]/g, "");
  else if (f.sanitize === "titlecase") v = titleCase(latinOnly(v));
  /* A field with no declared sanitiser is still free text a person types. */
  else if (f.sanitize === undefined) v = latinOnly(v);
  else if (f.sanitize === "decimal") {
    v = v.replace(/,/g, ".").replace(/[^\d.]/g, ""); // phone keyboards often type "," for the decimal point
    const i = v.indexOf(".");
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, ""); // keep only the first "."
  }
  if (f.maxLength) v = v.slice(0, f.maxLength);
  return v;
}
