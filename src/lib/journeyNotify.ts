"use client";

import { supabase } from "@/lib/supabase/client";
import { logEvent } from "@/lib/journeyDb";
import { notify } from "@/lib/notifications";

/* Review notifications.

   One place builds the message a student receives about a review decision, so
   the wording is identical wherever it is delivered. Delivery uses the existing
   messaging table; WhatsApp is prepared but not switched on, and nothing about
   the backend structure changes to support it. */

export type ReviewOutcome = "approved" | "rejected" | "changes_requested" | "comment";

const HEADLINE: Record<ReviewOutcome, string> = {
  approved: "Step approved",
  rejected: "Step rejected",
  changes_requested: "Changes requested",
  comment: "Message from your advisor",
};

export type NotifyInput = {
  userId: string;
  stageId: string;
  stageTitle: string;
  stepId: string;
  stepTitle: string;
  outcome: ReviewOutcome;
  message: string;
};

/**
 * WhatsApp carries good news only. A rejection or a request for changes stays
 * in the platform chat, where the student can reply and see the step beside it.
 * Enforced here, not in a dialog, so no future caller can bypass the rule.
 */
export const whatsappAllowed = (outcome: ReviewOutcome) => outcome === "approved";

/** The exact text a student reads, in chat and on WhatsApp alike. */
export function reviewMessage(input: NotifyInput): string {
  const lines = [
    `${HEADLINE[input.outcome]}`,
    `Stage: ${input.stageTitle}`,
    `Step: ${input.stepTitle}`,
  ];
  if (input.message.trim()) lines.push("", input.message.trim());
  return lines.join("\n");
}

/** A wa.me link, ready for the day WhatsApp sending is switched on. */
export function whatsappLink(phone: string, body: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(body)}`;
}

/**
 * Sends the decision to the student through the existing chat, records it on the
 * step timeline, and opens WhatsApp when the outcome allows it and the caller
 * asked for it. Returns the text that was sent.
 */
export async function notifyReview(input: NotifyInput, options: { whatsapp?: string | null } = {}): Promise<string> {
  const body = reviewMessage(input);

  // The platform's existing messaging table; failure here must not block a review.
  const { data: auth } = await supabase.auth.getUser();
  /* The decision travels as data beside the text, so the chat can colour the
     message and link it back to the exact step without reading the wording. */
  const { error } = await supabase.from("messages").insert({
    user_id: input.userId,
    sender: "admin",
    body,
    created_by: auth.user?.id ?? null,
    meta: input.outcome === "comment" ? null : {
      kind: "decision",
      outcome: input.outcome,
      stageId: input.stageId,
      stepId: input.stepId,
      stageTitle: input.stageTitle,
      stepTitle: input.stepTitle,
    },
  });
  if (error) console.warn("review notification not delivered to chat", error.message);

  /* The notification centre is the student's own record of what happened; the
     chat message is the conversation. Both, always. */
  await notify(input.userId, {
    kind: "journey",
    title: `${HEADLINE[input.outcome]}: ${input.stepTitle}`,
    body: input.message.trim() || input.stageTitle,
    link: "journey",
  });

  const viaWhatsApp = Boolean(options.whatsapp) && whatsappAllowed(input.outcome);

  await logEvent({
    user_id: input.userId, step_id: input.stepId, stage_id: input.stageId,
    kind: `notify_${input.outcome}`, actor: "admin",
    message: viaWhatsApp ? `${body}\n\n(also sent on WhatsApp)` : body,
  });

  if (viaWhatsApp && options.whatsapp) {
    // Opens WhatsApp with the identical wording; nothing leaves silently.
    window.open(whatsappLink(options.whatsapp, body), "_blank", "noopener,noreferrer");
  }

  return body;
}
