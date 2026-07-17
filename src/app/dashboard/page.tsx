"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ds";
import { StatusCircle, IconCheck } from "@/components/home/ui";

/* Temporary post-auth landing, only confirms auth works end to end.
   Delete this once the real onboarding/dashboard is built. */
export default function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/signup");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <header style={{ height: 60, flex: "none", background: "var(--card)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8, padding: "0 20px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="30" height="30" viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }}>
            <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M29 28 48 45 67 28" />
              <path d="M29 54 48 71 67 54" />
            </g>
          </svg>
          <span style={{ font: "700 20px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.01em" }}>AfaqWay</span>
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="card" style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>
          <span className="pill pill-grey">Temporary page, will be removed</span>
          {loading ? (
            <p style={{ font: "400 15px/24px var(--font-sans)", color: "var(--ink-soft)", margin: "16px 0 0" }}>Loading your session…</p>
          ) : email ? (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
                <StatusCircle size={48} tone="green"><IconCheck size={24} /></StatusCircle>
              </div>
              <h1 style={{ font: "700 24px/32px var(--font-sans)", color: "var(--ink)", margin: "16px 0 0" }}>Login successful!</h1>
              <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "8px 0 0" }}>
                Signed in as <strong style={{ color: "var(--ink)" }}>{email}</strong>. This confirmation page is temporary, it will be replaced once we build the real onboarding.
              </p>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                <Button variant="neutral" onClick={signOut}>Sign out</Button>
              </div>
            </>
          ) : (
            <>
              <h1 style={{ font: "700 24px/32px var(--font-sans)", color: "var(--ink)", margin: "16px 0 0" }}>You are not signed in</h1>
              <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "8px 0 0" }}>Log in or create an account to continue.</p>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                <Link href="/signup"><Button variant="primary">Go to sign in</Button></Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
