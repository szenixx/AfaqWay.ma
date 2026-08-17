import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";
import { storageErrorResponse } from "@/lib/storage/respond";
import { StorageError } from "@/types/storage";
import { send, emailConfigured, providerName, verifyProvider } from "@/lib/email/send";
import AnnouncementEmail, { meta as announcementMeta } from "@/lib/email/templates/notifications/AnnouncementEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/admin/email-health — super admin only.
 *
 * The one-button version of what a human otherwise does by hand: check the
 * key is present, check it's actually valid (not just present), prove the
 * whole pipeline works end to end with a real send, and surface what's
 * been failing recently. Everything here is genuinely auto-checkable.
 *
 * What this can NOT do, and says so rather than pretending: if the key is
 * missing or truly dead, no code running inside this website can fix that —
 * fixing it means setting RESEND_API_KEY in the hosting provider's own
 * environment variables and redeploying. A button that could rewrite its
 * own infrastructure secrets from a web request would be a serious
 * security hole, not a convenience. So a broken key comes back as a clear,
 * specific instruction for a human, never a silent "fixed". */

type Check = { name: string; ok: boolean; detail: string };

export async function POST(req: Request) {
  try {
    const { caller, supabase } = await authenticate(req);
    if (!caller.isSuperAdmin) throw new StorageError("forbidden", "forbidden", 403);

    const checks: Check[] = [];

    const configured = emailConfigured();
    checks.push({
      name: "RESEND_API_KEY present",
      ok: configured,
      detail: configured
        ? "Set."
        : "Missing. Set RESEND_API_KEY in your hosting provider's environment variables (e.g. Vercel → Project Settings → Environment Variables) for Production, then redeploy. Nothing running inside the app can set this for itself.",
    });

    if (configured) {
      const verify = await verifyProvider();
      checks.push({
        name: "Key is valid",
        ok: verify.status === "sent",
        detail: verify.status === "sent"
          ? `Confirmed against Resend (provider: ${providerName()}).`
          : `Resend rejected the key: ${"error" in verify ? verify.error : "unknown reason"}. It may have been revoked or replaced — generate a fresh key in the Resend dashboard, update RESEND_API_KEY, and redeploy.`,
      });
    }

    // The definitive check: an actual send through the real pipeline, to
    // the super admin's own address — never a student's, so this can run
    // safely at any time without bothering anyone.
    if (configured && caller.email) {
      const result = await send({
        to: caller.email,
        sender: "notifications",
        subject: "AfaqWay email health check",
        react: (
          <AnnouncementEmail message={`This is an automatic health check, triggered from the admin dashboard.\n\nIf you're reading this, email sending is working correctly.\n\nChecked at ${new Date().toLocaleString("en-US", { timeZone: "Africa/Casablanca" })} (Casablanca time).`} />
        ),
        template: announcementMeta,
      });
      checks.push({
        name: "Live test send",
        ok: result.status === "sent",
        detail: result.status === "sent"
          ? `Test email sent to ${caller.email} — check your inbox to confirm delivery.`
          : result.status === "skipped"
            ? "Skipped: no provider configured."
            : `Send failed: ${"error" in result ? result.error : "unknown error"}.`,
      });
    }

    // Recent history, so a working key that's still quietly failing sends
    // (bad recipient addresses, a sender domain issue, etc.) doesn't read
    // as "all clear" just because the key itself checks out. Uses the
    // caller's own RLS-scoped client — current_is_admin() covers any admin,
    // and this route only ever reaches here for a super admin.
    const { data: logRows } = await supabase
      .from("email_log")
      .select("status, error, created_at")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    let recentFailures = 0;
    let recentSent = 0;
    let lastError: string | null = null;
    for (const row of (logRows ?? []) as { status: string; error: string | null }[]) {
      if (row.status === "failed") { recentFailures++; if (!lastError && row.error) lastError = row.error; }
      if (row.status === "sent") recentSent++;
    }
    checks.push({
      name: "Last 24h send history",
      ok: recentFailures === 0,
      detail: recentFailures === 0
        ? `${recentSent} sent, no failures in the last 24 hours.`
        : `${recentFailures} failed, ${recentSent} sent in the last 24 hours. Most recent error: ${lastError ?? "not recorded"}.`,
    });

    const ok = checks.every((c) => c.ok);
    return NextResponse.json({ ok, checks });
  } catch (err) {
    return storageErrorResponse(err);
  }
}
