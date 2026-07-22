"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Card, Icon, Flag } from "@/components/ds";
import OnboardingHeroPanel, { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import ProgramMatch from "@/components/programs/ProgramMatch";
import PricingCheckout from "@/components/pricing/PricingCheckout";
import { planById } from "@/lib/plans";
import type { StudentProfile } from "@/lib/programs/types";
import { fetchAdminRole } from "@/lib/admin";
import { LegalDocModal } from "@/components/legal/LegalContent";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { useSingleSession } from "@/lib/useSingleSession";
import { getCountryFlow } from "@/lib/onboarding/countryFlows";
import type { CountryFlow, CountryFlowStep, FieldDef } from "@/lib/onboarding/countryFlows/types";
import { supabase } from "@/lib/supabase/client";

/* Onboarding = Phase A (universal: personal details + destination) then Phase B
   (per-country steps sourced from the flow registry). onboarding_step is the
   index within onboarding_phase. Adding a country never touches this file. */

type Personal = {
  full_name: string;
  date_of_birth: string;
  city: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  destination_country: string;
  has_passport: string; // yes | no
};
const EMPTY_P: Personal = { full_name: "", date_of_birth: "", city: "", whatsapp_country_code: "+212", whatsapp_number: "", destination_country: "", has_passport: "" };
type Cfa = Record<string, Record<string, string>>;

// Longer per-step descriptions for the desktop hero panel (keyed by step label).
const HERO_CAPTIONS: Record<string, string> = {
  Personal: "Your name, birth date, city and WhatsApp, so we can reach you and prepare your file.",
  Studies: "Your last diploma, grade and when you want to start, so we only match programs you can get into.",
  Program: "Your field, budget and English, then we rank real Lithuanian programs by how well they fit you.",
  Pricing: "Choose how much help you want, self service or full service. You can change this later.",
  Roadmap: "A step by step plan from application to arrival, generated from everything you told us.",
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function personalFromRow(r: Record<string, unknown>): Personal {
  return {
    full_name: str(r.full_name), date_of_birth: str(r.date_of_birth), city: str(r.city),
    whatsapp_country_code: str(r.whatsapp_country_code) || "+212", whatsapp_number: str(r.whatsapp_number),
    destination_country: str(r.destination_country), has_passport: str(r.has_passport),
  };
}
function personalPatch(p: Personal) {
  return {
    full_name: p.full_name || null, date_of_birth: p.date_of_birth || null, city: p.city || null,
    whatsapp_country_code: p.whatsapp_country_code || null, whatsapp_number: p.whatsapp_number || null,
    destination_country: p.destination_country || null, has_passport: p.has_passport || null,
  };
}
function cfaFromJson(json: unknown): Cfa {
  const out: Cfa = {};
  if (json && typeof json === "object") {
    for (const [stepId, vals] of Object.entries(json as Record<string, unknown>)) {
      out[stepId] = {};
      if (vals && typeof vals === "object") for (const [k, v] of Object.entries(vals as Record<string, unknown>)) out[stepId][k] = v == null ? "" : String(v);
    }
  }
  return out;
}
function cfaToJson(flow: CountryFlow | null, cfa: Cfa) {
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
const hasCfaData = (cfa: Cfa) => Object.values(cfa).some((s) => Object.values(s).some((v) => v !== ""));

function validatePersonal(p: Personal): boolean {
  if (!p.full_name.trim() || !p.date_of_birth || !p.city.trim()) return false;
  if (!/^\d{6,15}$/.test(p.whatsapp_number.replace(/\s/g, ""))) return false;
  const c = countryByCode(p.destination_country);
  return !!(c && c.available);
}
function validateField(f: FieldDef, v: string): boolean {
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
function fieldVisible(f: FieldDef, vals: Record<string, string>): boolean {
  if (!f.showWhen) return true;
  const conds = Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen];
  return conds.every((c) => {
    if (c.equals !== undefined) return vals[c.field] === c.equals;
    if (c.notEquals !== undefined) return vals[c.field] !== c.notEquals;
    return true;
  });
}
function fieldInvalid(f: FieldDef, value: string, vals: Record<string, string>): boolean {
  if (!fieldVisible(f, vals)) return false;
  if (f.required && (value === "" || value == null)) return true;
  return value !== "" && !validateField(f, value);
}
function validateStep(step: CountryFlowStep, vals: Record<string, string> = {}): boolean {
  for (const sec of step.sections) for (const f of sec.fields) {
    if (!fieldVisible(f, vals)) continue;
    const v = vals[f.key] ?? "";
    if (f.required && v === "") return false;
    if (v !== "" && !validateField(f, v)) return false;
  }
  return true;
}
const numOrNull = (v: string | undefined) => { const n = parseFloat(v ?? ""); return Number.isNaN(n) ? null : n; };
function sanitize(f: FieldDef, raw: string): string {
  let v = raw;
  if (f.sanitize === "digits") v = v.replace(/[^\d]/g, "");
  else if (f.sanitize === "decimal") {
    v = v.replace(/,/g, ".").replace(/[^\d.]/g, ""); // phone keyboards often type "," for the decimal point
    const i = v.indexOf(".");
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, ""); // keep only the first "."
  }
  if (f.maxLength) v = v.slice(0, f.maxLength);
  return v;
}
function groupFields(fields: FieldDef[]): FieldDef[][] {
  const groups: FieldDef[][] = [];
  for (const f of fields) {
    const last = groups[groups.length - 1];
    if (f.row != null && last && last[0].row === f.row) last.push(f);
    else groups.push([f]);
  }
  return groups;
}

const eyebrow: CSSProperties = { font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)" };
const sectionTitle: CSSProperties = { font: "600 18px/24px var(--font-sans)", color: "var(--ink)", margin: "4px 0 16px" };
const fieldLabel: CSSProperties = { font: "500 13px/20px var(--font-sans)", color: "var(--ink)", marginBottom: 6 };
const divider = <div style={{ height: 1, background: "var(--line-soft)", margin: "24px 0" }} />;

/* ── Sub-components ─────────────────────────────────────────────────── */

// Options rendered as separate, spaced choice cards (clear gap between them).
function Segmented({ options, value, onChange }: { options: { value: string; label: string; disabled?: boolean }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="radiogroup" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} disabled={o.disabled} onClick={() => !o.disabled && onChange(o.value)}
            style={{ flex: "1 1 0", minWidth: 130, height: 44, padding: "0 18px", borderRadius: 12, border: active ? "1px solid var(--indigo-line)" : "1px solid var(--line)", cursor: o.disabled ? "not-allowed" : "pointer", font: "600 14px/1 var(--font-sans)", background: active ? "var(--indigo-tint)" : "var(--card)", color: active ? "var(--indigo-text)" : o.disabled ? "var(--ink-faint)" : "var(--ink)", opacity: o.disabled ? 0.5 : 1, transition: "border-color 120ms cubic-bezier(.4,0,.2,1), background 120ms cubic-bezier(.4,0,.2,1)" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  if (state === "idle") return <span />;
  if (state === "saving") return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "400 13px/20px var(--font-sans)", color: "var(--ink-faint)" }}><span style={{ width: 12, height: 12, borderRadius: 999, border: "2px solid var(--ink-faint)", borderTopColor: "transparent", animation: "afSpin .7s linear infinite", display: "inline-block" }} />Saving…</span>;
  if (state === "saved") return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "400 13px/20px var(--font-sans)", color: "var(--ink-faint)" }}><Icon name="check" size={14} style={{ color: "var(--green)" }} />Saved just now</span>;
  return <span style={{ font: "400 13px/20px var(--font-sans)", color: "var(--red)" }}>{"Couldn’t save, retrying"}</span>;
}

function FlowField({ field, value, stepValues, onChange, onFlush, invalid }: { field: FieldDef; value: string; stepValues: Record<string, string>; onChange: (v: string) => void; onFlush: () => void; invalid?: boolean }) {
  if (field.kind === "text") {
    return <Field label={field.label} hint={field.hint} placeholder={field.placeholder} required={field.required} inputMode={field.inputMode} maxLength={field.maxLength} value={value} aria-invalid={invalid || undefined} onChange={(e) => onChange(sanitize(field, e.target.value))} onBlur={onFlush} />;
  }
  if (field.kind === "select") {
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ font: "500 13px/20px var(--font-sans)", color: "var(--ink)" }}>{field.label}{field.hint && <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}> · {field.hint}</span>}</span>
        <select className="af" value={value} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value)} onBlur={onFlush}>
          <option value="" disabled>{field.placeholder ?? "Select"}</option>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  if (field.kind === "multiselect") {
    const chosen = value ? value.split("|").filter(Boolean) : [];
    const max = field.maxSelect ?? 99;
    const toggle = (v: string) => {
      const next = chosen.includes(v) ? chosen.filter((x) => x !== v) : chosen.length < max ? [...chosen, v] : chosen;
      onChange(next.join("|"));
    };
    return (
      <div>
        <div style={fieldLabel}>{field.label}{field.hint && <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}> · {field.hint}</span>}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: invalid ? 6 : 0, border: invalid ? "1px solid var(--red)" : "none", borderRadius: 12 }}>
          {field.options?.map((o) => {
            const on = chosen.includes(o.value);
            const full = !on && chosen.length >= max;
            return (
              <button key={o.value} type="button" aria-pressed={on} disabled={full} onClick={() => toggle(o.value)}
                style={{ height: 34, padding: "0 13px", borderRadius: 999, cursor: full ? "not-allowed" : "pointer", font: "600 12.5px/1 var(--font-sans)", border: on ? "1px solid var(--indigo-line)" : "1px solid var(--line)", background: on ? "var(--indigo-tint)" : "var(--card)", color: on ? "var(--indigo-text)" : "var(--ink)", opacity: full ? 0.45 : 1 }}>
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  const dis = field.disableOptionWhen && stepValues[field.disableOptionWhen.field] === field.disableOptionWhen.equals ? field.disableOptionWhen : null;
  return (
    <div>
      <div style={fieldLabel}>{field.label}</div>
      <div style={{ display: "inline-block", padding: invalid ? 6 : 0, border: invalid ? "1px solid var(--red)" : "none", borderRadius: 14 }}>
        <Segmented value={value} onChange={onChange} options={(field.options ?? []).map((o) => ({ ...o, disabled: dis ? o.value === dis.option : false }))} />
      </div>
      {dis?.note && <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", marginTop: 6 }}>{dis.note}</div>}
    </div>
  );
}

// Phone-only top bar (desktop uses the hero's own logo/logout). |LOGO| ··· ☰
function MobileBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  async function logout() { await supabase.auth.signOut(); router.replace("/signup"); }
  return (
    <div className="af-onboard-mobilebar" style={{ justifyContent: "center", paddingTop: 16, position: "relative", zIndex: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, boxShadow: "var(--shadow-card)", padding: "10px 18px", height: 60, boxSizing: "border-box", width: "min(340px, calc(100vw - 32px))" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={28} />
          <span style={{ font: "700 19px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span>
        </div>
        <div style={{ position: "relative" }}>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} style={{ background: "none", border: "none", padding: 6, cursor: "pointer", color: "var(--ink-soft)", display: "flex" }}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 7h14M3 13h14" />}</svg>
          </button>
          {open && (
            <>
              <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 15 }} aria-hidden />
              <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, minWidth: 180, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 6, zIndex: 20 }}>
                <button type="button" onClick={logout} style={{ width: "100%", height: 40, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "500 14px/1 var(--font-sans)", color: "var(--red)", textAlign: "left" }}>
                  <Icon name="logout" size={16} /> Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Phone-only horizontal stepper (1—2—3—4—5) with the current step title + copy.
function MobileSteps({ items, view, reached, meta }: { items: string[]; view: number; reached: number; meta: { title: string; description: string } }) {
  return (
    <div className="af-onboard-mobilesteps" style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        {items.map((label, i) => {
          const step = i + 1;
          const active = step === view;
          const done = step <= reached && !active;
          return (
            <div key={step} style={{ display: "flex", alignItems: "center", flex: i < items.length - 1 ? 1 : "none" }}>
              <span style={{ width: 28, height: 28, borderRadius: 999, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: active || done ? "var(--indigo-600)" : "var(--card)", color: active || done ? "#fff" : "var(--ink-faint)", border: step > reached ? "1px solid var(--line)" : "none", font: "600 12px/1 var(--font-sans)" }}>{done ? <Icon name="check" size={13} /> : step}</span>
              {i < items.length - 1 && <span style={{ flex: 1, height: 2, background: reached > step ? "var(--indigo-600)" : "var(--line)", borderRadius: 999 }} />}
            </div>
          );
        })}
      </div>
      <h1 style={{ font: "700 22px/28px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{meta.title}</h1>
      <p style={{ font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0" }}>{meta.description}</p>
    </div>
  );
}

// Footer: Back sits in the far-left corner; save indicator + primary on the right.
function StepFooter({ onBack, backLabel = "Back", saveState, right }: { onBack?: () => void; backLabel?: string; saveState?: "idle" | "saving" | "saved" | "error"; right: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      {onBack ? <Button variant="ghost" size="lg" onClick={onBack}>{backLabel}</Button> : <span />}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {saveState && <SaveIndicator state={saveState} />}
        {right}
      </div>
    </div>
  );
}

// Small 2-step progress marker used inside the Program step.
function SubStepper({ sub, labels, onJump }: { sub: number; labels: string[]; onJump: (i: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
      {labels.map((l, i) => {
        const active = i === sub, done = i < sub;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
            <button type="button" onClick={() => done && onJump(i)} disabled={!done} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: done ? "pointer" : "default", padding: 0 }}>
              <span style={{ width: 26, height: 26, borderRadius: 999, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: active || done ? "var(--indigo-600)" : "var(--subtle)", color: active || done ? "#fff" : "var(--ink-faint)", font: "600 12px/1 var(--font-sans)" }}>{done ? <Icon name="check" size={13} /> : i + 1}</span>
              <span style={{ font: "600 13px/1 var(--font-sans)", color: active ? "var(--indigo-700)" : "var(--ink-faint)" }}>{l}</span>
            </button>
            {i < labels.length - 1 && <span style={{ flex: 1, height: 2, background: sub > i ? "var(--indigo-600)" : "var(--line)", margin: "0 12px", borderRadius: 999 }} />}
          </div>
        );
      })}
    </div>
  );
}

function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, background: "var(--amber-tint)", border: "1px solid var(--amber-line)", borderRadius: 12, padding: "12px 14px", marginTop: 16 }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="var(--amber)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none", marginTop: 1 }}><path d="M10 3 2 17h16L10 3z" /><path d="M10 8v4M10 14.5v.5" /></svg>
      <span style={{ font: "500 13px/19px var(--font-sans)", color: "var(--ink)" }}>{children}</span>
    </div>
  );
}

const degLabel = (s: string) => s === "high_school" ? "High school" : s === "bachelor" ? "Bachelor's" : s === "master" ? "Master's" : (s || "—");
const cleanList = (s: string) => (s || "").replace(/[[\]"]/g, "").trim() || "—";

function ageFromDob(dob: string): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

function LegalCheck({ checked, onToggle, onRead, label, invalid }: { checked: boolean; onToggle: () => void; onRead: () => void; label: string; invalid?: boolean }) {
  const stroke = invalid ? "2px solid var(--red)" : "2px solid var(--ink)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, textAlign: "left" }}>
      <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle} style={{ flex: "none", width: 18, height: 18, borderRadius: 5, border: checked ? "none" : stroke, background: checked ? "var(--indigo-600)" : (invalid ? "var(--red-tint)" : "transparent"), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: invalid ? "0 0 0 3px var(--red-tint)" : "none" }}>
        {checked && <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5 8.5 14.5 15.5 6" /></svg>}
      </button>
      <span style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>
        {label}{" "}
        <button type="button" onClick={onRead} style={{ background: "none", border: "none", cursor: "pointer", font: "600 12.5px/18px var(--font-sans)", color: "var(--indigo-600)", padding: 0, textDecoration: "underline" }}>Read</button>
      </span>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default function ProfileSetup() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(1);
  const [reached, setReached] = useState(1);
  const [personal, setPersonal] = useState<Personal>(EMPTY_P);
  const [cfa, setCfa] = useState<Cfa>({});
  const [userNumber, setUserNumber] = useState<number | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmCode, setConfirmCode] = useState<string | null>(null);
  const [progSub, setProgSub] = useState(0); // sub-step within the program step (0 = preferences, 1 = pick)
  const [priceSub, setPriceSub] = useState(0); // sub-step within the pricing step (0 = plan, 1 = checkout)
  const [showErrors, setShowErrors] = useState(false); // reveal red borders on required-but-empty after Continue
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeRefund, setAgreeRefund] = useState(false);
  const [legalError, setLegalError] = useState(false);
  const [legalView, setLegalView] = useState<null | "terms" | "refund">(null);
  const pRef = useRef(personal);
  const cRef = useRef(cfa);
  const uidRef = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigating = useRef(false); // re-entrancy guard so a double-tap on Continue can't skip a step

  useSingleSession(sessionUserId);

  const flow = getCountryFlow(personal.destination_country);
  const total = 1 + (flow?.steps.length ?? 0);
  const stepperItems = ["Personal", ...(flow?.steps.map((s) => s.stepperLabel) ?? [])];
  const heroSteps = stepperItems.map((label) => ({ label, caption: HERO_CAPTIONS[label] ?? "" }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/signup"); return; }
      const admin = await fetchAdminRole(user.email);
      if (cancelled) return;
      if (admin.role) { router.replace("/admin"); return; }
      uidRef.current = user.id;
      setSessionUserId(user.id);
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (cancelled) return;
      const row = (data ?? {}) as Record<string, unknown>;
      if (row.onboarding_completed_at) { router.replace("/dashboard"); return; }
      const p = personalFromRow(row);
      const c = cfaFromJson(row.country_flow_answers);
      const phase = str(row.onboarding_phase) || "universal";
      const stepInPhase = clamp(typeof row.onboarding_step === "number" ? row.onboarding_step : 1, 1, 20);
      const abs = phase === "universal" ? 1 : 1 + stepInPhase;
      pRef.current = p; cRef.current = c;
      setUserNumber(typeof row.user_number === "number" ? row.user_number : null);
      setPersonal(p); setCfa(c); setReached(abs); setView(abs); setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => { setProgSub(0); setPriceSub(cRef.current.pricing?.plan ? 1 : 0); setShowErrors(false); }, [view]); // restart sub-steps on main-step change (resume checkout if a plan was already chosen)
  // Move the view to the top of the new step / sub-step (desktop frame scroll + mobile page scroll).
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo(0, 0);
    document.querySelector(".af-frame-body")?.scrollTo({ top: 0 });
  }, [view, progSub, priceSub]);

  async function save(retry = true) {
    const id = uidRef.current;
    if (!id) return;
    setSaveState("saving");
    const { error } = await supabase.from("profiles").upsert({ id, ...personalPatch(pRef.current), country_flow_answers: cfaToJson(getCountryFlow(pRef.current.destination_country), cRef.current) });
    if (error) { if (retry) { setTimeout(() => save(false), 1000); return; } setSaveState("error"); return; }
    setSaveState("saved");
  }
  function scheduleSave() { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => void save(), 600); }
  function flushSave() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } void save(); }

  function setP(key: keyof Personal, value: string) {
    setPersonal((prev) => { const next = { ...prev, [key]: value }; pRef.current = next; return next; });
    scheduleSave();
  }
  function setFieldValue(step: CountryFlowStep, key: string, value: string) {
    setCfa((prev) => {
      const stepVals = { ...(prev[step.id] ?? {}), [key]: value };
      for (const sec of step.sections) for (const f of sec.fields) {
        if (f.forceValueWhen && stepVals[f.forceValueWhen.field] === f.forceValueWhen.equals) stepVals[f.key] = f.forceValueWhen.value;
      }
      const next = { ...prev, [step.id]: stepVals };
      cRef.current = next;
      return next;
    });
    scheduleSave();
  }

  const currentValid =
    view === 1
      ? validatePersonal(personal)
      : (() => { const s = flow?.steps[view - 2]; return !s || s.sections.length === 0 || validateStep(s, cfa[s.id]); })();

  async function persistPosition(abs: number) {
    const id = uidRef.current;
    if (!id) return;
    await supabase.from("profiles").update({ onboarding_phase: abs === 1 ? "universal" : "country_flow", onboarding_step: abs === 1 ? 1 : abs - 1 }).eq("id", id);
  }
  function goNext() {
    if (navigating.current) return;            // ignore rapid double-clicks
    if (!currentValid) { setShowErrors(true); return; }
    setShowErrors(false);
    flushSave();                               // persist the latest field values before leaving the step
    const next = view + 1;
    setView(next);                             // advance immediately — no waiting on the network (fixes the lag/flash)
    if (next > reached) { setReached(next); void persistPosition(next); } // remember position in the background
    navigating.current = true;
    setTimeout(() => { navigating.current = false; }, 250);
  }
  async function finish() {
    const id = uidRef.current;
    if (id) await supabase.from("profiles").update({ onboarding_completed_at: new Date().toISOString(), onboarding_phase: "country_flow", onboarding_step: flow?.steps.length ?? 1 }).eq("id", id);
    router.replace("/dashboard");
  }

  function pickCountry(code: string, available: boolean) {
    if (!available || code === personal.destination_country) return;
    if (reached > 1 || hasCfaData(cRef.current)) { setConfirmCode(code); return; }
    setP("destination_country", code);
  }
  async function applySwitch(code: string) {
    const next = { ...pRef.current, destination_country: code };
    pRef.current = next; cRef.current = {};
    setPersonal(next); setCfa({}); setReached(1); setView(1); setConfirmCode(null);
    const id = uidRef.current;
    if (id) await supabase.from("profiles").update({ destination_country: code, country_flow_answers: {}, onboarding_phase: "universal", onboarding_step: 1 }).eq("id", id);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", color: "var(--ink-faint)", font: "400 15px/24px var(--font-sans)" }}>Loading your profile…</div>
    );
  }

  const isLast = view === total;
  const meta = view === 1 ? { title: "Tell us about you", description: "The basics we need before we can shortlist programs. This stays in your file, you can edit most of it later." } : flow!.steps[view - 2];
  const bStep: CountryFlowStep | null = view === 1 ? null : flow!.steps[view - 2];
  const isProgram = bStep?.custom === "program";
  const isPricing = bStep?.custom === "pricing";
  const isRoadmap = bStep?.placeholder === "roadmap";
  const programProfile: StudentProfile = {
    degree: cfa.timing_education?.target_degree === "master" ? "Master" : "Bachelor",
    fields: (cfa.program_setup?.field_of_interest ?? "").split("|").filter(Boolean),
    maxBudget: numOrNull(cfa.program_setup?.max_budget),
    grade20: numOrNull(cfa.timing_education?.last_degree_grade),
    englishLevel: cfa.program_setup?.english_level ?? null,
    hasTest: cfa.program_setup?.has_english_test === "yes",
    testType: cfa.program_setup?.english_test_type ?? null,
    testScore: numOrNull(cfa.program_setup?.english_test_score),
  };
  const selectedPrograms = (cfa.program_setup?.selected_programs ?? "").split("|").filter(Boolean).map(Number);

  // One footer, always pinned to the bottom of the frame (pricing renders its own).
  const prevStep = () => setView((v) => Math.max(1, v - 1));
  const progNext = () => { if (!currentValid) { setShowErrors(true); return; } setShowErrors(false); setProgSub(1); };
  const stepFooter =
    view === 1 ? <StepFooter saveState={saveState} right={<Button variant="primary" size="lg" onClick={goNext}>Continue</Button>} />
    : isProgram ? (progSub === 0
        ? <StepFooter onBack={prevStep} saveState={saveState} right={<Button variant="primary" size="lg" onClick={progNext}>Continue</Button>} />
        : <StepFooter onBack={() => setProgSub(0)} saveState={saveState} right={<Button variant="primary" size="lg" onClick={goNext}>Continue</Button>} />)
    : (bStep && bStep.sections.length > 0) ? <StepFooter onBack={prevStep} saveState={saveState} right={<Button variant="primary" size="lg" onClick={goNext}>Continue</Button>} />
    : <StepFooter right={isLast ? <Button variant="primary" size="lg" onClick={() => { if (!(agreeTerms && agreeRefund)) { setLegalError(true); return; } finish(); }}>Done</Button> : <Button variant="primary" size="lg" onClick={goNext}>Continue</Button>} />;

  return (
    <div className="af-onboard-shell">
      <MobileBar />
      <div className="af-onboard-grid">
        <aside className="af-onboard-left">
          <OnboardingHeroPanel steps={heroSteps} view={view} reached={reached} onJump={(i) => { if (view !== total) setView(i); }} />
        </aside>
        <section className="af-onboard-right">
          <div className="af-onboard-col">
            <MobileSteps items={stepperItems} view={view} reached={reached} meta={meta} />
            <div className="af-onboard-info" style={{ marginBottom: 14 }}>
              <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{meta.title}</h1>
              <p style={{ font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0", maxWidth: 620 }}>{meta.description}</p>
            </div>
            {isProgram && <div style={{ marginBottom: 14 }}><SubStepper sub={progSub} labels={["Your preferences", "Pick your programs"]} onJump={setProgSub} /></div>}
            {isPricing && <div style={{ marginBottom: 14 }}><SubStepper sub={priceSub} labels={["Choose a plan", "Checkout"]} onJump={setPriceSub} /></div>}
            <div className="af-onboard-scroll">
              <div className={`af-frame ${isPricing && priceSub === 0 ? "af-frame-open" : "af-frame-card"}${isRoadmap ? " af-frame-video" : ""}`}>
                {isRoadmap && (
                  <>
                    <video autoPlay muted loop playsInline aria-hidden className="af-roadmap-video" onLoadedMetadata={(e) => { e.currentTarget.playbackRate = 0.5; }}>
                      <source src="/onboarding/step-2.mp4" type="video/mp4" />
                    </video>
                    <div aria-hidden className="af-roadmap-veil" />
                  </>
                )}
                {isPricing ? (
                  <PricingCheckout
                    userId={uidRef.current ?? ""}
                    pricing={cfa.pricing ?? {}}
                    setPricing={(key, value) => setFieldValue(bStep!, key, value)}
                    priceSub={priceSub}
                    setPriceSub={setPriceSub}
                    onApproved={() => { setPriceSub(0); goNext(); }}
                    onBackStep={() => setView((v) => Math.max(1, v - 1))}
                  />
                ) : (
                  <>
                    <div className="af-frame-body">
          {view === 1 ? (
            <>
              {/* Personal details */}
              <div style={eyebrow}>Personal details</div>
              <div style={sectionTitle}>Who you are</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Field label="Full name" hint="exactly as written in your passport" required value={personal.full_name} aria-invalid={(showErrors && !personal.full_name.trim()) || undefined} onChange={(e) => setP("full_name", e.target.value)} onBlur={flushSave} placeholder="Your full name" />
                <div className="af-row-2">
                  <Field label="Date of birth" type="date" required value={personal.date_of_birth} aria-invalid={(showErrors && !personal.date_of_birth) || undefined} onChange={(e) => setP("date_of_birth", e.target.value)} onBlur={flushSave} />
                  <Field label="City you live in" required value={personal.city} aria-invalid={(showErrors && !personal.city.trim()) || undefined} onChange={(e) => setP("city", e.target.value)} onBlur={flushSave} placeholder="e.g. Casablanca" />
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ font: "500 13px/20px var(--font-sans)", color: "var(--ink)" }}>WhatsApp number</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input className="af" value={personal.whatsapp_country_code} onChange={(e) => setP("whatsapp_country_code", e.target.value.replace(/[^\d+]/g, ""))} onBlur={flushSave} style={{ width: 76, textAlign: "center" }} aria-label="Country code" />
                    <input className="af" value={personal.whatsapp_number} aria-invalid={(showErrors && !/^\d{6,15}$/.test(personal.whatsapp_number.replace(/\s/g, ""))) || undefined} onChange={(e) => setP("whatsapp_number", e.target.value.replace(/[^\d]/g, ""))} onBlur={flushSave} inputMode="numeric" placeholder="6XXXXXXXX" style={{ flex: 1 }} aria-label="WhatsApp number" />
                  </div>
                </label>
              </div>

              {divider}

              {/* Destination */}
              <div style={eyebrow}>Your future destination</div>
              <div style={sectionTitle}>Where you want to study</div>
              <div className="af-country-grid">
                {COUNTRIES.map((c) => {
                  const selected = personal.destination_country === c.code;
                  return (
                    <button key={c.code} type="button" disabled={!c.available} onClick={() => pickCountry(c.code, c.available)}
                      style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, border: selected ? "1px solid var(--indigo-line)" : "1px solid var(--line)", background: selected ? "var(--indigo-tint)" : "var(--card)", cursor: c.available ? "pointer" : "not-allowed", opacity: c.available ? 1 : 0.4, transition: "border-color 120ms cubic-bezier(.4,0,.2,1), background 120ms cubic-bezier(.4,0,.2,1)" }}>
                      <Flag stripes={c.stripes} size="lg" />
                      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ font: "600 14.5px/20px var(--font-sans)", color: selected ? "var(--indigo-text)" : "var(--ink)" }}>{c.name}</span>
                        <span className={c.available ? "pill pill-green" : "pill pill-amber"}>{c.available ? "Available now" : "Coming soon"}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {showErrors && !countryByCode(personal.destination_country)?.available && <div style={{ font: "500 12.5px/18px var(--font-sans)", color: "var(--red)", marginTop: 8 }}>Please choose an available destination to continue.</div>}
            </>
          ) : isProgram ? (
            <>
              {progSub === 0 ? (
                <>
                  {bStep!.sections.map((sec, si) => (
                    <div key={si}>
                      {si > 0 && divider}
                      <div style={eyebrow}>{sec.eyebrow}</div>
                      <div style={sectionTitle}>{sec.sectionTitle}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {groupFields(sec.fields.filter((f) => fieldVisible(f, cfa[bStep!.id] ?? {}))).map((group, gi) => (
                          <div key={gi} className={group.length > 1 ? `af-row-${group.length}` : undefined}>
                            {group.map((f) => (
                              <FlowField key={f.key} field={f} value={cfa[bStep!.id]?.[f.key] ?? ""} stepValues={cfa[bStep!.id] ?? {}} invalid={showErrors && fieldInvalid(f, cfa[bStep!.id]?.[f.key] ?? "", cfa[bStep!.id] ?? {})} onChange={(v) => setFieldValue(bStep!, f.key, v)} onFlush={flushSave} />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <ProgramMatch profile={programProfile} selected={selectedPrograms} onSelect={(ids) => setFieldValue(bStep!, "selected_programs", ids.join("|"))} />
              )}
            </>
          ) : bStep && bStep.sections.length > 0 ? (
            <>
              {bStep.sections.map((sec, si) => (
                <div key={si}>
                  {si > 0 && divider}
                  <div style={eyebrow}>{sec.eyebrow}</div>
                  <div style={sectionTitle}>{sec.sectionTitle}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {groupFields(sec.fields.filter((f) => fieldVisible(f, cfa[bStep.id] ?? {}))).map((group, gi) => (
                      <div key={gi} className={group.length > 1 ? `af-row-${group.length}` : undefined}>
                        {group.map((f) => (
                          <FlowField key={f.key} field={f} value={cfa[bStep.id]?.[f.key] ?? ""} stepValues={cfa[bStep.id] ?? {}} invalid={showErrors && fieldInvalid(f, cfa[bStep.id]?.[f.key] ?? "", cfa[bStep.id] ?? {})} onChange={(v) => setFieldValue(bStep, f.key, v)} onFlush={flushSave} />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            // placeholder step (program / pricing / roadmap)
            <>
              {bStep?.placeholder === "program" && <p style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)", margin: 0 }}>Program-matching engine, coming next. You&apos;ll see programs that match your profile here.</p>}
              {bStep?.placeholder === "pricing" && <p style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)", margin: 0 }}>Plans and checkout, coming next. Two paid tiers: <strong style={{ color: "var(--ink)" }}>Full service</strong> and <strong style={{ color: "var(--ink)" }}>Self service</strong>.</p>}
              {bStep?.placeholder === "roadmap" && (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 400 }}>
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 4 }}>
                    {/* Task 5: header — logo left, short trust line right */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <LogoMark size={22} />
                        <span style={{ font: "700 15px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span>
                      </div>
                      <span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--indigo-600)", textAlign: "right" }}>Built on your trust.</span>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 4, padding: "8px 0" }}>
                      <span style={{ width: 54, height: 54, borderRadius: 999, flex: "none", background: "var(--green-tint)", border: "1px solid var(--green-line)", color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", animation: "afNodePop .5s cubic-bezier(.4,0,.2,1) both" }}>
                        <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5 8.5 14.5 15.5 6" /></svg>
                      </span>
                      <h2 style={{ font: "700 21px/27px var(--font-sans)", color: "var(--ink)", margin: "10px 0 0" }}>Congratulations!</h2>
                      <p style={{ font: "600 13.5px/20px var(--font-sans)", color: "var(--indigo-600)", margin: "4px 0 0" }}>Good luck in your roadmap.</p>

                      {/* Task 6: colorless, extra-blurred transparent glass card */}
                      <div style={{ width: "100%", maxWidth: 400, marginTop: 14, textAlign: "left", background: "rgba(255,255,255,.18)", backdropFilter: "blur(30px) saturate(1.05)", WebkitBackdropFilter: "blur(30px) saturate(1.05)", border: "1px solid rgba(255,255,255,.45)", borderRadius: 18, boxShadow: "0 12px 32px rgba(23,35,58,.14)", padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                          <span style={{ width: 38, height: 38, borderRadius: 999, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 15px/1 var(--font-sans)" }}>{(personal.full_name || "U").trim().charAt(0).toUpperCase()}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ font: "700 14px/18px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{personal.full_name || "Your name"}</div>
                            <div style={{ font: "600 11px/15px var(--font-sans)", color: "var(--indigo-600)" }}>AWU-{String(userNumber ?? 0).padStart(3, "0")}</div>
                          </div>
                        </div>
                        {[
                          ["Age", ageFromDob(personal.date_of_birth) != null ? `${ageFromDob(personal.date_of_birth)} years` : "—"],
                          ["Country", countryByCode(personal.destination_country)?.name ?? "—"],
                          ["Program interest", cleanList(cfa.program_setup?.field_of_interest ?? "")],
                          ["Last diploma", degLabel(cfa.timing_education?.last_degree ?? "")],
                          ["Degree to study", degLabel(cfa.timing_education?.target_degree ?? "")],
                          ["Plan", planById(cfa.pricing?.plan)?.name ?? "—"],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderTop: "1px solid rgba(23,35,58,.08)" }}>
                            <span style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{k}</span>
                            <span style={{ font: "600 12.5px/18px var(--font-sans)", color: "var(--ink)", textAlign: "right" }}>{v}</span>
                          </div>
                        ))}
                      </div>

                      <p style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-soft)", margin: "14px 0 0", maxWidth: 420 }}>
                        You built your roadmap successfully with <strong style={{ color: "var(--indigo-600)" }}>{planById(cfa.pricing?.plan)?.name ?? "your plan"}</strong>.
                      </p>
                      <p style={{ font: "400 12px/18px var(--font-sans)", color: "var(--ink-faint)", margin: "5px 0 0", maxWidth: 420 }}>Your personalized roadmap is being prepared, we&apos;ll take it from here.</p>

                      <div style={{ width: "100%", maxWidth: 420, marginTop: 14, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                        <LegalCheck checked={agreeTerms} invalid={legalError && !agreeTerms} onToggle={() => { setAgreeTerms((v) => !v); setLegalError(false); }} onRead={() => setLegalView("terms")} label="I have read and agree to the Terms of Service (Agreement)." />
                        <LegalCheck checked={agreeRefund} invalid={legalError && !agreeRefund} onToggle={() => { setAgreeRefund((v) => !v); setLegalError(false); }} onRead={() => setLegalView("refund")} label="I have read the Refund Policy." />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
                    </div>
                    <div className="af-frame-footer">{stepFooter}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {confirmCode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(23,35,58,.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Card style={{ width: "100%", maxWidth: 420, padding: 24 }}>
            <h2 style={{ font: "600 18px/24px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Switch destination?</h2>
            <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "10px 0 20px" }}>
              Switching destination will clear the {countryByCode(personal.destination_country)?.name} questions you&apos;ve answered so far. Continue?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button variant="ghost" onClick={() => setConfirmCode(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => applySwitch(confirmCode)}>Continue</Button>
            </div>
          </Card>
        </div>
      )}
      {legalView && <LegalDocModal doc={legalView} onClose={() => setLegalView(null)} />}
    </div>
  );
}
