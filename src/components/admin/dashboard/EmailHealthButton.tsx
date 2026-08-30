"use client";

import { useState } from "react";
import { MailCheck, CircleCheck, CircleX } from "lucide-react";
import { Button, Chip, Skeleton, Tooltip } from "@heroui/react";
import { supabase } from "@/lib/supabase/client";
import { AdminDialog } from "@/components/admin/AdminDialog";

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
      <Tooltip>
        <Tooltip.Trigger>
          <Button
            aria-label="Diagnose the email system" isIconOnly
            onPress={() => { setOpen(true); if (!result && !running) void run(); }}
            size="sm" variant="tertiary"
          >
            <MailCheck size={16} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Diagnose the email system</Tooltip.Content>
      </Tooltip>

      {open && (
        <AdminDialog
          description="Checks the Resend key, proves it with a real send to your own inbox, and reviews the last 24 hours."
          footer={result && "checks" in result && (
            <Button isDisabled={running} onPress={run} size="sm" variant="secondary">Run again</Button>
          )}
          icon={<MailCheck className="size-5" />}
          onClose={() => setOpen(false)}
          title="Email system"
        >
          {running && (
            <div className="afq-empty" style={{ padding: "6px 0" }}>
              <Skeleton className="h-4 w-40 rounded-md" />
              <Skeleton className="h-4 w-56 rounded-md" />
            </div>
          )}
          {result && "error" in result && <p className="afq-form-err">{result.error}</p>}
          {result && "checks" in result && (
            <div className="afq-form">
              <Chip color={result.ok ? "success" : "danger"} size="sm" variant="soft">
                {result.ok ? <CircleCheck size={13} /> : <CircleX size={13} />}
                {result.ok ? "Everything checks out." : "Something needs attention — see below."}
              </Chip>
              {result.checks.map((c) => (
                <div key={c.name} style={{ display: "flex", gap: 9 }}>
                  <span style={{ flex: "none", marginTop: 2, color: c.ok ? "#256B49" : "#8C2E1E" }}>
                    {c.ok ? <CircleCheck size={14} /> : <CircleX size={14} />}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="afq-mini-title">{c.name}</div>
                    <div className="afq-mini-sub">{c.detail}</div>
                  </div>
                </div>
              ))}
              {!result.ok && (
                <p className="afq-dialog-desc">
                  Anything flagged above that needs a key change or a redeploy can only be fixed outside the app —
                  a website should never be able to rewrite its own infrastructure secrets.
                </p>
              )}
            </div>
          )}
        </AdminDialog>
      )}
    </>
  );
}

export default EmailHealthButton;
