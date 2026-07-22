/* Derives the student's Study Application + Personal Academic Information from
   their onboarding answers (country_flow_answers). One selected program now.
   Admin-assigned program (admin_program) takes precedence over the onboarding pick. */

import { PROGRAMS } from "@/lib/programs/catalog";
import { countryByCode } from "@/components/profile-setup/countries";

export type StudyApp = { program: string; tuition: string; city: string; country: string; language: string; university: string };
export type AcademicInfo = { lastDegree: string; field: string; year: string; grade: string; target: string; englishLevel: string; test: string };

const DEGREE_LABEL: Record<string, string> = { high_school: "High school diploma", bachelor: "Bachelor's degree", master: "Master's degree" };

// Cities aren't in the programs dataset, so map by the university name.
function uniCity(u: string): string {
  const s = (u || "").toLowerCase();
  if (s.includes("vilnius") || s.includes("mykolas romeris") || s.includes("smk")) return "Vilnius";
  if (s.includes("kaun") || s.includes("vytautas")) return "Kaunas";
  if (s.includes("klaip")) return "Klaipėda";
  if (s.includes("šiaul") || s.includes("siaul")) return "Šiauliai";
  return "—";
}

export function deriveStudy(cfa: Record<string, unknown> | null, destCountry: string | null): StudyApp | null {
  if (!cfa) return null;
  const country = countryByCode(destCountry ?? "")?.name ?? "Lithuania";
  const admin = cfa.admin_program as { name?: string; university?: string; price?: string } | undefined;
  if (admin?.name) {
    return { program: admin.name, tuition: admin.price || "—", university: admin.university || "—", city: uniCity(admin.university || ""), country, language: "English" };
  }
  const ps = cfa.program_setup as Record<string, unknown> | undefined;
  const ids = String(ps?.selected_programs ?? "").split("|").filter(Boolean).map(Number);
  const p = ids.length ? PROGRAMS.find((x) => x.id === ids[0]) : null;
  if (!p) return null;
  return {
    program: p.name,
    tuition: p.tuition_eur ? `${p.tuition_eur.toLocaleString("en-US")} €/yr` : "—",
    university: p.university,
    city: uniCity(p.university),
    country,
    language: "English",
  };
}

export function deriveAcademic(cfa: Record<string, unknown> | null): AcademicInfo | null {
  if (!cfa) return null;
  const te = cfa.timing_education as Record<string, unknown> | undefined;
  const ps = cfa.program_setup as Record<string, unknown> | undefined;
  if (!te && !ps) return null;
  const s = (v: unknown) => (v == null || v === "" ? "—" : String(v));
  const lastDeg = String(te?.last_degree ?? "");
  const target = String(te?.target_degree ?? "");
  const hasTest = ps?.has_english_test === "yes";
  const test = hasTest ? `${s(ps?.english_test_type)}${ps?.english_test_score ? ` · ${ps?.english_test_score}` : ""}` : "No test yet";
  return {
    lastDegree: DEGREE_LABEL[lastDeg] ?? (lastDeg || "—"),
    field: s(te?.last_degree_field),
    year: s(te?.last_degree_year),
    grade: te?.last_degree_grade ? `${te.last_degree_grade} / 20` : "—",
    target: DEGREE_LABEL[target] ?? (target || "—"),
    englishLevel: s(ps?.english_level),
    test,
  };
}
