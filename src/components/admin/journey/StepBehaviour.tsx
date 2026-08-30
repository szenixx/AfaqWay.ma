"use client";

import { useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { Button, Checkbox, Chip, Input, Label, ListBox, Select, TextArea, TextField, Tooltip } from "@heroui/react";
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

/* "none" is a UI-only sentinel — React Aria selection keys are unreliable
   with an empty-string id. The persisted rule still stores "" (no capture
   rule at all), translated at the write site below. */
const CAPTURE = [
  { value: "none", label: "Nothing" },
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="afq-mini-card">
        <div className="afq-mini-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Chip color="accent" size="sm" variant="soft"><Settings2 size={13} /></Chip>
            <div style={{ minWidth: 0 }}>
              <div className="afq-mini-title">How this step completes</div>
              <div className="afq-mini-sub">The database enforces this too, so a student can never complete a step you keep for review.</div>
            </div>
          </div>
        </div>

        <TextField fullWidth>
          <Label>Completed by</Label>
          <Select onSelectionChange={(k) => write({ completion: k === "review" ? "" : String(k) })} selectedKey={completion}>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{COMPLETION.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </TextField>

        {completion === "decision" && (
          <p className="afq-mini-sub">
            Self Service students report the outcome in a dialog. Full Service students see no button:
            an administrator records the result on their profile instead.
          </p>
        )}
      </div>

      {/* The confirmation question, in the words the step should ask. */}
      {completion !== "review" && (
        <div className="afq-mini-card">
          <div className="afq-mini-title">Confirmation dialog</div>
          <TextField fullWidth onChange={(v) => writeConfirm({ title: v })} value={confirm.title ?? ""}>
            <Label>Dialog title</Label>
            <Input placeholder="VFS appointment" variant="secondary" />
          </TextField>
          <TextField fullWidth onChange={(v) => writeConfirm({ question: v })} value={confirm.question ?? ""}>
            <Label>Question</Label>
            <TextArea placeholder="Have you completed your VFS interview successfully?" rows={2} variant="secondary" />
          </TextField>
          <TextField fullWidth onChange={(v) => writeConfirm({ confirmLabel: v })} value={confirm.confirmLabel ?? ""}>
            <Label>Confirm button</Label>
            <Input placeholder="Yes, it is done" variant="secondary" />
          </TextField>
          <p className="afq-mini-sub">Leave the question empty and the step completes without asking.</p>
        </div>
      )}

      {/* "Add a checklist before allowing the student to mark the step as completed." */}
      <div className="afq-mini-card">
        <div className="afq-mini-title">Checklist before completing</div>
        {gate.length === 0 && <p className="afq-mini-sub">No checklist. The student can confirm straight away.</p>}
        {gate.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span aria-hidden style={{ color: "#256B49" }}>✓</span>
            <TextField fullWidth onChange={(v) => writeGate(gate.map((x, n) => (n === i ? v : x)))} value={item}>
              <Input placeholder="Something the student must have" variant="secondary" />
            </TextField>
            <Tooltip>
              <Tooltip.Trigger>
                <Button aria-label="Remove" isIconOnly onPress={() => writeGate(gate.filter((_, n) => n !== i))} size="sm" variant="danger-soft">
                  <Trash2 size={13} />
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Content>Remove</Tooltip.Content>
            </Tooltip>
          </div>
        ))}
        <Button onPress={() => writeGate([...gate, ""])} size="sm" style={{ alignSelf: "flex-start" }} variant="tertiary"><Plus size={14} /> Add checklist item</Button>
      </div>

      <div className="afq-mini-card">
        <div className="afq-mini-title">Before the step opens</div>
        <Checkbox isSelected={Boolean(rules.requiresSteps)} onChange={(v) => write({ requiresSteps: v })}>
          <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Lock until every earlier step in this stage is finished</Checkbox.Content>
        </Checkbox>
        <p className="afq-mini-sub">The student sees a checklist of what is still outstanding instead of an unexplained lock.</p>
      </div>

      <div className="afq-mini-card">
        <div className="afq-mini-title">Ask for something first</div>
        <TextField fullWidth>
          <Label>Collect before completing</Label>
          <Select onSelectionChange={(k) => write({ capture: k === "none" ? "" : String(k) })} selectedKey={String(rules.capture || "none")}>
            <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
            <Select.Popover><ListBox>{CAPTURE.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
          </Select>
        </TextField>
        <p className="afq-mini-sub">The appointment form saves the date and time, adds a Schedule event, and books the 7 day, 3 day, 24 hour and 2 hour reminders.</p>
      </div>

      {/* One-shot message when the stage opens. */}
      <div className="afq-mini-card">
        <div className="afq-mini-title">Announce when this stage unlocks</div>
        <TextField fullWidth onChange={(v) => write({ announce: v ? { ...announce, event: v } : "" })} value={announce.event ?? ""}>
          <Label>Event name</Label>
          <Input placeholder="vfs_prepare" variant="secondary" />
        </TextField>
        {announce.event && (
          <>
            <TextField fullWidth onChange={(v) => write({ announce: { ...announce, followUpEvent: v } })} value={announce.followUpEvent ?? ""}>
              <Label>Follow-up event (optional)</Label>
              <Input placeholder="vfs_prepare_followup" variant="secondary" />
            </TextField>
            <TextField fullWidth onChange={(v) => write({ announce: { ...announce, followUpHours: Number(v) || 0 } })} value={String(announce.followUpHours ?? "")}>
              <Label>Follow-up after (hours)</Label>
              <Input inputMode="numeric" placeholder="48" type="number" variant="secondary" />
            </TextField>
          </>
        )}
        <p className="afq-mini-sub">
          The wording lives in the message templates, one row per channel, so the same event reaches the
          platform and WhatsApp without being written twice. Sent once per student.
        </p>
      </div>

      <p className="afq-mini-sub">{saved ? "Behaviour saved" : "Changes save as you edit"}</p>
    </div>
  );
}

export default StepBehaviour;
