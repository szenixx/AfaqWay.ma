"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Bell, Copy, FileText, GripVertical, Paperclip, Plus, Trash2, Undo2 } from "lucide-react";
import { Input, TextArea, Select, Toggle, Checkbox, Loader, AnimatedModal } from "@/components/ds";
import { uploadUserFile } from "@/lib/storage/client";
import {
  deleteBlock, deleteReminder, emptyRequirement, fetchBlocks, fetchReminders, reorder,
  saveBlock, saveReminder, saveStep, stepAllowsSkip, stepRequirements,
  type DbBlock, type DbReminder, type DbStep, type DocRequirement,
} from "@/lib/journeyDb";
import { JrButton } from "@/components/student/workspace/journey/parts";
import { BLOCK_KINDS, blockKindOf, starterData, type BlockKind } from "@/lib/journeyBlocks";
import { BlockEditor } from "./BlockEditors";

/* Step content editor.

   Everything a student reads inside a Journey step is built here: the Learn
   blocks, notes and alerts, links, downloadable attachments, and the reminders
   that surface in the Journey page, Schedule, Dashboard and notifications.
   Blocks are reorderable and can be switched off individually. */

const KIND_OPTIONS = BLOCK_KINDS.map((k) => ({ value: k.value, label: k.label }));


const REMINDER_KINDS = ["upload", "meeting", "interview", "payment", "visa", "deadline", "custom"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const PRIORITIES = ["low", "normal", "high"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));
const REPEATS = ["none", "daily", "weekly", "monthly"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }));

export function StepEditor({ step, onClose }: { step: DbStep; onClose: () => void }) {
  const [tab, setTab] = useState<"content" | "documents" | "reminders">("content");
  /* Document requirements live in journey_steps.rules, so an administrator can
     define what a step needs without any schema change. The Documents module
     reads exactly this list. */
  const [reqs, setReqs] = useState<DocRequirement[]>(() => stepRequirements(step));
  const [allowSkip, setAllowSkip] = useState(() => stepAllowsSkip(step));
  const [blocks, setBlocks] = useState<DbBlock[]>([]);
  const [reminders, setReminders] = useState<DbReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [drag, setDrag] = useState<string | null>(null);
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
  const dropBlock = async (target: DbBlock) => {
    if (!drag || drag === target.id) return;
    const ids = blocks.map((b) => b.id).filter((id) => id !== drag);
    ids.splice(blocks.findIndex((b) => b.id === target.id), 0, drag);
    setDrag(null); await flushSaves(); await reorder("journey_blocks", ids); await load();
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
    <AnimatedModal open onClose={onClose} className="jm-editor" ariaLabel={`Editing ${step.title}`}>
      <header className="jr-modal-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="jr-modal-title">{step.title}</div>
          <div className="jr-modal-sub">Step content · students see enabled blocks only</div>
        </div>
        <span className="chat-tabs">
          <button type="button" className={`chat-tab${tab === "content" ? " active" : ""}`} onClick={() => setTab("content")}>Content</button>
          <button type="button" className={`chat-tab${tab === "documents" ? " active" : ""}`} onClick={() => setTab("documents")}>Documents</button>
          <button type="button" className={`chat-tab${tab === "reminders" ? " active" : ""}`} onClick={() => setTab("reminders")}>Reminders</button>
        </span>
      </header>

      <div className="jr-modal-body">
        <input ref={fileRef} type="file" style={{ display: "none" }} onChange={onFile} />

        {loading ? <Loader block /> : tab === "content" ? (
          <>
            {blocks.length === 0 && <p className="jr-sec-text">No content yet. Add the first block below.</p>}

            {blocks.map((b) => {
              const kind = blockKindOf(b.kind);
              return (
                <div
                  key={b.id} className={`jm-block${b.enabled ? "" : " off"}`}
                  draggable onDragStart={() => setDrag(b.id)}
                  onDragOver={(e) => e.preventDefault()} onDrop={() => dropBlock(b)}
                >
                  <div className="jm-block-head">
                    <span className="jm-grip"><GripVertical size={14} /></span>
                    <Select
                      value={kind} onChange={(v) => changeKind(b, v as BlockKind)} options={KIND_OPTIONS}
                      ariaLabel="Block type" containerStyle={{ minWidth: 168 }}
                    />
                    <Select
                      value={b.audience} onChange={(v) => patchBlock(b, { audience: v as DbBlock["audience"] })}
                      options={[{ value: "student", label: "Student" }, { value: "advisor", label: "Advisor only" }]}
                      ariaLabel="Audience" containerStyle={{ minWidth: 150 }}
                    />
                    <Toggle checked={b.enabled} onChange={(v) => patchBlock(b, { enabled: v })} ariaLabel="Enabled" />
                    <button type="button" className="chat-act" title="Duplicate block" onClick={() => duplicateBlock(b)}><Copy size={14} /></button>
                    <button type="button" className="chat-act" title="Delete block" onClick={() => removeBlock(b)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                  </div>

                  {/* Each kind edits exactly the shape the student renderer reads. */}
                  <BlockEditor
                    kind={kind} block={b} patch={(patch) => patchBlock(b, patch)}
                    onPickFile={() => pickFile(b.id)} uploading={uploading === b.id}
                  />
                </div>
              );
            })}

            <div className="jm-addblock">
              <span className="jm-addblock-label"><Plus size={14} />Add block</span>
              <div className="jm-addblock-kinds">
                {BLOCK_KINDS.map((k) => (
                  <button key={k.value} type="button" className="chat-chip" onClick={() => addBlock(k.value)}>{k.label}</button>
                ))}
              </div>
            </div>
          </>
        ) : tab === "documents" ? (
          <>
            <div className="jm-block">
              <div className="jm-req-head" style={{ marginBottom: 0 }}>
                <span className="jm-ico tone-blue"><FileText size={15} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="jm-req-title">Step settings</div>
                  <div className="jm-req-sub">These requirements appear in the Documents module, which stays the only place a student uploads.</div>
                </div>
                <Checkbox
                  checked={allowSkip} onChange={(v) => persistRules(reqs, v)}
                  label="Allow students to skip this step"
                />
              </div>
            </div>

            {reqs.length === 0 && <p className="jr-sec-text">No documents required on this step yet.</p>}

            {reqs.map((r, i) => (
              <div key={r.key} className="jm-block">
                <div className="jm-block-head">
                  <span className="jm-ico tone-blue"><FileText size={15} /></span>
                  <Input
                    placeholder="Document name" value={r.name}
                    onChange={(e) => patchReq(i, { name: e.target.value })} containerStyle={{ flex: 1, minWidth: 160 }}
                  />
                  <Select
                    value={r.required ? "required" : "optional"}
                    onChange={(v) => patchReq(i, { required: v === "required" })}
                    options={[{ value: "required", label: "Required" }, { value: "optional", label: "Optional" }]}
                    ariaLabel="Requirement" containerStyle={{ minWidth: 140 }}
                  />
                  <button type="button" className="chat-act" title="Move up" onClick={() => moveReq(i, -1)} disabled={i === 0}><ArrowUp size={14} /></button>
                  <button type="button" className="chat-act" title="Move down" onClick={() => moveReq(i, 1)} disabled={i === reqs.length - 1}><ArrowDown size={14} /></button>
                  <button type="button" className="chat-act" title="Remove document" onClick={() => removeReq(i)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                </div>

                <Input
                  placeholder="Short description, shown under the name" value={r.description}
                  onChange={(e) => patchReq(i, { description: e.target.value })} containerStyle={{ marginBottom: 8 }}
                />
                <TextArea
                  rows={2} placeholder="Upload instructions for the student" value={r.instructions}
                  onChange={(e) => patchReq(i, { instructions: e.target.value })}
                />
                <TextArea
                  rows={2} placeholder="Internal notes (administrators only)" value={r.notes}
                  onChange={(e) => patchReq(i, { notes: e.target.value })}
                />

                <div className="sch-row2" style={{ marginTop: 8 }}>
                  <Input
                    label="Accepted file types" placeholder="pdf,jpg,png" value={r.acceptedTypes}
                    onChange={(e) => patchReq(i, { acceptedTypes: e.target.value })}
                  />
                  <Input
                    label="Maximum size (MB)" type="number" inputMode="numeric" value={String(r.maxSizeMb)}
                    onChange={(e) => patchReq(i, { maxSizeMb: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>

                {/* Sample file, template or downloadable PDF for this requirement. */}
                <div className="jm-attach" style={{ marginTop: 8 }}>
                  <span className="jm-attach-name">
                    <Paperclip size={14} />
                    {r.templateName || "No sample or template attached"}
                  </span>
                  {r.templatePath && <JrButton onClick={() => patchReq(i, { templatePath: "", templateName: "" })}>Remove</JrButton>}
                  <JrButton tone="outline" disabled={uploading === `req:${i}`} onClick={() => pickTemplate(i)}>
                    {uploading === `req:${i}` ? "Uploading…" : r.templatePath ? "Replace file" : "Attach template"}
                  </JrButton>
                </div>
              </div>
            ))}

            <button type="button" className="jm-addstep" onClick={addReq}><Plus size={15} />Add required document</button>
          </>
        ) : (
          <>
            {reminders.length === 0 && <p className="jr-sec-text">No reminders on this step yet.</p>}
            {reminders.map((r) => (
              <div key={r.id} className="jm-block">
                <div className="jm-block-head">
                  <span className="jm-ico tone-amber"><Bell size={15} /></span>
                  <Select value={r.kind} onChange={(v) => patchReminder(r, { kind: v })} options={REMINDER_KINDS} ariaLabel="Reminder type" containerStyle={{ minWidth: 150 }} />
                  <Toggle checked={r.enabled} onChange={(v) => patchReminder(r, { enabled: v })} ariaLabel="Enabled" />
                  <button type="button" className="chat-act" title="Delete reminder" onClick={() => removeReminder(r)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                </div>
                <Input placeholder="Reminder title" value={r.title} onChange={(e) => patchReminder(r, { title: e.target.value })} containerStyle={{ marginBottom: 8 }} />
                <TextArea rows={2} placeholder="Notification message" value={r.message ?? ""} onChange={(e) => patchReminder(r, { message: e.target.value })} />
                <div className="sch-row2" style={{ marginTop: 8 }}>
                  <Input type="datetime-local" label="Due" value={(r.due_at ?? "").slice(0, 16)} onChange={(e) => patchReminder(r, { due_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                  <Select label="Repeat" value={r.repeat_rule ?? "none"} onChange={(v) => patchReminder(r, { repeat_rule: v })} options={REPEATS} />
                </div>
                <div className="sch-row2">
                  <Select label="Priority" value={r.priority ?? "normal"} onChange={(v) => patchReminder(r, { priority: v })} options={PRIORITIES} />
                  <Select
                    label="Notify via" value={(r.channels ?? ["dashboard"])[0]}
                    onChange={(v) => patchReminder(r, { channels: [v] })}
                    options={[{ value: "dashboard", label: "Dashboard" }, { value: "email", label: "Email" }, { value: "push", label: "Push" }]}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="jm-addstep" onClick={addReminder}><Plus size={15} />Add reminder</button>
          </>
        )}
      </div>

      <footer className="jr-modal-foot">
        <span className="jm-saved">
          {saving ? "Saving…" : savedAt ? "All changes saved" : "Changes save automatically"}
        </span>
        <JrButton icon={<Undo2 size={14} />} disabled={undo.length === 0} onClick={undoLast}>
          Undo
        </JrButton>
        <JrButton tone="primary" size="md" onClick={async () => { await flushSaves(); onClose(); }}>Done</JrButton>
      </footer>
    </AnimatedModal>
  );
}

export default StepEditor;
