"use client";

import { useState } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { AnimatedModal, Checkbox, DialogCard, DialogHead, DialogFoot } from "@/components/ds";
import { JrButton } from "./parts";
import type { ConfirmSpec } from "@/lib/journeyDb";

/* Confirmation before a step the student settles themselves.
 *
 * Several Stage 4 steps carry no advisor approval: "Display a Mark as Completed
 * button … show a confirmation dialog asking: Have you completed your VFS
 * interview successfully?" The question is not decoration — it is the only
 * check on a step that is otherwise a single click, so it is asked in the
 * Excel's own words, which travel on the step as rules.confirm.
 *
 * One step also carries a checklist: "Add a checklist before allowing the
 * student to mark the step as completed." Every item has to be ticked before
 * the confirm button does anything, so the two live in one dialog rather than
 * two, and a student is never asked the same question twice.
 */

export function CompleteDialog({ open, title, confirm, gate, busy, onCancel, onConfirm }: {
  open: boolean;
  /** The step, for the dialog's eyebrow. */
  title: string;
  confirm: ConfirmSpec;
  /** Items that must all be ticked first; empty when the step has no checklist. */
  gate: string[];
  busy?: boolean;
  onCancel: () => void;
  /** Receives the ticked items, which are kept on the step as a record. */
  onConfirm: (ticked: string[]) => Promise<void> | void;
}) {
  const [ticked, setTicked] = useState<string[]>([]);
  const ready = gate.length === 0 || gate.every((g) => ticked.includes(g));

  const toggle = (item: string) =>
    setTicked((list) => (list.includes(item) ? list.filter((i) => i !== item) : [...list, item]));

  return (
    <AnimatedModal open={open} onClose={onCancel} className="dlg" ariaLabel={confirm.title || title}>
      <DialogHead eyebrow={title} title={confirm.title || "Confirm"}>
        {confirm.question}
      </DialogHead>

      <div className="dlg-body">
        {gate.length > 0 && (
          <DialogCard title="Before you continue" hint="Tick every item to confirm you have it with you.">
            <ul className="jr-gate">
              {gate.map((item) => (
                <li key={item}>
                  <Checkbox
                    checked={ticked.includes(item)}
                    onChange={() => toggle(item)}
                    label={item}
                  />
                </li>
              ))}
            </ul>
          </DialogCard>
        )}

        <p className="dlg-note">
          {gate.length > 0 && !ready
            ? <><TriangleAlert size={14} /> Tick every item above before you continue.</>
            : "This step completes as soon as you confirm. Your advisor does not need to approve it."}
        </p>
      </div>

      <DialogFoot>
        <JrButton tone="quiet" size="md" onClick={onCancel}>Cancel</JrButton>
        <JrButton
          tone="primary" size="md" icon={<CircleCheck size={15} />}
          disabled={busy || !ready}
          title={ready ? undefined : "Tick every item first."}
          onClick={() => onConfirm(ticked)}
        >
          {busy ? "Saving…" : confirm.confirmLabel || "Yes, complete this step"}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default CompleteDialog;
