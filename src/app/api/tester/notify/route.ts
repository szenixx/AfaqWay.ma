import "server-only";
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Exercises the real notifications table with the same {kind, title, body,
   link, meta} shapes production actually writes (see src/lib/notify() and
   src/lib/journeyNotify.ts's notifyReview()) — never a separate mock. Scoped
   to the notification CENTRE only: notifyReview() also drops a chat message
   as "admin", which is a different feature (student ↔ advisor messaging) with
   its own RLS this tester account has no reason to bypass, and isn't what
   "test notification states" is asking to exercise. */
const SCENARIOS: Record<string, { kind: string; title: string; body: string; link: string; meta?: Record<string, string> }> = {
  platform_update:  { kind: "update",  title: "Test: Platform update", body: "This is a test platform announcement, sent from the Tester Controls panel.", link: "notifications" },
  journey_approved: { kind: "journey", title: "You have a new journey update", body: "Open your conversation to read it.", link: "messages", meta: { status: "approved" } },
  journey_rejected: { kind: "journey", title: "You have a new journey update", body: "Open your conversation to read it.", link: "messages", meta: { status: "rejected" } },
  journey_changes:  { kind: "journey", title: "You have a new journey update", body: "Open your conversation to read it.", link: "messages", meta: { status: "changes" } },
  advisor_reminder: { kind: "schedule", title: "Reminder from your advisor", body: "This is a test reminder notification.", link: "schedule" },
  unread:           { kind: "system",  title: "Test notification", body: "This is a test unread notification.", link: "notifications" },
};

export async function POST(req: Request) {
  try {
    const { caller, supabase } = await authenticate(req);
    if (!caller.isTester) return NextResponse.json({ error: "Not available." }, { status: 403 });

    const body = await req.json().catch(() => null) as { action?: unknown; scenario?: unknown } | null;

    if (body?.action === "mark_all_read") {
      // Identical to what the bell's own "mark all as read" already does —
      // notifications_update already grants a caller their own row, tester or not.
      const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", caller.id).eq("read", false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    const scenario = typeof body?.scenario === "string" ? SCENARIOS[body.scenario] : undefined;
    if (!scenario) return NextResponse.json({ error: "Unknown scenario." }, { status: 400 });

    // notifications_insert already grants `user_id = auth.uid()` to any
    // authenticated caller — this only ever targets the caller's own inbox.
    const row: Record<string, unknown> = { user_id: caller.id, kind: scenario.kind, title: scenario.title, body: scenario.body, link: scenario.link };
    if (scenario.meta) row.meta = scenario.meta;
    const { error } = await supabase.from("notifications").insert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 401 });
  }
}
