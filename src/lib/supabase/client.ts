import { createClient } from "@supabase/supabase-js";

/* Browser Supabase client for AfaqWay auth.
   Uses the public URL + publishable (anon) key from .env.local — both are safe to
   ship to the browser. Session is persisted client-side (localStorage). */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
