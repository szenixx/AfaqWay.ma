"use client";

import { useState } from "react";
import { CircleCheck, Eye, RotateCcw, Send, XCircle } from "lucide-react";
import { Button, Checkbox, Label, TextArea, TextField } from "@heroui/react";
import { AdminDialog, type DialogTone } from "@/components/admin/AdminDialog";
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
  title: string; verb: string; outcome: ReviewOutcome; tone: DialogTone; buttonVariant: "primary" | "danger";
  Icon: typeof CircleCheck; summary: string; whatsapp: boolean;
  /** The field this action is really about, above the general reply. */
  reasonLabel?: string; reasonHint?: string; reasonPlaceholder?: string;
}> = {
  approve: {
    title: "Approve this step", verb: "Confirm Approval", outcome: "approved", tone: "success", buttonVariant: "primary", Icon: CircleCheck,
    summary: "The step is marked completed. If every step in the stage is done, the student can send the stage for approval.",
    whatsapp: true,
  },
  reject: {
    title: "Reject this step", verb: "Confirm Rejection", outcome: "rejected", tone: "danger", buttonVariant: "danger", Icon: XCircle,
    summary: "The step is rejected and the student is asked to redo it.",
    whatsapp: false,
    reasonLabel: "Rejection reason",
    reasonHint: "Why this submission cannot be accepted. The student reads this first.",
    reasonPlaceholder: "The passport scan is unreadable.",
  },
  changes: {
    title: "Request changes", verb: "Confirm Request", outcome: "changes_requested", tone: "accent", buttonVariant: "primary", Icon: RotateCcw,
    summary: "The step returns to the student as pending so they can fix it and submit again.",
    whatsapp: false,
    reasonLabel: "Requested changes",
    reasonHint: "Exactly what the student needs to change before resubmitting.",
    reasonPlaceholder: "Re-scan page 2 in colour and upload it again.",
  },
};

export function ReplyDialog({
  action, student, stageTitle, stepTitle, stepId, stageId, initialNote, whatsappNumber, studentEmail, onCancel, onConfirm,
}: {
  action: ReplyAction;
  student: string;
  stageTitle: string;
  stepTitle: string;
  stepId: string;
  stageId: string;
  initialNote?: string;
  whatsappNumber?: string | null;
  studentEmail?: string | null;
  onCancel: () => void;
  onConfirm: (input: { message: string; note: string; sendWhatsApp: boolean; sendEmail: boolean }) => Promise<void> | void;
}) {
  const config = ACTION[action];
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [note, setNote] = useState(initialNote ?? "");
  const [sendWhatsApp, setSendWhatsApp] = useState(config.whatsapp && Boolean(whatsappNumber));
  // Email is available on every outcome (unlike WhatsApp, approve-only) but
  // defaults off across the board — an admin opts in per decision.
  const [sendEmail, setSendEmail] = useState(false);
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
    await onConfirm({ message: fullMessage, note, sendWhatsApp, sendEmail });
    setBusy(false);
  };

  return (
    <AdminDialog
      description={stageTitle}
      footer={(
        <>
          <Button onPress={onCancel} size="sm" variant="tertiary">Cancel</Button>
          <Button
            isDisabled={busy || (Boolean(config.reasonLabel) && !reason.trim())}
            onPress={confirm} size="sm" variant={config.buttonVariant}
          >
            <config.Icon size={14} /> {busy ? "Sending…" : `${config.verb} and send`}
          </Button>
        </>
      )}
      icon={<config.Icon className="size-5" />}
      onClose={onCancel}
      size="lg"
      title={config.title}
      tone={config.tone}
    >
      <div className="afq-form">
        <div className="afq-mini-card">
          <dl className="afq-rows">
            <div><dt>Student</dt><dd>{student}</dd></div>
            <div><dt>Stage</dt><dd>{stageTitle}</dd></div>
            <div><dt>Step</dt><dd>{stepTitle}</dd></div>
          </dl>
          <p className="afq-dialog-desc"><config.Icon size={14} /> {config.summary}</p>
        </div>

        {config.reasonLabel && (
          <TextField fullWidth onChange={setReason} value={reason}>
            <Label>{config.reasonLabel}</Label>
            <TextArea placeholder={config.reasonPlaceholder} rows={3} variant="secondary" />
            <p className="afq-mini-sub">{config.reasonHint}</p>
          </TextField>
        )}

        <TextField fullWidth onChange={setMessage} value={message}>
          <Label>Reply to the student</Label>
          <TextArea
            placeholder={action === "approve" ? "A short note confirming what was approved." : "What needs fixing, and how."}
            rows={4} variant="secondary"
          />
          <p className="afq-mini-sub">
            {action === "approve" ? "Optional. Anything you write is sent with the approval." : "Explain exactly what the student needs to change."}
          </p>
        </TextField>

        <TextField fullWidth onChange={setNote} value={note}>
          <Label>Internal note</Label>
          <TextArea placeholder="Context for whoever picks this up next." rows={2} variant="secondary" />
          <p className="afq-mini-sub">Only administrators can read this. The student never sees it.</p>
        </TextField>

        {/* Delivery. WhatsApp is offered on approvals only; email is offered
            on every outcome but starts off, so nothing goes out by email
            unless the admin turns it on for this specific decision. */}
        <div className="afq-mini-card">
          <div className="afq-mini-sub"><Send size={13} /> Platform chat — always sent</div>
          {config.whatsapp ? (
            whatsappNumber ? (
              <Checkbox isSelected={sendWhatsApp} onChange={setSendWhatsApp}>
                <Checkbox.Content>
                  <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  Also send on WhatsApp to {whatsappNumber}
                </Checkbox.Content>
              </Checkbox>
            ) : (
              <span className="afq-mini-sub">No WhatsApp number on this profile</span>
            )
          ) : (
            <span className="afq-mini-sub">WhatsApp is not used for this action</span>
          )}
          {studentEmail ? (
            <Checkbox isSelected={sendEmail} onChange={setSendEmail}>
              <Checkbox.Content>
                <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                Also send by email to {studentEmail}
              </Checkbox.Content>
            </Checkbox>
          ) : (
            <span className="afq-mini-sub">No email address on this profile</span>
          )}
        </div>

        <Button onPress={() => setShowPreview(!showPreview)} size="sm" style={{ alignSelf: "flex-start" }} variant="tertiary">
          <Eye size={14} /> {showPreview ? "Hide preview" : "Preview what the student receives"}
        </Button>
        {showPreview && <pre className="afq-mini-card" style={{ whiteSpace: "pre-wrap", font: "400 12.5px/18px var(--font-sans)" }}>{preview}</pre>}
      </div>
    </AdminDialog>
  );
}

export default ReplyDialog;
