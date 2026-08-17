"use client";

import { useState } from "react";
import { MailCheck, CircleCheck, CircleX, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Loader, Portal } from "@/components/ds";

type Check = { name: string; ok: boolean; detail: string };
type Result = { ok: boolean; checks: Check[] } | { error: string };

/** Super admin only — this button only ever renders inside SuperAdminBar,
 *  which only ever renders inside OverviewGrid, already gated to
 *  role === "superadmin" one level up (src/app/admin/page.tsx). The API
 *  route re-checks isSuperAdmin itself too, so the page gate isn't the
 *  only thing standing between a regular admin and this — just the reason
 *  one never sees the button in the first place. */
export function EmailHealthButton() {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setRunning(true);
    setResult(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setResult({ error: "Not signed in." }); return; }
      const res = await fetch("/api/admin/email-health", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) setResult({ error: payload.error ?? `Request failed (${res.status}).` });
      else setResult(payload as Result);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Network error." });
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); if (!result && !running) void run(); }}
        title="Diagnose the email system"
        aria-label="Diagnose the email system"
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 0,
          width: 38, height: 38, borderRadius: 999, flex: "none",
          border: "1px solid rgba(59,91,219,.22)", background: "rgba(255,255,255,.7)",
          color: "var(--indigo-600)", cursor: "pointer",
        }}
      >
        <MailCheck size={16} />
      </button>

      {open && (
        <Portal>
          <div
            role="dialog" aria-modal="true" aria-label="Email system health"
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(23,35,58,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "0 24px 60px rgba(23,35,58,.3)", padding: 22 }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                <div>
                  <h2 style={{ margin: 0, font: "700 17px/23px var(--font-sans)", color: "var(--ink)" }}>Email system</h2>
                  <p style={{ margin: "3px 0 0", font: "400 12.5px/19px var(--font-sans)", color: "var(--ink-faint)" }}>
                    Checks the Resend key, proves it with a real send to your own inbox, and reviews the last 24 hours.
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ flex: "none", border: "none", background: "none", cursor: "pointer", color: "var(--ink-faint)", padding: 4 }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                {running && (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 0", font: "500 13px/1 var(--font-sans)", color: "var(--ink-soft)" }}>
                    <Loader size={18} /> Running checks…
                  </div>
                )}
                {result && "error" in result && (
                  <p style={{ margin: 0, font: "500 12.5px/19px var(--font-sans)", color: "var(--red)" }}>{result.error}</p>
                )}
                {result && "checks" in result && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12,
                      background: result.ok ? "var(--green-tint)" : "var(--red-tint)",
                      color: result.ok ? "var(--green)" : "var(--red)",
                      font: "700 12.5px/1 var(--font-sans)",
                    }}>
                      {result.ok ? <CircleCheck size={15} /> : <CircleX size={15} />}
                      {result.ok ? "Everything checks out." : "Something needs attention — see below."}
                    </div>
                    {result.checks.map((c) => (
                      <div key={c.name} style={{ display: "flex", gap: 9 }}>
                        <span style={{ flex: "none", marginTop: 2, color: c.ok ? "var(--green)" : "var(--red)" }}>
                          {c.ok ? <CircleCheck size={14} /> : <CircleX size={14} />}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ font: "600 12.5px/17px var(--font-sans)", color: "var(--ink)" }}>{c.name}</div>
                          <div style={{ font: "400 12px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{c.detail}</div>
                        </div>
                      </div>
                    ))}
                    {!result.ok && (
                      <p style={{ margin: "4px 0 0", font: "400 11.5px/17px var(--font-sans)", color: "var(--ink-faint)" }}>
                        Anything flagged above that needs a key change or a redeploy can only be fixed outside the app —
                        a website should never be able to rewrite its own infrastructure secrets.
                      </p>
                    )}
                    <button
                      type="button" onClick={run} disabled={running}
                      style={{ alignSelf: "flex-start", marginTop: 4, height: 34, padding: "0 14px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", color: "var(--ink)" }}
                    >
                      Run again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

export default EmailHealthButton;
