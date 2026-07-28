"use client";

import { supabase } from "@/lib/supabase/client";
import { newSeed, styleForGender, type Gender } from "@/lib/avatarIdentity";

/* Reads and writes the avatar columns on public.profiles.

   The columns arrive with supabase/migrations/20260725_avatar_identity.sql.
   Until that migration is applied every helper here degrades silently, so the
   platform keeps working and simply falls back to a deterministic seed derived
   from the user id. */

export type AvatarFields = { gender: Gender | null; avatar_type: string | null; avatar_seed: string | null; avatar_style: string | null };

const COLUMNS = "id, gender, avatar_type, avatar_seed, avatar_style";

/** Avatar fields for a set of users. Returns an empty map if the columns are
    not there yet — callers then use the deterministic fallback seed. */
export async function loadAvatarFields(ids: string[]): Promise<Map<string, AvatarFields>> {
  const map = new Map<string, AvatarFields>();
  if (!ids.length) return map;
  const { data, error } = await supabase.from("profiles").select(COLUMNS).in("id", ids);
  if (error || !data) return map;
  (data as (AvatarFields & { id: string })[]).forEach((r) => map.set(r.id, r));
  return map;
}

export async function loadAvatarFieldsFor(id: string): Promise<AvatarFields | null> {
  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as AvatarFields;
}

/** Called when onboarding finishes: every user leaves with a generated avatar. */
export async function ensureGeneratedAvatar(userId: string, gender: Gender): Promise<{ seed: string; style: string }> {
  const existing = await loadAvatarFieldsFor(userId);
  const seed = existing?.avatar_seed || newSeed();
  const style = existing?.avatar_style || styleForGender(gender);
  await supabase.from("profiles").update({
    avatar_seed: seed,
    avatar_style: style,
    avatar_type: existing?.avatar_type === "uploaded" ? "uploaded" : "generated",
  }).eq("id", userId);
  return { seed, style };
}

/** Explicit regeneration — the only moment a new face is produced. */
export async function regenerateAvatar(userId: string): Promise<string> {
  const seed = newSeed();
  await supabase.from("profiles").update({ avatar_seed: seed, avatar_type: "generated", avatar_path: null }).eq("id", userId);
  return seed;
}

/** Switching back from an uploaded photo to the generated avatar. */
export async function removeUploadedPhoto(userId: string): Promise<void> {
  await supabase.from("profiles").update({ avatar_path: null, avatar_type: "generated" }).eq("id", userId);
}

/** After a successful upload. */
export async function setUploadedPhoto(userId: string, path: string): Promise<void> {
  await supabase.from("profiles").update({ avatar_path: path, avatar_type: "uploaded" }).eq("id", userId);
}
