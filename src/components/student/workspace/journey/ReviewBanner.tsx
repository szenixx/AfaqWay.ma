"use client";

import { CircleCheck, MessageCircle, RotateCcw, XCircle } from "lucide-react";
import type { JourneyStep } from "@/lib/journey";

/* The result of the advisor's last review, at the top of the step.

   Compact by design: one icon, one line of title, one line of explanation and a
   text link into the conversation where the detail lives. It appears the moment
   an administrator decides, because the step modal is subscribed to the journey
   tables, and it is dismissed once the student has read the chat. */

type Kind = "approved" | "rejected" | "changes";

const LOOK: Record<Kind, { tone: string; Icon: typeof CircleCheck; title: string; body: string }> = {
  approved: {
    tone: "green", Icon: CircleCheck, title: "Step approved",
    body: "Your advisor has approved this step. You may continue with the next step.",
  },
  rejected: {
    tone: "red", Icon: XCircle, title: "Step rejected",
    body: "Your advisor requested corrections before this step can be approved.",
  },
  changes: {
    tone: "amber", Icon: RotateCcw, title: "Changes requested",
    body: "Your advisor requested additional information or modifications.",
  },
};

/** Which banner a step should show, if any. */
export function bannerKindFor(step: JourneyStep): Kind | null {
  if (step.state === "completed") return "approved";
  if (step.state === "rejected") return "rejected";
  // A step sent back to pending with a message from the advisor is a change request.
  if (step.state === "pending" && step.reviewComment.trim()) return "changes";
  return null;
}

export function ReviewBanner({ kind, message, onOpenChat }: {
  kind: Kind;
  /** The advisor's own words, shown in place of the generic line when present. */
  message?: string;
  onOpenChat: () => void;
}) {
  const look = LOOK[kind];
  return (
    <div className={`rvb rvb-${look.tone}`} role="status">
      <span className="rvb-ico"><look.Icon size={17} /></span>
      <span className="rvb-text">
        <b>{look.title}</b>
        <span>{message?.trim() || look.body}</span>
      </span>
      <button type="button" className="rvb-link" onClick={onOpenChat}>
        <MessageCircle size={14} />Check Chatbox Here
      </button>
    </div>
  );
}

export default ReviewBanner;
