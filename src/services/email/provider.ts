import "server-only";
import type { Transporter } from "nodemailer";
import type { EmailContent } from "./templates";

/* The email provider.
 *
 * Server-only: the API key must never reach the browser, exactly like the R2
 * credentials in lib/r2.ts.
 *
 * AfaqWay sends through ZeptoMail, and both of its transports are supported:
 *
 *   api   the ZeptoMail HTTP endpoint. Preferred. Nothing but fetch, no SDK,
 *         no socket, and it works on any runtime including the Edge one.
 *   smtp  the same service over SMTP, for when a mail path must look like
 *         ordinary mail, or when the HTTP endpoint is unreachable.
 *
 * They deliver identical mail; only the wire differs, so switching is a single
 * environment variable and needs no code change.
 *
 * Environment (set in Vercel and .env.local; never commit them):
 *   EMAIL_PROVIDER    "api" | "smtp" — omit to leave email switched off
 *   ZEPTO_TOKEN       the ZeptoMail send-mail token, used by BOTH transports
 *   ZEPTO_API_URL     optional, defaults to the v1.1 endpoint
 *   SMTP_HOST         optional, defaults to smtp.zeptomail.com
 *   SMTP_PORT         optional, defaults to 587 (STARTTLS)
 *
 * ZeptoMail's SMTP username is the literal string "emailapikey" and the
 * password is the same token, so one secret covers both paths.
 *
 * With nothing configured, sending is a no-op that reports `skipped`. That is
 * deliberate: a missing token must never look like a delivered email, and must
 * never take down the action that triggered it. */

export type SendResult =
  | { ok: true; id?: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; error: string };

export type Envelope = {
  to: string;
  /** Recipient display name, used by the API transport. */
  toName?: string | null;
  from: string;
  replyTo?: string;
  content: EmailContent;
};

const env = (name: string) => (process.env[name] ?? "").trim();

/** Both transports authenticate with the same ZeptoMail token. */
const token = () => env("ZEPTO_TOKEN");

/** True when a transport is configured, so callers can report honestly. */
export function emailConfigured(): boolean {
  const provider = env("EMAIL_PROVIDER");
  return (provider === "api" || provider === "smtp") && Boolean(token());
}

/** Name of the active transport, for diagnostics. Never the token itself. */
export function providerName(): string {
  return env("EMAIL_PROVIDER") || "none";
}

/** Splits "Name <address>" into the parts ZeptoMail's API expects. */
function parseAddress(value: string): { address: string; name?: string } {
  const m = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(value);
  return m ? { name: m[1] || undefined, address: m[2] } : { address: value.trim() };
}

async function sendViaApi(envelope: Envelope): Promise<SendResult> {
  try {
    const from = parseAddress(envelope.from);
    const res = await fetch(env("ZEPTO_API_URL") || "https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: {
        // ZeptoMail's own scheme, not Bearer.
        Authorization: token().startsWith("Zoho-enczapikey") ? token() : `Zoho-enczapikey ${token()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: { address: from.address, ...(from.name ? { name: from.name } : {}) },
        to: [{ email_address: { address: envelope.to, ...(envelope.toName ? { name: envelope.toName } : {}) } }],
        ...(envelope.replyTo ? { reply_to: [{ address: envelope.replyTo }] } : {}),
        subject: envelope.content.subject,
        textbody: envelope.content.text,
        htmlbody: envelope.content.html,
      }),
    });

    if (!res.ok) {
      // The service's own message is the useful part; the token is never in it.
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `zeptomail responded ${res.status}: ${detail.slice(0, 200)}` };
    }

    const data = (await res.json().catch(() => ({}))) as { request_id?: string };
    return { ok: true, id: data.request_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

/* ── SMTP ──────────────────────────────────────────────────────────────────
   One transport is created for the process and reused: opening a fresh TLS
   connection per email is slow and, on a mailbox provider, looks like abuse.
   Nodemailer pools and reconnects on its own. */

let transport: Transporter | null = null;

async function smtpTransport(): Promise<Transporter> {
  if (transport) return transport;
  const nodemailer = await import("nodemailer");
  const port = Number(env("SMTP_PORT") || 587);
  transport = nodemailer.createTransport({
    host: env("SMTP_HOST") || "smtp.zeptomail.com",
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS. Never plain text.
    secure: port === 465,
    requireTLS: port !== 465,
    // ZeptoMail authenticates with a fixed username and the token as password.
    auth: { user: env("SMTP_USER") || "emailapikey", pass: token() },
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
  return env("EMAIL_PROVIDER") === "smtp" ? sendViaSmtp(envelope) : sendViaApi(envelope);
}

/** Confirms the mailbox accepts the credentials. Used by the diagnostics route. */
export async function verifyProvider(): Promise<SendResult> {
  if (!emailConfigured()) return { ok: false, skipped: true, reason: "no email provider configured" };
  // Only SMTP can be checked without sending; the HTTP endpoint has no probe.
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
