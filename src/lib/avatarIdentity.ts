/* Avatar identity — one place that decides what a user's avatar looks like.

   Priority is always: uploaded photo → generated avatar. The generated avatar
   is deterministic: the same seed always produces the same face, so it never
   changes unless the user explicitly asks for a new one. */

export type Gender = "male" | "female" | "prefer_not_to_say";
export type AvatarType = "generated" | "uploaded";

export type AvatarIdentity = {
  gender: Gender;
  avatarType: AvatarType;
  avatarSeed: string;
  avatarStyle: string;
  /** Signed URL of the uploaded photo, when one exists. */
  avatarUrl: string | null;
};

/* Stable hash → a readable seed such as "afaq-843920". */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) { h ^= input.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** A fresh random seed, used at account creation and when the user regenerates. */
export const newSeed = () => `afaq-${Math.floor(100000 + Math.random() * 900000)}`;

/** Deterministic fallback seed, so a user without a stored seed still gets the
    same avatar on every device until one is saved. */
export const seedFromId = (userId: string) => `afaq-${(hash(userId) % 900000) + 100000}`;

/** Gender only picks the initial look; the user can change style afterwards. */
export const styleForGender = (g: Gender): string =>
  g === "male" ? "masculine" : g === "female" ? "feminine" : "neutral";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

/* Theme parts that read as masculine / feminine / neutral. Everything not
   listed here is chosen by the seed, so two users of the same gender still get
   different faces. */
const FEMININE_HAIR = ["straightLong", "straightMedium", "braids", "puff"] as const;
const MASCULINE_FORELOCK = ["short", "underCut", "curve"] as const;
const MASCULINE_FACEHAIR = ["bigBeard", "chevronMustache", "mustache", "none"] as const;

/** Avatar configuration for the avatune theme, derived from seed + style. */
export function avatarConfig(seed: string, style: string): Record<string, unknown> {
  const n = hash(seed);
  if (style === "feminine") {
    return { seed, hair: FEMININE_HAIR[n % FEMININE_HAIR.length], faceHair: "none", faceDetails: n % 2 ? "blushes" : "none" };
  }
  if (style === "masculine") {
    return { seed, hair: "medium", forelock: MASCULINE_FORELOCK[n % MASCULINE_FORELOCK.length], faceHair: MASCULINE_FACEHAIR[n % MASCULINE_FACEHAIR.length] };
  }
  return { seed }; // neutral: the seed decides everything
}

/** Normalises whatever the profile row holds into a complete identity. */
export function identityFrom(row: {
  id?: string | null;
  gender?: string | null;
  avatar_type?: string | null;
  avatar_seed?: string | null;
  avatar_style?: string | null;
  avatarUrl?: string | null;
} | null | undefined, fallbackId = ""): AvatarIdentity {
  const gender = (row?.gender as Gender) ?? "prefer_not_to_say";
  const seed = row?.avatar_seed || seedFromId(row?.id || fallbackId || "afaqway");
  return {
    gender,
    avatarType: (row?.avatar_type as AvatarType) ?? (row?.avatarUrl ? "uploaded" : "generated"),
    avatarSeed: seed,
    avatarStyle: row?.avatar_style || styleForGender(gender),
    avatarUrl: row?.avatarUrl ?? null,
  };
}

/* ── Preset avatars ───────────────────────────────────────────────────────────
   A curated set the user picks from, instead of only rerolling a random seed.
   Presets are seeds, not image files: the same generator draws them, so they
   match the platform's look and cost nothing to ship.

   The set is chosen by gender, and never mixed: a male user is offered
   masculine presets only, a female user feminine ones. Anyone who preferred
   not to say gets the neutral set. */

export type AvatarPreset = { id: string; seed: string; style: string };

/* Two per gender, deliberately few: a short row of clear choices beats a grid
   of near-identical faces. The style comes from the user's gender, so a male
   user only ever sees the masculine pair. */
const PRESET_SEEDS = ["afaq-100417", "afaq-539472"];

/** The presets offered to a user, always matching their gender. */
export function presetsFor(gender: Gender | string | null | undefined): AvatarPreset[] {
  const style = styleForGender((gender as Gender) ?? "prefer_not_to_say");
  return PRESET_SEEDS.map((seed) => ({ id: `${style}-${seed}`, seed, style }));
}

/** True when this seed is one of the offered presets rather than a random one. */
export const isPresetSeed = (seed: string | null | undefined) =>
  Boolean(seed && PRESET_SEEDS.includes(seed));
