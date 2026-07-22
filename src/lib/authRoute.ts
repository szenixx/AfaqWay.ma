import { supabase } from "@/lib/supabase/client";
import { fetchAdminRole } from "@/lib/admin";

/* Single source of truth for "where does a just-authenticated user go?".
   Determines the destination from the user's ROLE immediately, so no login flow
   ever bounces through a generic page (e.g. the user /dashboard) on the way to
   the role-specific one. Used by the /signup form and the /auth/callback route
   (Google OAuth + email-confirm links). */

export type AuthDest = { dest: string | null; error?: string };

// Fresh post-login routing. No single-device block here: an explicit login is
// allowed to claim the device (the workspace does that on mount).
export async function resolvePostLoginDest(): Promise<AuthDest> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { dest: null };
  const { role } = await fetchAdminRole(user.email);
  if (role) return { dest: "/admin" }; // admin → straight to the console
  const { data: prof } = await supabase.from("profiles").select("onboarding_completed_at, banned").eq("id", user.id).maybeSingle();
  if (prof?.banned) { await supabase.auth.signOut(); return { dest: null, error: "Your account is not active. Please contact support." }; }
  return { dest: prof?.onboarding_completed_at ? "/dashboard" : "/profile-setup" };
}
