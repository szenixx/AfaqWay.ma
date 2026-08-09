import "server-only";
import { send, emailConfigured } from "./send";
import AnnouncementEmail, { meta as announcementMeta } from "./templates/notifications/AnnouncementEmail";
import AdvisorMessageEmail, { meta as advisorMeta } from "./templates/advisor/AdvisorMessageEmail";

export { emailConfigured, providerName, verifyProvider } from "./send";

/* The email service — same role as the old services/email.service.ts:
 * the one place business logic asks for an email by channel name. Kept the
 * same EmailRequest/EmailOutcome shape and the same two channel names
 * ("announcement", "advisor") so /api/email/route.ts and the browser-side
 * callers in lib/email/client.ts needed no change beyond the import path. */

export type EmailChannel = "announcement" | "advisor";

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
  error?: string;
  notConfigured?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendEmail(request: EmailRequest): Promise<EmailOutcome> {
  if (!EMAIL_RE.test(request.to)) {
    return { sent: 0, failed: 1, skipped: 0, error: `invalid recipient: ${request.to}` };
  }

  const result = request.channel === "advisor"
    ? await send({
        to: request.to,
        sender: "advisor",
        subject: request.subject,
        react: <AdvisorMessageEmail message={request.message} recipientName={request.recipientName} />,
        template: advisorMeta,
      })
    : await send({
        to: request.to,
        sender: "notifications",
        subject: request.subject,
        react: <AnnouncementEmail message={request.message} />,
        template: announcementMeta,
      });

  if (result.status === "sent") return { sent: 1, failed: 0, skipped: 0 };
  if (result.status === "skipped") return { sent: 0, failed: 0, skipped: 1, notConfigured: true };

  console.error("[email] send failed", { channel: request.channel, error: result.error });
  return { sent: 0, failed: 1, skipped: 0, error: result.error };
}

/**
 * Sends the same message to many recipients, in small batches — so an
 * announcement to a large audience doesn't open hundreds of simultaneous
 * connections, and one bad address can't stop the rest.
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
