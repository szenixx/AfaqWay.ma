import "server-only";
import type { EmailContent } from "./templates";

/* The email provider.
 *
 * Server-only: the API key must never reach the browser, exactly like the R2
 * credentials in lib/r2.ts.
 *
 * The platform has no provider configured yet, so this is an integration layer
 * rather than a binding to one vendor. Resend is implemented because it needs
 * nothing but fetch — no SDK, no dependency, and it works unchanged on Vercel's
 * runtime. Adding SES or Postmark later means one more branch in `send`.
 *
 * Environment (set these in Vercel and .env.local; never commit them):
 *   EMAIL_PROVIDER    "resend" — omit to leave email switched off
 *   RESEND_API_KEY    the provider key
 *
 * With nothing configured, sending is a no-op that reports `skipped`. That is
 * deliberate: a missing key must never look like a delivered email, and must
 * never take down the action that triggered it. */

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; error: string };

export type Envelope = {
  to: string;
  from: string;
  replyTo?: string;
  content: EmailContent;
};

const env = (name: string) => (process.env[name] ?? "").trim();

/** True when a provider is configured, so callers can report honestly. */
export function emailConfigured(): boolean {
  return env("EMAIL_PROVIDER") === "resend" && Boolean(env("RESEND_API_KEY"));
}

/** Name of the active provider, for diagnostics. Never the key itself. */
export function providerName(): string {
  return env("EMAIL_PROVIDER") || "none";
}

async function sendViaResend(envelope: Envelope): Promise<SendResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: envelope.from,
        to: [envelope.to],
        ...(envelope.replyTo ? { reply_to: envelope.replyTo } : {}),
        subject: envelope.content.subject,
        text: envelope.content.text,
        html: envelope.content.html,
      }),
    });

    if (!res.ok) {
      // The provider's own message is the useful part; the key is never in it.
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `provider responded ${res.status}: ${detail.slice(0, 200)}` };
    }

    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

/**
 * Sends one email. Never throws: every failure comes back as a value, so a
 * caller can report it without wrapping the call in a try block and without a
 * mail outage breaking the workflow that sent it.
 */
export async function send(envelope: Envelope): Promise<SendResult> {
  if (!emailConfigured()) {
    return { ok: false, skipped: true, reason: "no email provider configured" };
  }
  return sendViaResend(envelope);
}
