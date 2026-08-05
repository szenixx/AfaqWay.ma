/* Avatar identity — one place that decides what a user's avatar looks like.

   Priority is always: uploaded photo → default person silhouette. Gender is
   still captured on the profile and still feeds `avatar_style`, kept for a
   future avatar picker, but nothing renders from it today. */

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

/* Preset avatars were removed: a profile picture is uploaded from the device,
   and anyone without one keeps the deterministic generated avatar above. The
   generator stays, so a future picker only needs a UI. */
