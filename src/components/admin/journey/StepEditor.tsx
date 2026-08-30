"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import { ArrowDown, ArrowUp, Bell, Copy, FileText, GripVertical, Paperclip, Plus, Trash2, Undo2 } from "lucide-react";
import { Button, Chip, Input, Label, ListBox, Select, Skeleton, Switch, Tabs, TextArea, TextField, Tooltip } from "@heroui/react";
import { uploadUserFile } from "@/lib/storage/client";
import {
  deleteBlock, deleteReminder, emptyRequirement, fetchBlocks, fetchReminders, reorder,
  saveBlock, saveReminder, saveStep, stepAllowsSkip, stepRequirements,
  type DbBlock, type DbReminder, type DbStep, type DocRequirement,
} from "@/lib/journeyDb";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { BLOCK_KINDS, blockKindOf, starterData, type BlockKind } from "@/lib/journeyBlocks";
import { BlockEditor, PlanPicker } from "./BlockEditors";
import { StepBehaviour } from "./StepBehaviour";

/* Step content editor.

   Everything a student reads inside a Journey step is built here: the Learn
   blocks, notes and alerts, links, downloadable attachments, and the reminders
   that surface in the Journey page, Schedule, Dashboard and notifications.
   Blocks are reorderable and can be switched off individually.

   The block list's drag-to-reorder is framer-motion's Reorder — a bespoke
   interaction HeroUI has no equivalent for — kept exactly; only the chrome
   around it (tabs, fields, row controls) is HeroUI. */

const KIND_OPTIONS = BLOCK_KINDS.map((k) => ({ value: k.value, label: k.label }));
const REMINDER_KINDS = ["upload", "meeting", "interview", "payment", "visa", "deadline", "custom"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const PRIORITIES = ["low", "normal", "high"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const REPEATS = ["none", "daily", "weekly", "monthly"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

/** A HeroUI Select from a plain value/label list, matching the one already
 *  established in BlockEditors — the same shape, so a picker never looks
 *  different depending on which tab it happens to sit in. */
function PickSelect({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label?: string;
}) {
  return (
    <Select onSelectionChange={(k) => onChange(String(k))} selectedKey={value}>
      {label ? <Label>{label}</Label> : <Label className="sr-only">Select</Label>}
      <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
      <Select.Popover>
        <ListBox>{options.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox>
      </Select.Popover>
    </Select>
  );
}

export function StepEditor({ step, onClose }: { step: DbStep; onClose: () => void }) {
  const [tab, setTab] = useState("content");
  /* Document requirements live in journey_steps.rules, so an administrator can
     define what a step needs without any schema change. The Documents module
     reads exactly this list. */
  const [reqs, setReqs] = useState<DocRequirement[]>(() => stepRequirements(step));
  const [allowSkip, setAllowSkip] = useState(() => stepAllowsSkip(step));
  const [blocks, setBlocks] = useState<DbBlock[]>([]);
  const [reminders, setReminders] = useState<DbReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);
  const pendingRef = useRef(new Map<string, Partial<DbBlock>>());
  const timerRef = useRef(new Map<string, number>());
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [undo, setUndo] = useState<DbBlock[]>([]);

  const load = useCallback(async () => {
    setBlocks(await fetchBlocks(step.id, true));
    setReminders(await fetchReminders([step.id]));
    setLoading(false);
  }, [step.id]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  /* ── Blocks ── */
  const addBlock = async (kind: BlockKind) => {
    // Starter data means a new block always renders something for the student.
    await saveBlock({ step_id: step.id, sort_order: blocks.length, kind, enabled: true, title: "", body: "", data: starterData(kind), audience: "student" });
    await load();
  };

  /** Switching kind re-seeds the shape, so the new editor is never empty. */
  const changeKind = (b: DbBlock, kind: BlockKind) => {
    remember(b);
    patchBlock(b, { kind, data: { ...starterData(kind), ...(b.data ?? {}) } });
  };
  /* Autosave: typing updates the screen at once and writes after a short pause,
     so a keystroke is never a round trip and saves cannot land out of order. */
  const patchBlock = (b: DbBlock, patch: Partial<DbBlock>) => {
    setBlocks((list) => list.map((x) => (x.id === b.id ? { ...x, ...patch } : x)));
    queueSave(b.id, patch);
  };

  const queueSave = (id: string, patch: Partial<DbBlock>) => {
    const pending = { ...(pendingRef.current.get(id) ?? {}), ...patch };
    pendingRef.current.set(id, pending);
    setSaving(true);
    window.clearTimeout(timerRef.current.get(id));
    timerRef.current.set(id, window.setTimeout(async () => {
      const body = pendingRef.current.get(id);
      pendingRef.current.delete(id);
      if (body) await saveBlock({ id, ...body });
      if (pendingRef.current.size === 0) { setSaving(false); setSavedAt(Date.now()); }
    }, 600));
  };

  /** Writes anything still queued, so closing never loses the last keystroke. */
  const flushSaves = useCallback(async () => {
    for (const timer of timerRef.current.values()) window.clearTimeout(timer);
    timerRef.current.clear();
    const queued = [...pendingRef.current.entries()];
    pendingRef.current.clear();
    for (const [id, body] of queued) await saveBlock({ id, ...body });
    setSaving(false);
  }, []);

  /* Undo: one step back through this session's edits. */
  const remember = (b: DbBlock) => setUndo((u) => [...u.slice(-19), b]);
  const undoLast = async () => {
    const last = undo[undo.length - 1];
    if (!last) return;
    setUndo((u) => u.slice(0, -1));
    await saveBlock({ id: last.id, kind: last.kind, title: last.title, body: last.body, data: last.data, enabled: last.enabled, audience: last.audience });
    await load();
  };

  const removeBlock = async (b: DbBlock) => { remember(b); await deleteBlock(b.id); await load(); };

  /** Duplicates a block directly under the original. */
  const duplicateBlock = async (b: DbBlock) => {
    await saveBlock({ step_id: step.id, sort_order: b.sort_order + 1, kind: b.kind, enabled: b.enabled, title: b.title, body: b.body, data: b.data, audience: b.audience });
    await load();
  };
  /* Drag-to-reorder (framer-motion Reorder): the drag updates `blocks` live for
     smooth visual feedback; the DB write happens once, on drop. */
  const blocksRef = useRef(blocks);
  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  const persistBlockOrder = async () => {
    await flushSaves();
    await reorder("journey_blocks", blocksRef.current.map((b) => b.id));
    await load();
  };

  /* Attachments upload through the platform storage gateway. */
  const pickFile = (blockId: string) => { uploadTarget.current = blockId; fileRef.current?.click(); };
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetId = uploadTarget.current;
    if (!file || !targetId) return;
    setUploading(targetId);
    try {
      const up = await uploadUserFile(file, { folder: "documents" });
      if (targetId.startsWith("req:")) {
        const i = Number(targetId.slice(4));
        await patchReq(i, { templatePath: up.path, templateName: up.fileName });
      } else {
        const block = blocks.find((b) => b.id === targetId);
        if (block) await patchBlock(block, { data: { ...block.data, path: up.path, fileName: up.fileName, size: up.size } });
      }
    } catch (err) { console.warn("attachment upload failed", err); }
    setUploading(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  /* ── Document requirements ── */
  const persistRules = async (next: DocRequirement[], skip = allowSkip) => {
    setReqs(next); setAllowSkip(skip);
    await saveStep({ id: step.id, rules: { ...(step.rules ?? {}), documents: next, allowSkip: skip } }, "Document requirements updated");
  };
  const addReq = () => persistRules([...reqs, { ...emptyRequirement(`doc_${Date.now().toString(36)}`), name: "New document" }]);
  const patchReq = (i: number, patch: Partial<DocRequirement>) =>
    persistRules(reqs.map((r, n) => (n === i ? { ...r, ...patch } : r)));
  const removeReq = (i: number) => persistRules(reqs.filter((_, n) => n !== i));
  const moveReq = (i: number, by: number) => {
    const j = i + by;
    if (j < 0 || j >= reqs.length) return;
    const next = reqs.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return persistRules(next);
  };
  /* A template or sample file is uploaded once by the administrator and offered
     to every student on this step. */
  const pickTemplate = (i: number) => { uploadTarget.current = `req:${i}`; fileRef.current?.click(); };

  /* ── Reminders ── */
  const addReminder = async () => {
    await saveReminder({ step_id: step.id, kind: "custom", title: "New reminder", message: "", priority: "normal", repeat_rule: "none", channels: ["dashboard"], enabled: true });
    await load();
  };
  const patchReminder = async (r: DbReminder, patch: Partial<DbReminder>) => {
    setReminders((list) => list.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    await saveReminder({ id: r.id, ...patch });
  };
  const removeReminder = async (r: DbReminder) => { await deleteReminder(r.id); await load(); };

  return (
    <AdminDialog
      description="Step content · students see enabled blocks only"
      footer={(
        <>
          <span className="afq-mini-sub" style={{ marginRight: "auto" }}>
            {saving ? "Saving…" : savedAt ? "All changes saved" : "Changes save automatically"}
          </span>
          <Button isDisabled={undo.length === 0} onPress={undoLast} size="sm" variant="secondary"><Undo2 size={14} /> Undo</Button>
          <Button onPress={async () => { await flushSaves(); onClose(); }} size="sm" variant="primary">Done</Button>
        </>
      )}
      icon={<FileText className="size-5" />}
      onClose={onClose}
      size="xl"
      title={step.title}
    >
      <input onChange={onFile} ref={fileRef} style={{ display: "none" }} type="file" />

      <Tabs className="afq-form" onSelectionChange={(k) => setTab(String(k))} selectedKey={tab} variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Step editor sections">
            <Tabs.Tab id="content">Content<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="documents">Documents<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="behaviour">Behaviour<Tabs.Indicator /></Tabs.Tab>
            <Tabs.Tab id="reminders">Reminders<Tabs.Indicator /></Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="content">
          {loading ? (
            <Skeleton className="h-40 w-full rounded-2xl" />
          ) : (
            <>
              {blocks.length === 0 && <p className="afq-mini-sub">No content yet. Add the first block below.</p>}

              <Reorder.Group as="div" axis="y" onReorder={setBlocks} style={{ display: "flex", flexDirection: "column", gap: 12 }} values={blocks}>
                {blocks.map((b) => {
                  const kind = blockKindOf(b.kind);
                  return (
                    <Reorder.Item
                      as="div" className="afq-mini-card" key={b.id}
                      onDragEnd={() => { void persistBlockOrder(); }}
                      style={{ cursor: "grab", opacity: b.enabled ? 1 : 0.55 }}
                      transition={{ type: "spring", stiffness: 520, damping: 32 }}
                      value={b}
                      whileDrag={{ scale: 1.02, boxShadow: "0 20px 45px rgba(23,35,58,.18)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span aria-hidden style={{ cursor: "grab", color: "#B7C0D1" }}><GripVertical size={14} /></span>
                        <PickSelect onChange={(v) => changeKind(b, v as BlockKind)} options={KIND_OPTIONS} value={kind} />
                        <PickSelect
                          onChange={(v) => patchBlock(b, { audience: v as DbBlock["audience"] })}
                          options={[{ value: "student", label: "Student" }, { value: "advisor", label: "Advisor only" }]}
                          value={b.audience}
                        />
                        <Switch aria-label="Enabled" isSelected={b.enabled} onChange={(v) => patchBlock(b, { enabled: v })}>
                          <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
                        </Switch>
                        <span style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                          <Tooltip><Tooltip.Trigger><Button aria-label="Duplicate block" isIconOnly onPress={() => duplicateBlock(b)} size="sm" variant="tertiary"><Copy size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Duplicate</Tooltip.Content></Tooltip>
                          <Tooltip><Tooltip.Trigger><Button aria-label="Delete block" isIconOnly onPress={() => removeBlock(b)} size="sm" variant="danger-soft"><Trash2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Delete</Tooltip.Content></Tooltip>
                        </span>
                      </div>

                      {/* Each kind edits exactly the shape the student renderer reads. */}
                      <BlockEditor block={b} kind={kind} onPickFile={() => pickFile(b.id)} patch={(patch) => patchBlock(b, patch)} uploading={uploading === b.id} />
                      {/* Which plan sees it — one control, every kind. Blocks the
                          import tagged for a single plan were otherwise invisible
                          as such, so an edit could silently reach half the students. */}
                      <PlanPicker block={b} patch={(patch) => patchBlock(b, patch)} />
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>

              <div className="afq-mini-card" style={{ marginTop: 12 }}>
                <span className="afq-mini-sub"><Plus size={14} /> Add block</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {BLOCK_KINDS.map((k) => (
                    <Button key={k.value} onPress={() => addBlock(k.value)} size="sm" variant="tertiary">{k.label}</Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="documents">
          <div className="afq-mini-card">
            <div className="afq-mini-head">
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Chip color="accent" size="sm" variant="soft"><FileText size={13} /></Chip>
                <div style={{ minWidth: 0 }}>
                  <div className="afq-mini-title">Step settings</div>
                  <div className="afq-mini-sub">These requirements appear in the Documents module, which stays the only place a student uploads.</div>
                </div>
              </div>
              <Switch isSelected={allowSkip} onChange={(v) => persistRules(reqs, v)}>
                <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Allow students to skip this step</Switch.Content>
              </Switch>
            </div>
          </div>

          {reqs.length === 0 && <p className="afq-mini-sub">No documents required on this step yet.</p>}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: reqs.length ? 8 : 0 }}>
            {reqs.map((r, i) => (
              <div className="afq-mini-card" key={r.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Chip color="accent" size="sm" variant="soft"><FileText size={13} /></Chip>
                  <TextField onChange={(v) => patchReq(i, { name: v })} style={{ flex: 1, minWidth: 160 }} value={r.name}>
                    <Label className="sr-only">Document name</Label>
                    <Input placeholder="Document name" variant="secondary" />
                  </TextField>
                  <PickSelect
                    onChange={(v) => patchReq(i, { required: v === "required" })}
                    options={[{ value: "required", label: "Required" }, { value: "optional", label: "Optional" }]}
                    value={r.required ? "required" : "optional"}
                  />
                  <Tooltip><Tooltip.Trigger><Button aria-label="Move up" isDisabled={i === 0} isIconOnly onPress={() => moveReq(i, -1)} size="sm" variant="tertiary"><ArrowUp size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Move up</Tooltip.Content></Tooltip>
                  <Tooltip><Tooltip.Trigger><Button aria-label="Move down" isDisabled={i === reqs.length - 1} isIconOnly onPress={() => moveReq(i, 1)} size="sm" variant="tertiary"><ArrowDown size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Move down</Tooltip.Content></Tooltip>
                  <Tooltip><Tooltip.Trigger><Button aria-label="Remove document" isIconOnly onPress={() => removeReq(i)} size="sm" variant="danger-soft"><Trash2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Remove</Tooltip.Content></Tooltip>
                </div>

                <TextField fullWidth onChange={(v) => patchReq(i, { description: v })} value={r.description}>
                  <Label className="sr-only">Description</Label>
                  <Input placeholder="Short description, shown under the name" variant="secondary" />
                </TextField>
                <TextField fullWidth onChange={(v) => patchReq(i, { instructions: v })} value={r.instructions}>
                  <Label className="sr-only">Instructions</Label>
                  <TextArea placeholder="Upload instructions for the student" rows={2} variant="secondary" />
                </TextField>
                <TextField fullWidth onChange={(v) => patchReq(i, { notes: v })} value={r.notes}>
                  <Label className="sr-only">Internal notes</Label>
                  <TextArea placeholder="Internal notes (administrators only)" rows={2} variant="secondary" />
                </TextField>

                <div className="afq-form-row">
                  <TextField fullWidth onChange={(v) => patchReq(i, { acceptedTypes: v })} value={r.acceptedTypes}>
                    <Label>Accepted file types</Label>
                    <Input placeholder="pdf,jpg,png" variant="secondary" />
                  </TextField>
                  <TextField fullWidth onChange={(v) => patchReq(i, { maxSizeMb: Math.max(1, Number(v) || 1) })} value={String(r.maxSizeMb)}>
                    <Label>Maximum size (MB)</Label>
                    <Input inputMode="numeric" type="number" variant="secondary" />
                  </TextField>
                </div>

                {/* Sample file, template or downloadable PDF for this requirement. */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="afq-mini-sub" style={{ flex: 1 }}>
                    <Paperclip size={14} /> {r.templateName || "No sample or template attached"}
                  </span>
                  {r.templatePath && <Button onPress={() => patchReq(i, { templatePath: "", templateName: "" })} size="sm" variant="tertiary">Remove</Button>}
                  <Button isDisabled={uploading === `req:${i}`} onPress={() => pickTemplate(i)} size="sm" variant="secondary">
                    {uploading === `req:${i}` ? "Uploading…" : r.templatePath ? "Replace file" : "Attach template"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button onPress={addReq} size="sm" style={{ marginTop: 10 }} variant="tertiary"><Plus size={14} /> Add required document</Button>
        </Tabs.Panel>

        <Tabs.Panel id="behaviour">
          {/* Everything the importer can write into a step's rules, an
              administrator can read and change. Keyed on the step so switching
              steps re-reads the rules rather than keeping the previous ones. */}
          <StepBehaviour key={step.id} step={step} />
        </Tabs.Panel>

        <Tabs.Panel id="reminders">
          {reminders.length === 0 && <p className="afq-mini-sub">No reminders on this step yet.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reminders.map((r) => (
              <div className="afq-mini-card" key={r.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Chip color="warning" size="sm" variant="soft"><Bell size={13} /></Chip>
                  <PickSelect onChange={(v) => patchReminder(r, { kind: v })} options={REMINDER_KINDS} value={r.kind} />
                  <Switch aria-label="Enabled" isSelected={r.enabled} onChange={(v) => patchReminder(r, { enabled: v })}>
                    <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
                  </Switch>
                  <Tooltip><Tooltip.Trigger><Button aria-label="Delete reminder" isIconOnly onPress={() => removeReminder(r)} size="sm" style={{ marginLeft: "auto" }} variant="danger-soft"><Trash2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Delete</Tooltip.Content></Tooltip>
                </div>
                <TextField fullWidth onChange={(v) => patchReminder(r, { title: v })} value={r.title}>
                  <Label className="sr-only">Reminder title</Label>
                  <Input placeholder="Reminder title" variant="secondary" />
                </TextField>
                <TextField fullWidth onChange={(v) => patchReminder(r, { message: v })} value={r.message ?? ""}>
                  <Label className="sr-only">Notification message</Label>
                  <TextArea placeholder="Notification message" rows={2} variant="secondary" />
                </TextField>
                <div className="afq-form-row">
                  <TextField fullWidth onChange={(v) => patchReminder(r, { due_at: v ? new Date(v).toISOString() : null })} value={(r.due_at ?? "").slice(0, 16)}>
                    <Label>Due</Label>
                    <Input type="datetime-local" variant="secondary" />
                  </TextField>
                  <PickSelect label="Repeat" onChange={(v) => patchReminder(r, { repeat_rule: v })} options={REPEATS} value={r.repeat_rule ?? "none"} />
                </div>
                <div className="afq-form-row">
                  <PickSelect label="Priority" onChange={(v) => patchReminder(r, { priority: v })} options={PRIORITIES} value={r.priority ?? "normal"} />
                  <PickSelect
                    label="Notify via" onChange={(v) => patchReminder(r, { channels: [v] })}
                    options={[{ value: "dashboard", label: "Dashboard" }, { value: "email", label: "Email" }, { value: "push", label: "Push" }]}
                    value={(r.channels ?? ["dashboard"])[0]}
                  />
                </div>
              </div>
            ))}
          </div>
          <Button onPress={addReminder} size="sm" style={{ marginTop: 10 }} variant="tertiary"><Plus size={14} /> Add reminder</Button>
        </Tabs.Panel>
      </Tabs>
    </AdminDialog>
  );
}

export default StepEditor;
