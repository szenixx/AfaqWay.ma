"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { AnimatedModal, TextArea, DialogCard, DialogHead, DialogFoot } from "@/components/ds";
import { JrButton } from "./parts";
import type { JourneyStep } from "@/lib/journey";

/* Confirmation before a step is sent for review.

   Marking a step done is a submission to a human, not a checkbox, so it asks
   for confirmation and offers an optional note. The note is what the advisor
   reads first in the review queue. */

export function MarkDoneDialog({ step, open, onCancel, onConfirm }: {
  step: JourneyStep;
  open: boolean;
  onCancel: () => void;
  onConfirm: (comment: string) => Promise<void> | void;
}) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    await onConfirm(comment.trim());
    setBusy(false);
  };

  return (
    <AnimatedModal open={open} onClose={onCancel} className="dlg" ariaLabel={`Mark ${step.title} as done`}>
      <DialogHead eyebrow={step.title} title="Are you sure you completed this task?" />

      <div className="dlg-body">
        {/* The guidance and the field live together in one card. */}
        <DialogCard title="Completion comment" hint="Briefly describe what you completed.">
          <TextArea
            rows={4} value={comment} onChange={(e) => setComment(e.target.value)}
            placeholder="I submitted my university application today."
          />
        </DialogCard>

        <p className="dlg-note">
          Your advisor reviews this step. It counts as completed once they approve it.
        </p>
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" onClick={onCancel}>Cancel</JrButton>
        <JrButton tone="primary" size="md" icon={<CircleCheck size={15} />} disabled={busy} onClick={confirm}>
          {busy ? "Sending…" : "Yes, mark as done"}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default MarkDoneDialog;
