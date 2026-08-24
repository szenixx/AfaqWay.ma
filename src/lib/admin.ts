import { supabase } from "@/lib/supabase/client";
import { TESTER_EMAIL } from "@/lib/tester";

export type AdminRole = "admin" | "superadmin" | null;

/* Reads the caller's admin record (RLS lets a user read only their own row).
   Returns null role for normal users. */
export async function fetchAdminRole(email: string | undefined | null): Promise<{ role: AdminRole; grantedFeatures: string[]; name: string | null }> {
  if (!email) return { role: null, grantedFeatures: [], name: null };
  const { data } = await supabase.from("admins").select("role, granted_features, banned, name").eq("email", email.toLowerCase()).maybeSingle();
  if (!data || (data as { banned?: boolean }).banned) return { role: null, grantedFeatures: [], name: null };
  const row = data as { role: string; granted_features: string[] | null; name: string | null };
  return { role: row.role as AdminRole, grantedFeatures: row.granted_features ?? [], name: row.name };
}

/* Every staff email, lowercased.

   Statistics count STUDENTS, and an administrator who signs in gets a profile
   row like anyone else — so without this the team shows up in "Users", in the
   new-signups trend and in the plan splits, and a platform with no students at
   all still reports one. Membership of `admins` is the only thing that makes an
   account staff, so it is the only thing this checks.

   Returns an empty set if the lookup fails, which counts staff as students
   rather than hiding real students behind a failed query. */
export async function fetchStaffEmails(): Promise<Set<string>> {
  const { data, error } = await supabase.from("admins").select("email");
  if (error || !data) return new Set();
  return new Set((data as { email: string }[]).map((r) => (r.email ?? "").toLowerCase()).filter(Boolean));
}

/** True when this profile belongs to a member of the team, not a student. */
export const isStaffProfile = (staff: Set<string>, email: string | null | undefined): boolean =>
  !!email && staff.has(email.toLowerCase());

/** Staff plus the excluded tester account (lib/tester.ts — the single source
    for that email), lowercased: every account that should not count toward a
    user or revenue statistic anywhere in the admin workspace. The tester
    account itself stays fully functional; only its contribution to
    statistics is dropped. */
export async function fetchStatExclusions(): Promise<Set<string>> {
  const excluded = await fetchStaffEmails();
  excluded.add(TESTER_EMAIL);
  return excluded;
}
