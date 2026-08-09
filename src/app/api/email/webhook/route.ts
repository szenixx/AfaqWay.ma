import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { updateEmailLog, findEmailLogByProviderMessageId, type EmailLogStatus } from "@/lib/email/utils/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* POST /api/email/webhook — Resend's delivery/open/click/bounce events.
 *
 * Resend signs webhooks the way Svix does (Resend's webhook infrastructure
 * IS Svix): headers `svix-id` / `svix-timestamp` / `svix-signature`, HMAC-
 * SHA256 over "{id}.{timestamp}.{raw body}" with the base64 portion of
 * RESEND_WEBHOOK_SECRET (the "whsec_..." value from the Resend dashboard).
 * Verified by hand with Node's own `crypto` rather than pulling in the
 * `svix` package for one HMAC check.
 *
 * No secret configured, or a bad signature: every event is rejected. That's
 * deliberate and different from the rest of this codebase's "missing
 * config never breaks the workflow" rule — sending mail must never be
 * blocked by a mail problem, but an *inbound* webhook with no verification
 * is an open door for anyone to inject fake delivery events, so here the
 * safe default is closed, not open. */

const TOLERANCE_SECONDS = 5 * 60;

function verify(id: string, timestamp: string, rawBody: string, signatureHeader: string, secret: string): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  // svix-signature can carry multiple space-separated "v1,<sig>" values.
  return signatureHeader.split(" ").some((entry) => {
    const [, sig] = entry.split(",");
    if (!sig) return false;
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

const EVENT_STATUS: Record<string, EmailLogStatus> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

export async function POST(req: Request) {
  const secret = (process.env.RESEND_WEBHOOK_SECRET ?? "").trim();
  if (!secret) {
    console.warn("[email] webhook received but RESEND_WEBHOOK_SECRET is not set — rejecting.");
    return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
  }

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  if (!id || !timestamp || !signature) {
    return NextResponse.json({ error: "missing signature headers" }, { status: 400 });
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > TOLERANCE_SECONDS) {
    return NextResponse.json({ error: "timestamp out of tolerance" }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verify(id, timestamp, rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as { type?: string; data?: { email_id?: string } };
  const status = event.type ? EVENT_STATUS[event.type] : undefined;
  const emailId = event.data?.email_id;

  // Unrecognized event types (email.sent, email.delivery_delayed, and any
  // future type) are accepted (200) but not persisted — nothing to log yet.
  if (!status || !emailId) return NextResponse.json({ ok: true });

  const row = await findEmailLogByProviderMessageId(emailId);
  if (!row) return NextResponse.json({ ok: true }); // nothing to correlate against, not an error

  await updateEmailLog(row.id, { status });
  return NextResponse.json({ ok: true });
}
