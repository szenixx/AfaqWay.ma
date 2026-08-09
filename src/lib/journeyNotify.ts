"use client";

import { supabase } from "@/lib/supabase/client";
import { logEvent } from "@/lib/journeyDb";
import { notify } from "@/lib/notifications";
import { whatsappLink } from "@/lib/whatsapp";

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

/** The exact text a student reads in chat — parsed back apart client-side
 *  (see DecisionCard in components/chat/parts.tsx) into a title, a Stage →
 *  Step line and, if present, the advisor's note, so this stays plain text
 *  with no markup of its own to parse around. */
export function reviewMessage(input: NotifyInput): string {
  const lines = [
    `${HEADLINE[input.outcome]}`,
    `Stage: ${input.stageTitle}`,
    `Step: ${input.stepTitle}`,
  ];
  if (input.message.trim()) lines.push("", input.message.trim());
  return lines.join("\n");
}

/** Same content as reviewMessage(), formatted for WhatsApp's own markdown
 *  instead — asterisks for bold, no separate "Stage:"/"Step:" lines. Kept
 *  as its own function rather than reused for the in-app body: WhatsApp
 *  markup in that shared text would show as literal asterisks in the chat
 *  bubble, which parses reviewMessage()'s plain-text shape for its own
 *  card. Not wired to a real WhatsApp send yet — whatsappAllowed() gates
 *  it off until that's switched on. */
export function whatsappMessage(input: NotifyInput): string {
  const lines = [`*${HEADLINE[input.outcome]}*`];
  const path = [input.stageTitle, input.stepTitle].filter(Boolean).join(" → ");
  if (path) lines.push(path);
  if (input.message.trim()) lines.push("", "*Advisor Note:*", input.message.trim());
  return lines.join("\n");
}

/* whatsappLink lives in lib/whatsapp, the module that owns the channel. It was
   defined here too, which is how two copies of one rule start. */
export { whatsappLink } from "@/lib/whatsapp";

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

  /* The decision itself lives in the conversation and nowhere else.
   *
   * The notification centre gets a summary only — no outcome, no advisor
   * wording, no step name — because a decision is something to read in context,
   * next to the step it concerns and with a reply box under it. Duplicating the
   * verdict into the centre gave the student two copies of the same news and a
   * place to read it where they could not respond.
   *
   * The summary links to the conversation, so opening it lands on the message. */
  await notify(input.userId, {
    kind: "journey",
    title: "You have a new journey update",
    body: "Open your conversation to read it.",
    link: "messages",
  });

  const viaWhatsApp = Boolean(options.whatsapp) && whatsappAllowed(input.outcome);

  await logEvent({
    user_id: input.userId, step_id: input.stepId, stage_id: input.stageId,
    kind: `notify_${input.outcome}`, actor: "admin",
    message: viaWhatsApp ? `${body}\n\n(also sent on WhatsApp)` : body,
  });

  if (viaWhatsApp && options.whatsapp) {
    // Same content as the chat message, WhatsApp's own bold markup instead
    // of the chat card's styling — nothing leaves silently.
    window.open(whatsappLink(options.whatsapp, whatsappMessage(input)), "_blank", "noopener,noreferrer");
  }

  return body;
}
