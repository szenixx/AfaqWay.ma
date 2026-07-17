import { createClient } from "@supabase/supabase-js";

/* Browser Supabase client for AfaqWay auth.
   Uses the public URL + publishable (anon) key, both are safe to ship to the
   browser. Session is persisted client-side (localStorage).

   Falls back to placeholder values when the env vars aren't set (e.g. a
   deploy target that hasn't configured them yet), so importing this module
   never crashes page rendering. Real auth calls will fail with a clear
   network error instead of an opaque build-time crash. */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. " +
      "Auth calls will fail until these are configured in the deploy environment.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
