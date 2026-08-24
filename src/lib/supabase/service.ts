import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* The platform's one service-role Supabase client.

   Bypasses RLS entirely, so every caller must check its own authorization
   before using it — this file grants no permission by itself. Originally
   built for email_log (RLS there only grants admins, but email sends from
   every kind of caller context), it is the same client any server-side task
   needs when it must write past a guard trigger legitimately: journey_progress
   and journey_stage_approvals' guards explicitly trust `role = 'service_role'`
   (see supabase/migrations/journey/09_review_workflow.sql, journey_privileged()),
   which is exactly what this client's key carries.

   SUPABASE_SERVICE_ROLE_KEY may not be set. Until it is, this returns null and
   callers must degrade — for email logging that means skipping the log entry
   and still sending; for a tester action it means reporting "not configured"
   rather than silently doing nothing. */

let cached: SupabaseClient | null | undefined;
let warned = false;

export function serviceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !key) {
    if (!warned) {
      console.warn("[supabase] SUPABASE_SERVICE_ROLE_KEY not set — service-role writes are unavailable.");
      warned = true;
    }
    cached = null;
    return null;
  }

  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
