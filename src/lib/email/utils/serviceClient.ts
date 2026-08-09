import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* email_log's RLS only grants INSERT/UPDATE to admins (current_is_admin()),
 * but emails are sent from every kind of caller context — a student's own
 * signup, a Supabase auth hook with no JWT at all, an advisor's chat
 * message. None of those can write the log entry under their own session,
 * so logging needs a service-role client that bypasses RLS entirely.
 *
 * SUPABASE_SERVICE_ROLE_KEY is not set yet (as of this writing). Until it
 * is, this returns null and the send path logs a one-time console warning
 * and skips persistence — the email itself still sends, because a missing
 * log is a lesser failure than a blocked email. */

let cached: SupabaseClient | null | undefined;
let warned = false;

export function serviceClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !key) {
    if (!warned) {
      console.warn("[email] SUPABASE_SERVICE_ROLE_KEY not set — email_log writes are skipped, sends are unaffected.");
      warned = true;
    }
    cached = null;
    return null;
  }

  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}
