import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import type { SenderId } from "../senders";
import type { TemplateMeta } from "../types";
import type { Locale } from "../i18n/locales";

/* email_log is append-then-update: one row per send attempt, created
 * "queued" before the Resend call, then patched to its outcome ("sent" /
 * "failed" / "skipped") right after. Webhook events (Todo #11) will later
 * patch the same row again as "delivered" / "opened" / "clicked" /
 * "bounced", keyed by provider_message_id. */

export type EmailLogStatus =
  | "queued" | "sent" | "failed" | "skipped"
  | "delivered" | "opened" | "clicked" | "bounced" | "complained";

export async function logEmailQueued(input: {
  channel: string;
  template?: TemplateMeta;
  toEmail: string;
  toName?: string;
  sender: SenderId;
  fromEmail: string;
  subject: string;
  locale?: Locale;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data, error } = await db
    .from("email_log")
    .insert({
      channel: input.channel,
      template_version: input.template ? `${input.template.id}@${input.template.version}` : null,
      to_email: input.toEmail,
      to_name: input.toName ?? null,
      from_email: input.fromEmail,
      subject: input.subject,
      provider: "resend",
      status: "queued" satisfies EmailLogStatus,
      locale: input.locale ?? "en",
      metadata: input.metadata ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[email] failed to write email_log row:", error.message);
    return null;
  }
  return (data as { id: string }).id;
}

export async function updateEmailLog(id: string, patch: {
  status: EmailLogStatus;
  providerMessageId?: string;
  error?: string;
}): Promise<void> {
  const db = serviceClient();
  if (!db) return;

  const { error } = await db
    .from("email_log")
    .update({
      status: patch.status,
      provider_message_id: patch.providerMessageId ?? undefined,
      error: patch.error ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) console.warn("[email] failed to update email_log row:", error.message);
}

/** Looks a row up by the Resend message id — how the webhook receiver
 *  (Todo #11) will find which send a delivery/open/click/bounce event
 *  belongs to. */
export async function findEmailLogByProviderMessageId(id: string): Promise<{ id: string } | null> {
  const db = serviceClient();
  if (!db) return null;

  const { data } = await db.from("email_log").select("id").eq("provider_message_id", id).maybeSingle();
  return data as { id: string } | null;
}
