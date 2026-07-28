import "server-only";
import type { Transporter } from "nodemailer";
import type { EmailContent } from "./templates";

/* The email provider.
 *
 * Server-only: the API key must never reach the browser, exactly like the R2
 * credentials in lib/r2.ts.
 *
 * Two providers, chosen by environment. SMTP is the one AfaqWay uses (Zoho);
 * Resend is kept because it needs nothing but fetch, which makes it a useful
 * fallback and a template for adding another vendor. Adding SES or Postmark
 * later means one more branch in `send`.
 *
 * Environment (set these in Vercel and .env.local; never commit them):
 *   EMAIL_PROVIDER    "smtp" | "resend" — omit to leave email switched off
 *
 *   SMTP_HOST         e.g. smtp.zoho.com
 *   SMTP_PORT         465 for implicit TLS, 587 for STARTTLS
 *   SMTP_USER         the full mailbox address
 *   SMTP_PASSWORD     an app-specific password, never the account password
 *
 *   RESEND_API_KEY    only when EMAIL_PROVIDER=resend
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
  const provider = env("EMAIL_PROVIDER");
  if (provider === "smtp") return Boolean(env("SMTP_HOST") && env("SMTP_USER") && env("SMTP_PASSWORD"));
  if (provider === "resend") return Boolean(env("RESEND_API_KEY"));
  return false;
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

/* ── SMTP (Zoho) ───────────────────────────────────────────────────────────
   One transport is created for the process and reused: opening a fresh TLS
   connection per email is slow and, on a mailbox provider, looks like abuse.
   Nodemailer pools and reconnects on its own. */

let transport: Transporter | null = null;

async function smtpTransport(): Promise<Transporter> {
  if (transport) return transport;
  const nodemailer = await import("nodemailer");
  const port = Number(env("SMTP_PORT") || 465);
  transport = nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS. Never plain text.
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASSWORD") },
    pool: true,
    maxConnections: 3,
  });
  return transport;
}

async function sendViaSmtp(envelope: Envelope): Promise<SendResult> {
  try {
    const mailer = await smtpTransport();
    const info = await mailer.sendMail({
      from: envelope.from,
      to: envelope.to,
      ...(envelope.replyTo ? { replyTo: envelope.replyTo } : {}),
      subject: envelope.content.subject,
      text: envelope.content.text,
      html: envelope.content.html,
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    /* A bad credential invalidates the pooled transport, so it is dropped and
       rebuilt on the next attempt rather than failing forever. */
    transport = null;
    return { ok: false, error: err instanceof Error ? err.message : "smtp error" };
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
  return env("EMAIL_PROVIDER") === "smtp" ? sendViaSmtp(envelope) : sendViaResend(envelope);
}

/** Confirms the mailbox accepts the credentials. Used by the diagnostics route. */
export async function verifyProvider(): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, skipped: true, reason: "no email provider configured" };
  if (env("EMAIL_PROVIDER") !== "smtp") return { ok: true };
  try {
    const mailer = await smtpTransport();
    await mailer.verify();
    return { ok: true };
  } catch (err) {
    transport = null;
    return { ok: false, error: err instanceof Error ? err.message : "smtp verify failed" };
  }
}
