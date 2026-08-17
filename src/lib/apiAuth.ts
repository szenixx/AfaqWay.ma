import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { StorageError } from "@/types/storage";

/* Request authentication for API routes.
   The browser sends its Supabase access token; we verify it server-side and
   hand back a Supabase client bound to that token, so every query the route
   makes runs under the caller's own RLS policies and can never read another
   user's rows. */

export type Caller = { id: string; email: string | null; isAdmin: boolean; isSuperAdmin: boolean };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function bearer(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

/** Verifies the Authorization header. Throws 401 when missing or invalid. */
export async function authenticate(req: Request): Promise<{ caller: Caller; supabase: SupabaseClient }> {
  const token = bearer(req);
  if (!token || !SUPABASE_URL || !SUPABASE_ANON) throw new StorageError("forbidden", "unauthorized", 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new StorageError("forbidden", "unauthorized", 401);

  // RLS applies, so this lookup can only ever return the caller's own row.
  let isAdmin = false;
  let isSuperAdmin = false;
  if (data.user.email) {
    const { data: admin } = await supabase.from("admins").select("role, banned").eq("email", data.user.email.toLowerCase()).maybeSingle();
    const row = admin as { role?: string; banned?: boolean } | null;
    isAdmin = !!row && !row.banned;
    isSuperAdmin = isAdmin && row?.role === "superadmin";
  }

  return { caller: { id: data.user.id, email: data.user.email ?? null, isAdmin, isSuperAdmin }, supabase };
}
