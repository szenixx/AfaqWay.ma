import "server-only";
import { render } from "@react-email/render";
import { senderFor, replyToFor, SENDERS } from "./senders";
import { sendViaResend } from "./resend/provider";
import { logEmailQueued, updateEmailLog } from "./utils/log";
import type { SendEmailInput, SendEmailResult } from "./types";

export { emailConfigured, providerName, verifyProvider } from "./resend/provider";

/**
 * The one function every template caller uses to actually send mail.
 * Renders `react` to html+text (skipped if `html`/`text` were passed
 * directly), resolves the sender identity, writes an email_log "queued"
 * row, sends through Resend with retry, then patches the log row with the
 * outcome. Never throws — a caller gets a typed result back exactly like
 * the old services/email/provider.ts contract, just with a `status` field
 * instead of `ok`/`skipped`.
 */
export async function send(input: SendEmailInput): Promise<SendEmailResult> {
  const to = Array.isArray(input.to) ? input.to : [input.to];
  if (to.length === 0 || !to[0]) {
    return { status: "failed", error: "no recipient address given" };
  }

  const html = input.html ?? (input.react ? await render(input.react, { pretty: false }) : "");
  const text = input.text ?? (input.react ? await render(input.react, { plainText: true }) : "");
  if (!html) return { status: "failed", error: "no template content: pass `react` or `html`" };

  const from = senderFor(input.sender);
  const replyTo = input.replyTo ?? replyToFor(input.sender);
  const fromEmail = SENDERS()[input.sender].address;

  const logId = await logEmailQueued({
    channel: input.template?.category ?? "unknown",
    template: input.template,
    toEmail: to[0],
    sender: input.sender,
    fromEmail,
    subject: input.subject,
    locale: input.locale,
    metadata: to.length > 1 ? { additionalRecipients: to.length - 1 } : undefined,
  });

  const result = await sendViaResend({
    from,
    to,
    subject: input.subject,
    html,
    text,
    replyTo,
    tags: input.tags ? Object.entries(input.tags).map(([name, value]) => ({ name, value })) : undefined,
  });

  if (logId) {
    if (result.status === "sent") {
      await updateEmailLog(logId, { status: "sent", providerMessageId: result.id });
    } else if (result.status === "failed") {
      await updateEmailLog(logId, { status: "failed", error: result.error });
    } else {
      await updateEmailLog(logId, { status: "skipped", error: result.reason });
    }
  }

  return result;
}
