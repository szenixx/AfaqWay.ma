"use client";

import { useState } from "react";
import { CircleCheck, Eye, RotateCcw, Send, XCircle } from "lucide-react";
import { AnimatedModal, TextArea, DialogCard, DialogHead, DialogFoot } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { reviewMessage, type ReviewOutcome } from "@/lib/journeyNotify";

/* The one place a review decision is confirmed.

   Approve, Reject and Request Changes each open this dialog rather than acting
   straight from the review page, so the administrator always sees who it
   affects, what will happen, and the exact text the student will read before
   anything is sent.

   Delivery rule, deliberately asymmetric: an approval also goes to WhatsApp,
   while a rejection or a request for changes stays inside the platform chat.
   Bad news should arrive where it can be discussed, not as a push message. */

export type ReplyAction = "approve" | "reject" | "changes";

const ACTION: Record<ReplyAction, {
  title: string; verb: string; outcome: ReviewOutcome; tone: "success" | "danger" | "primary";
  Icon: typeof CircleCheck; summary: string; whatsapp: boolean;
  /** The field this action is really about, above the general reply. */
  reasonLabel?: string; reasonHint?: string; reasonPlaceholder?: string;
}> = {
  approve: {
    title: "Approve this step", verb: "Confirm Approval", outcome: "approved", tone: "success", Icon: CircleCheck,
    summary: "The step is marked completed. If every step in the stage is done, the student can send the stage for approval.",
    whatsapp: true,
  },
  reject: {
    title: "Reject this step", verb: "Confirm Rejection", outcome: "rejected", tone: "danger", Icon: XCircle,
    summary: "The step is rejected and the student is asked to redo it.",
    whatsapp: false,
    reasonLabel: "Rejection reason",
    reasonHint: "Why this submission cannot be accepted. The student reads this first.",
    reasonPlaceholder: "The passport scan is unreadable.",
  },
  changes: {
    title: "Request changes", verb: "Confirm Request", outcome: "changes_requested", tone: "primary", Icon: RotateCcw,
    summary: "The step returns to the student as pending so they can fix it and submit again.",
    whatsapp: false,
    reasonLabel: "Requested changes",
    reasonHint: "Exactly what the student needs to change before resubmitting.",
    reasonPlaceholder: "Re-scan page 2 in colour and upload it again.",
  },
};

export function ReplyDialog({
  action, student, stageTitle, stepTitle, stepId, stageId, initialNote, whatsappNumber, onCancel, onConfirm,
}: {
  action: ReplyAction;
  student: string;
  stageTitle: string;
  stepTitle: string;
  stepId: string;
  stageId: string;
  initialNote?: string;
  whatsappNumber?: string | null;
  onCancel: () => void;
  onConfirm: (input: { message: string; note: string; sendWhatsApp: boolean }) => Promise<void> | void;
}) {
  const config = ACTION[action];
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState(initialNote ?? "");
  const [sendWhatsApp, setSendWhatsApp] = useState(config.whatsapp && Boolean(whatsappNumber));
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);

  /* The reason leads, the reply follows: the student receives one message. */
  const fullMessage = [reason.trim(), message.trim()].filter(Boolean).join("\n\n");

  const preview = reviewMessage({
    userId: "", stageId, stageTitle, stepId, stepTitle,
    outcome: config.outcome, message: fullMessage,
  });

  const confirm = async () => {
    setBusy(true);
    await onConfirm({ message: fullMessage, note, sendWhatsApp });
    setBusy(false);
  };

  return (
    <AnimatedModal open onClose={onCancel} className="dlg rply" ariaLabel={config.title}>
      <DialogHead eyebrow={stageTitle} title={config.title} />

      <div className="dlg-body">
        <DialogCard tone="quiet">
          <dl className="rvw-facts">
            <div><dt>Student</dt><dd>{student}</dd></div>
            <div><dt>Stage</dt><dd>{stageTitle}</dd></div>
            <div><dt>Step</dt><dd>{stepTitle}</dd></div>
          </dl>
          <p className="dlg-hint"><config.Icon size={14} />{config.summary}</p>
        </DialogCard>

        {config.reasonLabel && (
          <DialogCard title={config.reasonLabel} hint={config.reasonHint}>
            <TextArea
              rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={config.reasonPlaceholder}
            />
          </DialogCard>
        )}

        <DialogCard
          title="Reply to the student"
          hint={action === "approve"
            ? "Optional. Anything you write is sent with the approval."
            : "Explain exactly what the student needs to change."}
        >
          <TextArea
            rows={4} value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder={action === "approve"
              ? "A short note confirming what was approved."
              : "What needs fixing, and how."}
          />
        </DialogCard>

        <DialogCard title="Internal note" hint="Only administrators can read this. The student never sees it.">
          <TextArea
            rows={2} value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Context for whoever picks this up next."
          />
        </DialogCard>

        {/* Delivery. WhatsApp is offered on approvals only. */}
        <div className="rply-delivery">
          <span className="rply-chan"><Send size={13} />Platform chat</span>
          {config.whatsapp ? (
            whatsappNumber ? (
              <label className="rply-check">
                <input type="checkbox" checked={sendWhatsApp} onChange={(e) => setSendWhatsApp(e.target.checked)} />
                Also send on WhatsApp to {whatsappNumber}
              </label>
            ) : (
              <span className="rply-muted">No WhatsApp number on this profile</span>
            )
          ) : (
            <span className="rply-muted">WhatsApp is not used for this action</span>
          )}
        </div>

        <button type="button" className="rply-preview-btn" onClick={() => setShowPreview(!showPreview)}>
          <Eye size={14} />{showPreview ? "Hide preview" : "Preview what the student receives"}
        </button>
        {showPreview && <pre className="rply-preview">{preview}</pre>}
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" onClick={onCancel}>Cancel</JrButton>
        <JrButton
          tone={config.tone} size="md" icon={<config.Icon size={15} />}
          disabled={busy || (Boolean(config.reasonLabel) && !reason.trim())}
          onClick={confirm}
        >
          {busy ? "Sending…" : `${config.verb} and send`}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default ReplyDialog;
