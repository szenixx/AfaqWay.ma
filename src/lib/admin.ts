import { supabase } from "@/lib/supabase/client";

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
