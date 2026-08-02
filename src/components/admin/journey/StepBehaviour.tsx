"use client";

import { useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { Input, TextArea, Select, Checkbox } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { saveStep, type DbStep } from "@/lib/journeyDb";

/* How a step behaves, not what it says.
 *
 * The Excel's Claude Prompt column describes two different things per step: the
 * words a student reads (which are content blocks) and the way the step works —
 * who completes it, what it asks first, what has to be true before it opens.
 * The importer writes that second half into journey_steps.rules.
 *
 * Without this panel those rules would be invisible: an administrator could add
 * a step in the Journey Manager and have no way to say "the student completes
 * this one themselves", and could not see why an imported step behaved
 * differently from one they made. Everything the importer can write, an
 * administrator can read and change here.
 *
 * The database enforces the completion rule independently (journey_progress_guard),
 * so changing it here changes what a student is permitted to do, not just what
 * the buttons look like.
 */

type Rules = Record<string, unknown>;
type Confirm = { title: string; question: string; confirmLabel: string };

const COMPLETION = [
  { value: "review", label: "Advisor approves it (default)" },
  { value: "self", label: "Student completes it themselves" },
  { value: "decision", label: "Decided by the residence permit outcome" },
];

const CAPTURE = [
  { value: "", label: "Nothing" },
  { value: "vfs_appointment", label: "VFS appointment date and time" },
];

export function StepBehaviour({ step, onSaved }: { step: DbStep; onSaved?: (rules: Rules) => void }) {
  const [rules, setRules] = useState<Rules>(() => ({ ...(step.rules ?? {}) }));
  const [saved, setSaved] = useState(false);

  /* Written whole, so a rule this panel does not know about (documents,
     allowSkip, anything a later import adds) survives an edit here. */
  const write = async (patch: Rules) => {
    const next = { ...rules, ...patch };
    // An empty value means "no rule", not "a rule that is blank".
    for (const [k, v] of Object.entries(next)) {
      if (v === "" || v === false || v === null || (Array.isArray(v) && v.length === 0)) delete next[k];
    }
    setRules(next);
    await saveStep({ id: step.id, rules: next }, "Step behaviour updated");
    setSaved(true);
    onSaved?.(next);
  };

  const completion = String(rules.completion ?? "review");
  const confirm = (rules.confirm ?? {}) as Partial<Confirm>;
  const gate = Array.isArray(rules.gate) ? (rules.gate as string[]) : [];
  const announce = (rules.announce ?? {}) as { event?: string; followUpEvent?: string; followUpHours?: number };

  const writeConfirm = (patch: Partial<Confirm>) =>
    write({ confirm: { title: "", question: "", confirmLabel: "", ...confirm, ...patch } });
  const writeGate = (next: string[]) => write({ gate: next });

  return (
    <>
      <div className="jm-block">
        <div className="jm-req-head" style={{ marginBottom: 10 }}>
          <span className="jm-ico tone-blue"><Settings2 size={15} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="jm-req-title">How this step completes</div>
            <div className="jm-req-sub">
              The database enforces this too, so a student can never complete a step you keep for review.
            </div>
          </div>
        </div>

        <Select
          label="Completed by" value={completion} options={COMPLETION}
          onChange={(v) => write({ completion: v === "review" ? "" : v })}
        />

        {completion === "decision" && (
          <p className="be-hint">
            Self Service students report the outcome in a dialog. Full Service students see no button:
            an administrator records the result on their profile instead.
          </p>
        )}
      </div>

      {/* The confirmation question, in the words the step should ask. */}
      {completion !== "review" && (
        <div className="jm-block">
          <div className="jm-req-title" style={{ marginBottom: 8 }}>Confirmation dialog</div>
          <Input
            label="Dialog title" value={confirm.title ?? ""} placeholder="VFS appointment"
            onChange={(e) => writeConfirm({ title: e.target.value })}
          />
          <TextArea
            rows={2} label="Question" value={confirm.question ?? ""}
            placeholder="Have you completed your VFS interview successfully?"
            onChange={(e) => writeConfirm({ question: e.target.value })}
          />
          <Input
            label="Confirm button" value={confirm.confirmLabel ?? ""} placeholder="Yes, it is done"
            onChange={(e) => writeConfirm({ confirmLabel: e.target.value })}
          />
          <p className="be-hint">Leave the question empty and the step completes without asking.</p>
        </div>
      )}

      {/* "Add a checklist before allowing the student to mark the step as completed." */}
      <div className="jm-block">
        <div className="jm-req-title" style={{ marginBottom: 8 }}>Checklist before completing</div>
        {gate.length === 0 && <p className="be-hint">No checklist. The student can confirm straight away.</p>}
        {gate.map((item, i) => (
          <div key={i} className="be-row">
            <span className="be-marker">✓</span>
            <Input
              value={item} placeholder="Something the student must have" containerStyle={{ flex: 1 }}
              onChange={(e) => writeGate(gate.map((v, n) => (n === i ? e.target.value : v)))}
            />
            <button
              type="button" className="chat-act" title="Remove" style={{ color: "var(--red)" }}
              onClick={() => writeGate(gate.filter((_, n) => n !== i))}
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
        <JrButton icon={<Plus size={14} />} onClick={() => writeGate([...gate, ""])}>Add checklist item</JrButton>
      </div>

      <div className="jm-block">
        <div className="jm-req-title" style={{ marginBottom: 8 }}>Before the step opens</div>
        <Checkbox
          checked={Boolean(rules.requiresSteps)}
          onChange={(v) => write({ requiresSteps: v })}
          label="Lock until every earlier step in this stage is finished"
        />
        <p className="be-hint">
          The student sees a checklist of what is still outstanding instead of an unexplained lock.
        </p>
      </div>

      <div className="jm-block">
        <div className="jm-req-title" style={{ marginBottom: 8 }}>Ask for something first</div>
        <Select
          label="Collect before completing" value={String(rules.capture ?? "")} options={CAPTURE}
          onChange={(v) => write({ capture: v })}
        />
        <p className="be-hint">
          The appointment form saves the date and time, adds a Schedule event, and books the
          7 day, 3 day, 24 hour and 2 hour reminders.
        </p>
      </div>

      {/* One-shot message when the stage opens. */}
      <div className="jm-block">
        <div className="jm-req-title" style={{ marginBottom: 8 }}>Announce when this stage unlocks</div>
        <Input
          label="Event name" value={announce.event ?? ""} placeholder="vfs_prepare"
          onChange={(e) => write({ announce: e.target.value ? { ...announce, event: e.target.value } : "" })}
        />
        {announce.event && (
          <>
            <Input
              label="Follow-up event (optional)" value={announce.followUpEvent ?? ""} placeholder="vfs_prepare_followup"
              onChange={(e) => write({ announce: { ...announce, followUpEvent: e.target.value } })}
            />
            <Input
              label="Follow-up after (hours)" type="number" inputMode="numeric"
              value={String(announce.followUpHours ?? "")} placeholder="48"
              onChange={(e) => write({ announce: { ...announce, followUpHours: Number(e.target.value) || 0 } })}
            />
          </>
        )}
        <p className="be-hint">
          The wording lives in the message templates, one row per channel, so the same event reaches the
          platform and WhatsApp without being written twice. Sent once per student.
        </p>
      </div>

      <p className="jm-saved">{saved ? "Behaviour saved" : "Changes save as you edit"}</p>
    </>
  );
}

export default StepBehaviour;
