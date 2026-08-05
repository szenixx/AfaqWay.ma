"use client";

import { useState } from "react";
import { CircleCheck, CircleX, LifeBuoy, Mic } from "lucide-react";
import { AnimatedModal, Confetti, DialogHead, DialogFoot, Portal } from "@/components/ds";
import { whatsappLink } from "@/lib/whatsapp";
import { JrButton } from "./parts";

/* The final residence permit decision.
 *
 * The Excel splits this step by plan, and the split is the whole design:
 *
 *   Self Service  the student reports the outcome here;
 *   Full Service  the button and this modal do not exist at all, because
 *                 "the application status is managed entirely by administrators".
 *
 * Approved and rejected are not two shades of the same action. Approved
 * completes the step and opens the next stage. Rejected explicitly does NOT:
 * "Do not mark the Journey step as completed. Keep the current step active."
 * A rejection is the moment a student most needs a person, so it opens the
 * conversation instead of closing the step.
 */

export type TrpOutcome = "approved" | "rejected";

export function TrpDecisionDialog({ open, busy, onCancel, onDecide }: {
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onDecide: (outcome: TrpOutcome) => Promise<void> | void;
}) {
  const [choice, setChoice] = useState<TrpOutcome | null>(null);

  return (
    <AnimatedModal open={open} onClose={onCancel} className="dlg" ariaLabel="Final residence permit decision">
      <DialogHead eyebrow="Waiting for Final Decision" title="Final Residence Permit Decision">
        Congratulations on reaching the final step of your application. Please tell us the result of
        your Lithuanian Temporary Residence Permit (TRP) application.
      </DialogHead>

      <div className="dlg-body">
        <div className="jr-choices" role="radiogroup" aria-label="Your TRP decision">
          <button
            type="button" role="radio" aria-checked={choice === "approved"}
            className={`jr-choice green${choice === "approved" ? " on" : ""}`}
            onClick={() => setChoice("approved")}
          >
            <CircleCheck size={20} aria-hidden />
            <span className="jr-choice-label">My TRP Has Been Approved</span>
            <span className="jr-choice-sub">Your permit was granted and you can continue to the next stage.</span>
          </button>

          <button
            type="button" role="radio" aria-checked={choice === "rejected"}
            className={`jr-choice red${choice === "rejected" ? " on" : ""}`}
            onClick={() => setChoice("rejected")}
          >
            <CircleX size={20} aria-hidden />
            <span className="jr-choice-label">My TRP Was Rejected</span>
            <span className="jr-choice-sub">We will open a conversation so our advisors can review your case.</span>
          </button>
        </div>

        <p className="dlg-note">
          {choice === "rejected"
            ? <><LifeBuoy size={14} /> This step stays open. We will start a support conversation with you straight away.</>
            : "Please report the decision exactly as the Migration Department gave it to you."}
        </p>
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" onClick={onCancel}>Cancel</JrButton>
        <JrButton
          tone={choice === "rejected" ? "danger" : "primary"} size="md"
          disabled={busy || !choice}
          title={choice ? undefined : "Choose your result first."}
          onClick={() => choice && onDecide(choice)}
        >
          {busy ? "Saving…" : choice === "rejected" ? "Send this to our team" : "Confirm my approval"}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

/* ── The celebration ──────────────────────────────────────────────────────── */

/**
 * "Display a full-screen celebration with: confetti animation, success
 * illustration, congratulations message."
 *
 * Deliberately not a dialog with a close button in the corner: it is the end of
 * a year of work, so it takes the whole screen and one large, obvious way out.
 */
export function TrpCelebration({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <Portal>
    <div className="jr-cheer" role="dialog" aria-modal="true" aria-label="Congratulations">
      <div className="jr-cheer-confetti"><Confetti bursts={3} particles={110} spread={900} height={420} /></div>

      <div className="jr-cheer-body">
        {/* Decorative: the heading beside it carries the meaning. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/journey/trp-approved.webp" alt="" className="jr-cheer-art" width={900} height={672} />
        <h2 className="jr-cheer-title">🎉 Congratulations!</h2>
        <p className="jr-cheer-lead">Your Lithuanian Temporary Residence Permit has been approved.</p>
        <p className="jr-cheer-text">
          Welcome to the final stage of your study abroad journey. We wish you success in your
          studies and your new life in Lithuania.
        </p>
        <JrButton tone="primary" size="md" onClick={onClose}>Continue my journey</JrButton>
      </div>
    </div>
    </Portal>
  );
}

/* ── The end of the journey ───────────────────────────────────────────────── */

/**
 * Shown once, when the last required step of the last stage is done.
 *
 * Deliberately different from the TRP celebration: that one marks a decision
 * someone else made about the student, this one marks something they finished.
 * The ask at the end is a voice message rather than a form, because the brief
 * asks for one and because a student who has just settled into a new country
 * will say more in thirty seconds of speech than in any survey.
 */
export function JourneyCompleteCelebration({ open, name, whatsapp, onClose }: {
  open: boolean;
  /** First name, for the greeting. Empty is fine. */
  name?: string;
  /** The AfaqWay support number the voice message goes to. */
  whatsapp?: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const message = [
    `Hi AfaqWay, this is ${name || "a student"}.`,
    "",
    "I have finished my AfaqWay journey and I am settled in Lithuania!",
    "",
    "Here is my experience, what helped me most, and how things have been since I arrived:",
  ].join("\n");

  return (
    <Portal>
    <div className="jr-cheer" role="dialog" aria-modal="true" aria-label="Journey complete">
      <div className="jr-cheer-confetti"><Confetti bursts={4} particles={130} spread={900} height={460} /></div>

      <div className="jr-cheer-body">
        {/* Decorative: the heading beside it carries the meaning. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/journey/trp-approved.webp" alt="" className="jr-cheer-art" width={900} height={672} />
        <h2 className="jr-cheer-title">🎉 You did it{name ? `, ${name}` : ""}!</h2>
        <p className="jr-cheer-lead">You have completed the AfaqWay Bachelor Journey.</p>
        <p className="jr-cheer-text">
          From choosing a programme to settling into life in Lithuania, you have finished every stage.
          That is a genuinely hard thing to do, and you did it. We are proud to have been part of it.
        </p>
        <p className="jr-cheer-text">
          Stay in touch throughout your studies — we are here whenever you need us.
        </p>

        <div className="jr-cheer-acts">
          {whatsapp && (
            <JrButton
              tone="success" size="md" icon={<Mic size={15} />}
              onClick={() => window.open(whatsappLink(whatsapp, message), "_blank", "noopener,noreferrer")}
            >
              Send us a voice message
            </JrButton>
          )}
          <JrButton tone="quiet" size="md" onClick={onClose}>Close</JrButton>
        </div>

        {whatsapp && (
          <p className="jr-cheer-note">
            Tell us how your journey has been, what helped you most, and how you are finding Lithuania.
            Press and hold the microphone in WhatsApp to record.
          </p>
        )}
      </div>
    </div>
    </Portal>
  );
}

export default TrpDecisionDialog;
