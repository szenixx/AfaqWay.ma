/* The onboarding journey: the ordered list of SCREENS a student walks through.

   One screen asks one thing. Everything the platform already collected is still
   collected — the flow registry (src/lib/onboarding/countryFlows) is still the
   only place a country's questions are defined — but instead of rendering a
   step as a page of eight fields, each field becomes its own screen here.
   Adding a country still means adding one flow file and one registry line.

   The screen list is DERIVED, never stored: it is recomputed from the answers
   on every render, so a conditional field (`showWhen`) appears and disappears
   as its trigger changes, and progress stays honest. */

import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { GENDER_OPTIONS } from "@/lib/avatarIdentity";
import type { EmojiName } from "./emoji";
import { EMOJI_MAP } from "./emoji";
import type { CountryFlow, CountryFlowStep, FieldDef, FieldOption } from "./countryFlows/types";
import { fieldVisible, isOldEnough, MIN_AGE, validateField, validWhatsappFor, type Cfa, type Personal } from "./profileState";
import { scoreRule, validScore } from "./englishScores";

/* ── Where an answer lives ───────────────────────────────────────────── */

export type Slot =
  | { type: "personal"; key: keyof Personal }
  | { type: "flow"; stepId: string; key: string };

export type Choice = {
  value: string;
  label: string;
  hint?: string;
  emoji?: EmojiName;
  /** Real flag stripes from the design system, which never get recoloured. An
      emoji flag is a picture of a flag; this is the flag. */
  flag?: string[];
  /** Position on an ordered scale, drawn as a level meter. */
  bars?: { lit: number; total: number };
  /** Second line under the label. */
  sub?: string;
  disabled?: boolean;
};

export type Control =
  | { kind: "choice"; choices: Choice[]; columns: 1 | 2; compact?: boolean; phoneColumns?: 2 }
  | { kind: "multi"; choices: Choice[]; max: number; columns: 1 | 2 }
  | { kind: "select"; choices: Choice[]; placeholder: string }
  | { kind: "text"; placeholder?: string; inputMode?: "text" | "numeric" | "decimal"; sanitize?: "digits" | "decimal" | "titlecase"; maxLength?: number }
  | { kind: "date" }
  | { kind: "name" }
  | { kind: "phone" };

export type Question = {
  slot: Slot;
  title: string;
  subtitle?: string;
  /** Fine print, shown in the header's info popover rather than on the screen. */
  hint?: string;
  emoji: EmojiName;
  control: Control;
  /** Message shown under the options when a cross-field rule closed one off. */
  note?: string;
  isValid: (value: string) => boolean;
  error: string;
  /* Fields that only exist because of THIS answer are asked here, under it,
     rather than on a screen of their own: "which test" is a clarification of
     "do you have a test", not a new question. */
  followUps?: Question[];
  /** Follow-ups only: whether this one currently applies. */
  applies?: (cfa: Cfa) => boolean;
};

export type Screen =
  | { kind: "note"; id: string; group: number; emoji: EmojiName; title: string; titleVars?: Record<string, string>; body: string; cta: string }
  | { kind: "question"; id: string; group: number; question: Question }
  | { kind: "program"; id: string; group: number; stepId: string; title: string; subtitle: string }
  | { kind: "pricing"; id: string; group: number; stepId: string }
  | { kind: "summary"; id: string; group: number };

/* ── Emoji vocabulary ────────────────────────────────────────────────── */

const isEmoji = (n: string | undefined): n is EmojiName => !!n && n in EMOJI_MAP;
const emojiOr = (name: string | undefined, fallback: EmojiName): EmojiName => (isEmoji(name) ? name : fallback);

/* Option values come from three places — the flow files, the programme
   catalogue and the platform's own enums — so their emoji live here rather
   than being repeated beside every list. Anything unmapped simply renders
   without one, which is a fine default for a plain list. */
const CHOICE_EMOJI: Record<string, EmojiName> = {
  // countries
  LT: "flag-lt", HU: "flag-hu", LV: "flag-lv", PL: "flag-pl",
  // gender
  male: "man", female: "woman", prefer_not_to_say: "person",
  // degrees
  high_school: "school", bachelor: "graduation", master: "scroll",
  // yes / no
  yes: "yes", no: "no",
  // fields of interest (values are the catalogue's own field names)
  "Arts & Design": "art",
  Business: "business",
  "Computer & IT": "it",
  Engineering: "engineering",
  "Finance & Economics": "finance",
  "Languages & Humanities": "humanities",
  Law: "law",
  "Logistics & Transport": "logistics",
  "Mechatronics & TECH": "mechatronics",
  "Media & Communication": "media",
  "Medicine & Health": "medicine",
  "Natural Sciences": "science",
  "Social Sciences": "social",
  Sport: "sport",
  "Tourism & Hospitality": "tourism",
};

/* A short list reads best as one column of full-width rows. Past five options
   that column runs off the card, so it splits into two — which is also the
   point at which the labels are being scanned rather than read.

   A select with a handful of options is better as visible rows; past that the
   rows stop being scannable and a dropdown is the honest control. */
const TWO_COLUMN_FROM = 6;
const MAX_CARD_OPTIONS = 6;
const columnsFor = (choices: Choice[]): 1 | 2 => (choices.length >= TWO_COLUMN_FROM ? 2 : 1);

/* A yes/no pair carries two words between them. Full-width rows spend a third
   of a phone screen saying it, so a compact pair sits side by side there even
   though a longer list would not fit. */
const isCompact = (choices: Choice[]) =>
  choices.length === 2 && choices.every((c) => c.label.length <= 12 && !c.sub && !c.hint);

/* ── Flow field → question ───────────────────────────────────────────── */

/* An option may name its own emoji; otherwise the shared vocabulary answers for
   it, and an option with neither simply renders without one. */
const optionEmoji = (o: FieldOption): EmojiName | undefined => {
  const name = o.emoji ?? CHOICE_EMOJI[o.value];
  return isEmoji(name) ? name : undefined;
};

const toChoices = (f: FieldDef, stepVals: Record<string, string>): Choice[] => {
  const dis = f.disableOptionWhen && stepVals[f.disableOptionWhen.field] === f.disableOptionWhen.equals ? f.disableOptionWhen : null;
  const total = f.options?.length ?? 0;
  return (f.options ?? []).map((o, i) => ({
    value: o.value,
    label: o.label,
    sub: o.sub,
    emoji: f.scale ? undefined : optionEmoji(o),
    bars: f.scale ? { lit: i + 1, total } : undefined,
    disabled: dis ? o.value === dis.option : false,
  }));
};

function controlFor(f: FieldDef, stepVals: Record<string, string>): Control {
  const choices = toChoices(f, stepVals);
  if (f.kind === "multiselect") return { kind: "multi", choices, max: f.maxSelect ?? 99, columns: columnsFor(choices) };
  if (f.kind === "segmented") return { kind: "choice", choices, columns: columnsFor(choices), compact: isCompact(choices) };
  if (f.kind === "select") {
    return choices.length <= MAX_CARD_OPTIONS
      ? { kind: "choice", choices, columns: columnsFor(choices), phoneColumns: f.phoneColumns }
      : { kind: "select", choices, placeholder: f.placeholder ?? "Select" };
  }
  return { kind: "text", placeholder: f.placeholder, inputMode: f.inputMode, sanitize: f.sanitize, maxLength: f.maxLength };
}

function fieldError(f: FieldDef): string {
  if (f.kind === "multiselect") return `Please choose at least one ${f.label.toLowerCase()}.`;
  if (f.min != null && f.max != null) return `Enter a number between ${f.min} and ${f.max}.`;
  if (f.min != null) return `Enter ${f.min} or more.`;
  return `${f.label} is required.`;
}

/* Which other fields a `showWhen` rule watches. */
function triggersOf(f: FieldDef): string[] {
  if (!f.showWhen) return [];
  return (Array.isArray(f.showWhen) ? f.showWhen : [f.showWhen]).map((c) => c.field);
}

/* A conditional field belongs on the screen of the answer that revealed it.

   Walk the step's fields in order: a field whose triggers are all asked
   earlier in the same step is attached to the screen owning its first trigger
   (following the chain if that trigger is itself a follow-up), instead of
   becoming a screen of its own. So "do you have an English test?" carries
   "which test" and "what score" underneath it, and answering "no" leaves one
   clean question on screen with nothing revealed. */
function planFields(step: CountryFlowStep): { primary: FieldDef; followUps: FieldDef[] }[] {
  const all = step.sections.flatMap((sec) => sec.fields);
  const seen = new Set<string>();
  const ownerOf = new Map<string, string>();   // field key -> key of the primary it hangs off
  const groups = new Map<string, { primary: FieldDef; followUps: FieldDef[] }>();
  const order: string[] = [];

  for (const f of all) {
    const triggers = triggersOf(f).filter((k) => seen.has(k));
    const host = triggers.length === triggersOf(f).length && triggers.length > 0
      ? ownerOf.get(triggers[0]) ?? triggers[0]
      : null;
    if (host && groups.has(host)) {
      groups.get(host)!.followUps.push(f);
      ownerOf.set(f.key, host);
    } else {
      groups.set(f.key, { primary: f, followUps: [] });
      ownerOf.set(f.key, f.key);
      order.push(f.key);
    }
    seen.add(f.key);
  }
  return order.map((k) => groups.get(k)!);
}

function questionFor(step: CountryFlowStep, f: FieldDef, stepVals: Record<string, string>): Question {
  const dis = f.disableOptionWhen && stepVals[f.disableOptionWhen.field] === f.disableOptionWhen.equals ? f.disableOptionWhen : null;

  /* The score field is the one place a static min/max on the field cannot
     express the rule: what counts as possible depends on which test the
     student picked a screen earlier. `stepVals` carries that answer, and the
     screens are rebuilt whenever it changes, so the range and the note under
     the input follow the selection. */
  const test = f.key === "english_test_score" ? (stepVals.english_test_type ?? "") : "";
  const rule = test ? scoreRule(test) : null;

  return {
    slot: { type: "flow", stepId: step.id, key: f.key },
    title: f.question ?? f.label,
    subtitle: f.subtitle,
    hint: f.hint,
    emoji: emojiOr(f.emoji, "sparkles"),
    control: controlFor(f, stepVals),
    note: rule?.note ?? dis?.note ?? f.footnote,
    isValid: test ? (v) => validScore(test, v) : (v) => validateField(f, v),
    error: rule ? `That score is outside the range for this test. ${rule.note}` : fieldError(f),
  };
}

/** Cross-field `forceValueWhen` rules, applied whenever a step's value changes. */
export function applyForceRules(step: CountryFlowStep, stepVals: Record<string, string>): Record<string, string> {
  const next = { ...stepVals };
  for (const sec of step.sections) for (const f of sec.fields) {
    if (f.forceValueWhen && next[f.forceValueWhen.field] === f.forceValueWhen.equals) next[f.key] = f.forceValueWhen.value;
  }
  return next;
}

/* ── The universal (pre-country) questions ───────────────────────────── */

const personalQuestions = (p: Personal): Question[] => [
  {
    slot: { type: "personal", key: "full_name" },
    title: "What is your full name?",
    subtitle: "Exactly as it is written in your passport, it goes on every document we prepare.",
    emoji: "id",
    /* Asked as two fields and stored as one. `full_name` is a single column and
       this file is the contract the classic wizard writes through too, so the
       split lives in the presentation and both halves compose back into the
       same string rather than the schema growing a column. */
    control: { kind: "name" },
    isValid: (v) => v.trim().split(/\s+/).filter(Boolean).length >= 2,
    error: "Please enter both your first and last name.",
  },
  {
    slot: { type: "personal", key: "gender" },
    title: "How do you identify?",
    subtitle: "It sets your profile picture and how your advisor addresses you.",
    emoji: "person",
    control: { kind: "choice", columns: 1, choices: GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label, emoji: CHOICE_EMOJI[g.value] })) },
    isValid: (v) => v !== "",
    error: "Please pick one.",
  },
  {
    slot: { type: "personal", key: "date_of_birth" },
    title: "When were you born?",
    subtitle: "Age rules differ per programme and per visa step, so we check them for you.",
    emoji: "cake",
    control: { kind: "date" },
    /* Counted off today's calendar every time, so the rule stays true as years
       pass rather than drifting behind a hardcoded cut-off. */
    isValid: isOldEnough,
    error: `You need to be over ${MIN_AGE - 1} to apply. Check the date you entered.`,
  },
  {
    slot: { type: "personal", key: "city" },
    title: "Which city do you live in?",
    subtitle: "It decides which consulate and appointment centre your file goes through.",
    emoji: "city",
    control: { kind: "text", placeholder: "e.g. Casablanca", sanitize: "titlecase" },
    isValid: (v) => v.trim().length > 1,
    error: "Please enter your city.",
  },
  {
    slot: { type: "personal", key: "whatsapp_number" },
    title: "What is your WhatsApp number?",
    subtitle: "Your advisor reaches you here. We never share it with anyone.",
    emoji: "chat",
    control: { kind: "phone" },
    isValid: (v) => validWhatsappFor(p.whatsapp_country_code, v),
    error:
      p.whatsapp_country_code.replace(/\s/g, "") === "+212"
        ? "Enter a Moroccan mobile: 06/07 and ten digits, or 6/7 and nine."
        : "Enter a valid WhatsApp number.",
  },
];

const destinationQuestion = (): Question => ({
  slot: { type: "personal", key: "destination_country" },
  title: "Where do you want to study?",
  subtitle: "This one answer decides your programmes, your paperwork and the whole plan we build.",
  emoji: "globe",
  control: {
    kind: "choice",
    columns: 1,
    choices: COUNTRIES.map((c) => ({
      value: c.code,
      label: c.name,
      hint: c.available ? "Available now" : "Coming soon",
      flag: c.stripes,
      disabled: !c.available,
    })),
  },
  isValid: (v) => !!countryByCode(v)?.available,
  error: "Please choose an available destination.",
});

/* ── Building the list ───────────────────────────────────────────────── */

/** Segment labels for the progress bar: "You" then one per country-flow step. */
export function groupLabels(flow: CountryFlow | null): string[] {
  return ["You", ...(flow?.steps.map((s) => s.stepperLabel) ?? [])];
}

const firstName = (full: string) => (full.trim().split(/\s+/)[0] ?? "").trim();

export function buildScreens(personal: Personal, cfa: Cfa, flow: CountryFlow | null): Screen[] {
  const screens: Screen[] = [];

  screens.push({
    kind: "note", id: "welcome", group: 0, emoji: "rocket",
    title: "Let's build your study plan.",
    body: "A few short questions, about two minutes. Every answer shapes the programmes, the price and the roadmap we prepare for you.",
    cta: "Get started",
  });
  screens.push({ kind: "question", id: "q:destination", group: 0, question: destinationQuestion() });
  for (const q of personalQuestions(personal)) {
    screens.push({ kind: "question", id: `q:personal.${(q.slot as { key: string }).key}`, group: 0, question: q });
  }

  if (!flow) return screens;

  flow.steps.forEach((step, i) => {
    const group = i + 1;
    const stepVals = cfa[step.id] ?? {};

    if (i === 0) {
      const name = firstName(personal.full_name);
      screens.push({
        kind: "note", id: "note:studies", group, emoji: "graduation",
        /* A token rather than a finished sentence: the screen translates the
           sentence and then drops the name in, so Darija gets to put the name
           where Darija puts it. The English renders exactly as before. */
        title: name ? "Nice to meet you, {name}." : "Nice to meet you.",
        titleVars: name ? { name } : undefined,
        body: "Now the part that decides everything: what you have studied so far, and what you want to study next.",
        cta: "Continue",
      });
    }
    if (step.custom === "program") {
      screens.push({
        kind: "note", id: "note:program", group, emoji: "magnifier",
        title: "Now the interesting part.",
        body: "Tell us what you want to study and what you can spend, and we will rank real programmes against it.",
        cta: "Continue",
      });
    }

    for (const { primary, followUps } of planFields(step)) {
      if (!fieldVisible(primary, stepVals)) continue;
      const question = questionFor(step, primary, stepVals);
      if (followUps.length) {
        question.followUps = followUps.map((f) => ({
          ...questionFor(step, f, stepVals),
          applies: (c: Cfa) => fieldVisible(f, c[step.id] ?? {}),
        }));
      }
      screens.push({ kind: "question", id: `q:${step.id}.${primary.key}`, group, question });
    }

    if (step.custom === "program") {
      screens.push({
        kind: "program", id: `program:${step.id}`, group, stepId: step.id,
        title: "Pick your programme",
        subtitle: "One programme, the one we build your whole file around. You can ask your advisor to change it later.",
      });
    }
    if (step.custom === "pricing") screens.push({ kind: "pricing", id: `pricing:${step.id}`, group, stepId: step.id });
    if (step.placeholder === "roadmap") screens.push({ kind: "summary", id: "summary", group });
  });

  return screens;
}

/** The value a screen is asking for, read out of the answers. */
export function readSlot(slot: Slot, personal: Personal, cfa: Cfa): string {
  return slot.type === "personal" ? personal[slot.key] ?? "" : cfa[slot.stepId]?.[slot.key] ?? "";
}

/** Whether a screen is answered well enough to move past it.

   Used both to gate Continue and, on arrival, to drop the student back on the
   first thing they have not done — which is why a screen with no question of
   its own still has to answer honestly. Payment is only "done" once the
   receipt has actually been approved. */
export function screenAnswered(screen: Screen, personal: Personal, cfa: Cfa, selectedPrograms: number[]): boolean {
  if (screen.kind === "question") {
    const ok = (q: Question) => { const v = readSlot(q.slot, personal, cfa); return v !== "" && q.isValid(v); };
    if (!ok(screen.question)) return false;
    // A revealed follow-up is part of the same answer, so it gates the same button.
    return (screen.question.followUps ?? []).every((f) => !f.applies?.(cfa) || ok(f));
  }
  if (screen.kind === "program") return selectedPrograms.length > 0;
  if (screen.kind === "pricing") return cfa[screen.stepId]?.status === "approved";
  return true; // notes and the summary
}
