"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ds";
import { supabase } from "@/lib/supabase/client";

/* Flat 60px top bar for the onboarding shell. No search (this platform has none).
   Profile dropdown shows only Log out, since the user has no profile yet. */
export default function OnboardingTopBar({ planLabel, profileId }: { planLabel?: string; profileId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/signup");
  }

  return (
    <header style={{ height: 60, flex: "none", background: "var(--card)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <svg width="30" height="30" viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }} aria-hidden>
          <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M29 28 48 45 67 28" />
            <path d="M29 54 48 71 67 54" />
          </g>
        </svg>
        <span style={{ font: "700 20px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.01em" }}>AfaqWay</span>
      </Link>

      <div style={{ position: "relative" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >
          <span style={{ width: 32, height: 32, borderRadius: 999, background: "var(--indigo-100)", color: "var(--indigo-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="settings" size={16} />
          </span>
          <Icon name="chevron-down" size={12} style={{ color: "var(--ink-faint)" }} />
        </button>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} aria-hidden />
            <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, minWidth: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-card)", padding: 6, zIndex: 40 }}>
              {profileId && (
                <div style={{ padding: "6px 12px 8px", borderBottom: "1px solid var(--line-soft)", marginBottom: 4, font: "600 11px/16px var(--font-sans)", color: "var(--ink-faint)" }}>
                  Profile ID: <span style={{ color: "var(--ink)" }}>{profileId}</span>
                </div>
              )}
              {planLabel && (
                <div style={{ padding: "6px 12px 10px", borderBottom: "1px solid var(--line-soft)", marginBottom: 4 }}>
                  <div style={{ font: "500 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>Your plan</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)" }}>{planLabel}</span>
                    <span className="pill pill-green">Paid</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={logout}
                style={{ width: "100%", height: 36, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "500 13px/20px var(--font-sans)", color: "var(--red)", textAlign: "left" }}
              >
                <Icon name="logout" size={16} />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
