"use client";

/* OAuth / email-confirm landing. Supabase exchanges the URL code for a session
   on load; we then resolve the role and go DIRECTLY to /admin, /dashboard or
   /profile-setup. This page only ever shows a neutral loader — an admin never
   flashes the user dashboard first. router.replace keeps it out of history, so
   the back button skips it. */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { resolvePostLoginDest } from "@/lib/authRoute";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let done = false;
    const go = async () => {
      if (done) return;
      const { dest, error } = await resolvePostLoginDest();
      if (done) return;
      if (dest) { done = true; router.replace(dest); }
      else if (error) { done = true; router.replace(`/signup?reason=inactive`); }
    };

    // Session may already be present, or arrive right after the code exchange.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { if (session) void go(); });
    void go();

    // Fallback: if nothing resolved (no/failed session), send back to the form.
    const t = setTimeout(() => { if (!done) { done = true; router.replace("/signup"); } }, 6000);
    return () => { done = true; subscription.unsubscribe(); clearTimeout(t); };
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", color: "var(--ink-faint)", font: "400 15px/24px var(--font-sans)" }}>
      Signing you in…
    </div>
  );
}
