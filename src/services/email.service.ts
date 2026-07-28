import "server-only";
import { REPLY_TO, senderFor, type EmailChannel } from "@/config/email";
import { renderEmail } from "./email/templates";
import { emailConfigured, providerName, send } from "./email/provider";

/* The email service.
 *
 * The one place business logic asks for an email. Callers name a channel and
 * pass content; which sender, which template and which provider are decided
 * here, so no feature has to know any of that and no HTML lives in a component.
 *
 * Nothing here throws. Email is a side effect of something more important
 * happening — a step being approved, an announcement being published — and a
 * mail failure must never undo that. Every result is a value the caller can
 * report to the person who pressed the button. */

export type EmailRequest = {
  channel: EmailChannel;
  to: string;
  subject: string;
  message: string;
  /** Used by the advisor template's greeting; ignored by announcements. */
  recipientName?: string | null;
};

export type EmailOutcome = {
  sent: number;
  failed: number;
  skipped: number;
  /** Present when at least one send failed, for the caller to surface. */
  error?: string;
  /** True when no provider is configured, so nothing was even attempted. */
  notConfigured?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sends one email through the channel's sender and template. */
export async function sendEmail(request: EmailRequest): Promise<EmailOutcome> {
  if (!EMAIL_RE.test(request.to)) {
    return { sent: 0, failed: 1, skipped: 0, error: `invalid recipient: ${request.to}` };
  }

  const content = renderEmail(request.channel, {
    subject: request.subject,
    message: request.message,
    recipientName: request.recipientName,
  });

  const result = await send({
    to: request.to,
    from: senderFor(request.channel),
    replyTo: REPLY_TO,
    content,
  });

  if (result.ok) return { sent: 1, failed: 0, skipped: 0 };
  if (result.skipped) {
    // Not an error: the platform simply has no provider yet.
    return { sent: 0, failed: 0, skipped: 1, notConfigured: true };
  }

  console.error("[email] send failed", { channel: request.channel, provider: providerName(), error: result.error });
  return { sent: 0, failed: 1, skipped: 0, error: result.error };
}

/**
 * Sends the same message to many recipients, in small batches.
 *
 * Batched so an announcement to a large audience does not open hundreds of
 * simultaneous connections, and so one bad address cannot stop the rest.
 */
export async function sendBulkEmail(
  recipients: { email: string; name?: string | null }[],
  request: Omit<EmailRequest, "to" | "recipientName">,
): Promise<EmailOutcome> {
  if (!emailConfigured()) {
    return { sent: 0, failed: 0, skipped: recipients.length, notConfigured: true };
  }

  const BATCH = 8;
  const totals: EmailOutcome = { sent: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < recipients.length; i += BATCH) {
    const slice = recipients.slice(i, i + BATCH);
    const results = await Promise.all(slice.map((person) =>
      sendEmail({ ...request, to: person.email, recipientName: person.name })));

    for (const r of results) {
      totals.sent += r.sent;
      totals.failed += r.failed;
      totals.skipped += r.skipped;
      if (r.error && !totals.error) totals.error = r.error;
    }
  }
  return totals;
}

export { emailConfigured, providerName };
