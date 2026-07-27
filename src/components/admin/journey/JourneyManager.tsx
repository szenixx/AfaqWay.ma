"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive, ChevronDown, Copy, Eye, GripVertical, History, Pencil, Plus, Route, Trash2, Undo2,
} from "lucide-react";
import { Input, TextArea, Select, Toggle, Loader, AnimatedModal } from "@/components/ds";
import {
  deleteStage, deleteStep, duplicateStage, fetchStages, fetchSteps, fetchVersions,
  journeyReady, reorder, saveStage, saveStep, subscribeJourney,
  type DbStage, type DbStep, type Plan, type PublishState,
} from "@/lib/journeyDb";
import { StepEditor } from "./StepEditor";

/* Journey Manager — the administrator's control panel for one plan's roadmap.

   Everything here writes straight to Supabase: stages, steps, ordering,
   publishing and archiving. Full Service and Self Service each get their own
   instance, and their data never crosses. */

const ICONS = ["landmark", "graduation-cap", "stamp", "file-text", "plane", "route"].map((v) => ({ value: v, label: v.replace("-", " ") }));
const TONES = ["blue", "purple", "green", "amber", "teal", "pink", "red"].map((v) => ({ value: v, label: v }));
const STATUSES: { value: PublishState; label: string }[] = [
  { value: "draft", label: "Draft" }, { value: "published", label: "Published" }, { value: "archived", label: "Archived" },
];

const STATUS_PILL: Record<PublishState, string> = {
  draft: "pill pill-grey", published: "pill pill-green", archived: "pill pill-amber",
};

/** True when this stage came from the Excel importer rather than by hand. */
const fromExcel = (stage: DbStage) => (stage.rules as { source?: string })?.source === "xlsx";

export function JourneyManager({ plan, country = "LT" }: { plan: Plan; country?: string }) {
  const [ready, setReady] = useState<boolean | null>(null);
  const [stages, setStages] = useState<DbStage[]>([]);
  const [steps, setSteps] = useState<DbStep[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stageForm, setStageForm] = useState<Partial<DbStage> | null>(null);
  const [stepForm, setStepForm] = useState<Partial<DbStep> | null>(null);
  const [editing, setEditing] = useState<DbStep | null>(null);
  const [history, setHistory] = useState<{ entity: string; id: string; rows: Record<string, unknown>[] } | null>(null);
  const [drag, setDrag] = useState<{ kind: "stage" | "step"; id: string } | null>(null);

  const load = useCallback(async () => {
    const ok = await journeyReady();
    setReady(ok);
    if (!ok) return;
    const st = await fetchStages(plan, country, true);
    setStages(st);
    setSteps(await fetchSteps(st.map((s) => s.id), true));
  }, [plan, country]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  // Another administrator editing the same plan is reflected here immediately.
  useEffect(() => subscribeJourney(() => { void load(); }, "manager"), [load]);

  const stepsOf = (stageId: string) => steps.filter((s) => s.stage_id === stageId).sort((a, b) => a.sort_order - b.sort_order);

  /* ── Stage actions ── */
  const submitStage = async () => {
    if (!stageForm?.title?.trim()) return;
    setBusy(true);
    await saveStage({ country, plan, sort_order: stageForm.sort_order ?? stages.length, ...stageForm }, stageForm.id ? "Stage edited" : "Stage created");
    setStageForm(null); await load(); setBusy(false);
  };
  const setStageStatus = async (s: DbStage, status: PublishState) => { await saveStage({ id: s.id, status }, `Stage ${status}`); await load(); };
  const removeStage = async (s: DbStage) => {
    if (!confirm(`Delete "${s.title}" and all of its steps? This cannot be undone.`)) return;
    await deleteStage(s.id); await load();
  };
  const copyStage = async (s: DbStage) => { setBusy(true); await duplicateStage(s); await load(); setBusy(false); };

  /* ── Step actions ── */
  const submitStep = async () => {
    if (!stepForm?.title?.trim() || !stepForm.stage_id) return;
    setBusy(true);
    await saveStep({ sort_order: stepForm.sort_order ?? stepsOf(stepForm.stage_id).length, ...stepForm }, stepForm.id ? "Step edited" : "Step created");
    setStepForm(null); await load(); setBusy(false);
  };
  const setStepStatus = async (s: DbStep, status: PublishState) => { await saveStep({ id: s.id, status }, `Step ${status}`); await load(); };
  const removeStep = async (s: DbStep) => { if (confirm(`Delete step "${s.title}"?`)) { await deleteStep(s.id); await load(); } };
  const copyStep = async (s: DbStep) => {
    await saveStep({ stage_id: s.stage_id, sort_order: s.sort_order + 1, title: `${s.title} (copy)`, subtitle: s.subtitle, description: s.description, status: "draft", required: s.required, estimated_time: s.estimated_time, document_keys: s.document_keys, rules: s.rules }, "Step duplicated");
    await load();
  };

  /* ── Drag & drop ── */
  const dropStage = async (target: DbStage) => {
    if (!drag || drag.kind !== "stage" || drag.id === target.id) return;
    const ids = stages.map((s) => s.id).filter((id) => id !== drag.id);
    ids.splice(stages.findIndex((s) => s.id === target.id), 0, drag.id);
    setDrag(null); await reorder("journey_stages", ids); await load();
  };
  const dropStep = async (target: DbStep) => {
    if (!drag || drag.kind !== "step" || drag.id === target.id) return;
    const list = stepsOf(target.stage_id);
    const ids = list.map((s) => s.id).filter((id) => id !== drag.id);
    ids.splice(list.findIndex((s) => s.id === target.id), 0, drag.id);
    setDrag(null); await reorder("journey_steps", ids); await load();
  };

  const showHistory = async (entity: string, id: string) => {
    setHistory({ entity, id, rows: (await fetchVersions(entity, id)) as Record<string, unknown>[] });
  };

  if (ready === null) return <Loader size={40} block label="Loading Journey Manager" />;
  if (!ready) {
    return (
      <div className="jm-empty">
        <span className="jr-empty-ico"><Route size={26} /></span>
        <h3 className="jr-empty-title">Journey engine not installed</h3>
        <p className="jr-empty-text">
          Run <code>supabase/migrations/journey/00_run_all.sql</code> in the Supabase SQL editor,
          then reload this page. Everything else is ready.
        </p>
      </div>
    );
  }

  return (
    <section className="jm">
      <header className="jm-head">
        <div>
          <h2 className="jm-title">Journey Manager</h2>
          <p className="jm-sub">
            {plan === "full_service" ? "Full Service" : "Self Service"} · Lithuania — {stages.length} stage(s),
            {" "}{steps.length} step(s). Students see published items only.
          </p>
        </div>
        <button type="button" className="chat-send" onClick={() => setStageForm({ status: "draft", icon: "route", tone: "blue" })}>
          <Plus size={15} />New stage
        </button>
      </header>

      {stages.length === 0 ? (
        <div className="jm-empty">
          <span className="jr-empty-ico"><Route size={26} /></span>
          <h3 className="jr-empty-title">No stages yet</h3>
          <p className="jr-empty-text">Create the first stage of the {plan === "full_service" ? "Full Service" : "Self Service"} roadmap.</p>
        </div>
      ) : (
        <div className="jm-stages">
          {stages.map((stage) => {
            const list = stepsOf(stage.id);
            const isOpen = open === stage.id;
            return (
              <article
                key={stage.id} className={`jm-stage${isOpen ? " open" : ""}`}
                draggable onDragStart={() => setDrag({ kind: "stage", id: stage.id })}
                onDragOver={(e) => e.preventDefault()} onDrop={() => dropStage(stage)}
              >
                <div className="jm-stage-head">
                  <span className="jm-grip" title="Drag to reorder"><GripVertical size={16} /></span>
                  <span className={`jm-ico tone-${stage.tone}`}><Route size={17} /></span>
                  <button type="button" className="jm-stage-main" onClick={() => setOpen(isOpen ? null : stage.id)}>
                    <span className="jm-stage-num">Stage {stage.sort_order + 1}</span>
                    <span className="jm-stage-title">{stage.title}</span>
                  </button>
                  <span className={STATUS_PILL[stage.status]}>{stage.status}</span>
                  {/* Imported stages stay fully editable; the pill is a warning
                      that a re-import will overwrite what you change here. */}
                  {fromExcel(stage) && (
                    <span className="pill pill-indigo jm-src" title="Imported from the Excel source of truth. Re-running scripts/import-journey.mjs overwrites the title, order, description and Learn content of this stage.">
                      From Excel
                    </span>
                  )}
                  <span className="jm-count">{list.length} step(s)</span>
                  <div className="jm-actions">
                    <button type="button" className="chat-act" title="Edit" onClick={() => setStageForm(stage)}><Pencil size={14} /></button>
                    <button type="button" className="chat-act" title="Duplicate" onClick={() => copyStage(stage)}><Copy size={14} /></button>
                    <button type="button" className="chat-act" title="Version history" onClick={() => showHistory("stage", stage.id)}><History size={14} /></button>
                    {stage.status !== "published"
                      ? <button type="button" className="chat-chip on" onClick={() => setStageStatus(stage, "published")}>Publish</button>
                      : <button type="button" className="chat-chip" onClick={() => setStageStatus(stage, "draft")}>Unpublish</button>}
                    {stage.status !== "archived"
                      ? <button type="button" className="chat-act" title="Archive" onClick={() => setStageStatus(stage, "archived")}><Archive size={14} /></button>
                      : <button type="button" className="chat-act" title="Restore" onClick={() => setStageStatus(stage, "draft")}><Undo2 size={14} /></button>}
                    <button type="button" className="chat-act" title="Delete" onClick={() => removeStage(stage)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                    <button type="button" className="chat-act" title={isOpen ? "Collapse" : "Expand"} onClick={() => setOpen(isOpen ? null : stage.id)}>
                      <ChevronDown size={15} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="jm-stage-body">
                    {stage.description && <p className="jm-desc">{stage.description}</p>}

                    <div className="jm-steps">
                      {list.map((step) => (
                        <div
                          key={step.id} className="jm-step"
                          draggable onDragStart={() => setDrag({ kind: "step", id: step.id })}
                          onDragOver={(e) => e.preventDefault()} onDrop={() => dropStep(step)}
                        >
                          <span className="jm-grip"><GripVertical size={14} /></span>
                          <span className="jm-step-num">{step.sort_order + 1}</span>
                          <div className="jm-step-main">
                            <div className="jm-step-title">{step.title}</div>
                            <div className="jm-step-sub">
                              {step.required ? "Required" : "Optional"}
                              {step.estimated_time ? ` · ${step.estimated_time}` : ""}
                              {step.document_keys?.length ? ` · ${step.document_keys.length} document(s)` : ""}
                            </div>
                          </div>
                          <span className={STATUS_PILL[step.status]}>{step.status}</span>
                          <div className="jm-actions">
                            <button type="button" className="chat-chip" onClick={() => setEditing(step)}>Content</button>
                            <button type="button" className="chat-act" title="Edit" onClick={() => setStepForm(step)}><Pencil size={14} /></button>
                            <button type="button" className="chat-act" title="Duplicate" onClick={() => copyStep(step)}><Copy size={14} /></button>
                            <button type="button" className="chat-act" title="Version history" onClick={() => showHistory("step", step.id)}><History size={14} /></button>
                            {step.status !== "published"
                              ? <button type="button" className="chat-act" title="Publish" onClick={() => setStepStatus(step, "published")}><Eye size={14} /></button>
                              : <button type="button" className="chat-act" title="Unpublish" onClick={() => setStepStatus(step, "draft")}><Archive size={14} /></button>}
                            <button type="button" className="chat-act" title="Delete" onClick={() => removeStep(step)} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}

                      <button type="button" className="jm-addstep" onClick={() => setStepForm({ stage_id: stage.id, status: "draft", required: true })}>
                        <Plus size={15} />Add step
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── Stage form ── */}
      {stageForm && (
        <AnimatedModal open onClose={() => setStageForm(null)} className="jr-modal" ariaLabel="Stage">
          <header className="jr-modal-head"><div style={{ flex: 1 }}><div className="jr-modal-title">{stageForm.id ? "Edit stage" : "New stage"}</div><div className="jr-modal-sub">{plan === "full_service" ? "Full Service" : "Self Service"} · Lithuania</div></div></header>
          <div className="jr-modal-body">
            <Input label="Stage title" value={stageForm.title ?? ""} onChange={(e) => setStageForm({ ...stageForm, title: e.target.value })} placeholder="e.g. University Application" />
            <TextArea label="Description" rows={3} value={stageForm.description ?? ""} onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })} />
            <div className="sch-row2">
              <Select label="Icon" value={stageForm.icon ?? "route"} onChange={(v) => setStageForm({ ...stageForm, icon: v })} options={ICONS} />
              <Select label="Accent colour" value={stageForm.tone ?? "blue"} onChange={(v) => setStageForm({ ...stageForm, tone: v })} options={TONES} />
            </div>
            <Select label="Status" value={stageForm.status ?? "draft"} onChange={(v) => setStageForm({ ...stageForm, status: v as PublishState })} options={STATUSES} containerStyle={{ marginBottom: 12 }} />
            <div className="sch-block">
              <div className="sch-toggle-row">
                <div style={{ flex: 1 }}>
                  <div className="sch-toggle-title">Require advisor approval</div>
                  <div className="sch-toggle-sub">The next stage stays locked until an advisor approves this one.</div>
                </div>
                <Toggle
                  checked={(stageForm.rules as { requireAdvisorApproval?: boolean } | undefined)?.requireAdvisorApproval ?? true}
                  onChange={(v) => setStageForm({ ...stageForm, rules: { ...(stageForm.rules ?? {}), requireAdvisorApproval: v } })}
                  ariaLabel="Require advisor approval"
                />
              </div>
            </div>
          </div>
          <footer className="jr-modal-foot">
            <button type="button" className="chat-chip" onClick={() => setStageForm(null)}>Cancel</button>
            <button type="button" className="chat-send" disabled={busy || !stageForm.title?.trim()} onClick={submitStage}>{busy ? "Saving…" : "Save stage"}</button>
          </footer>
        </AnimatedModal>
      )}

      {/* ── Step form ── */}
      {stepForm && (
        <AnimatedModal open onClose={() => setStepForm(null)} className="jr-modal" ariaLabel="Step">
          <header className="jr-modal-head"><div style={{ flex: 1 }}><div className="jr-modal-title">{stepForm.id ? "Edit step" : "New step"}</div><div className="jr-modal-sub">Students see published steps only</div></div></header>
          <div className="jr-modal-body">
            <Input label="Step title" value={stepForm.title ?? ""} onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })} placeholder="e.g. Upload transcript" />
            <Input label="Subtitle" value={stepForm.subtitle ?? ""} onChange={(e) => setStepForm({ ...stepForm, subtitle: e.target.value })} />
            <TextArea label="Description / instructions" rows={4} value={stepForm.description ?? ""} onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })} />
            <div className="sch-row2">
              <Input label="Estimated time" value={stepForm.estimated_time ?? ""} onChange={(e) => setStepForm({ ...stepForm, estimated_time: e.target.value })} placeholder="e.g. 20 minutes" />
              <Input label="Due date" type="date" value={(stepForm.due_at ?? "").slice(0, 10)} onChange={(e) => setStepForm({ ...stepForm, due_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            </div>
            <Input
              label="Document keys (comma separated)" value={(stepForm.document_keys ?? []).join(", ")}
              onChange={(e) => setStepForm({ ...stepForm, document_keys: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
              placeholder="passport, transcript"
            />
            <Select label="Status" value={stepForm.status ?? "draft"} onChange={(v) => setStepForm({ ...stepForm, status: v as PublishState })} options={STATUSES} containerStyle={{ marginBottom: 12 }} />
            <div className="sch-block">
              <div className="sch-toggle-row">
                <div style={{ flex: 1 }}>
                  <div className="sch-toggle-title">Required step</div>
                  <div className="sch-toggle-sub">Optional steps do not block the stage from completing.</div>
                </div>
                <Toggle checked={stepForm.required ?? true} onChange={(v) => setStepForm({ ...stepForm, required: v })} ariaLabel="Required step" />
              </div>
            </div>
          </div>
          <footer className="jr-modal-foot">
            <button type="button" className="chat-chip" onClick={() => setStepForm(null)}>Cancel</button>
            <button type="button" className="chat-send" disabled={busy || !stepForm.title?.trim()} onClick={submitStep}>{busy ? "Saving…" : "Save step"}</button>
          </footer>
        </AnimatedModal>
      )}

      {/* ── Step content editor ── */}
      {editing && <StepEditor step={editing} onClose={() => { setEditing(null); void load(); }} />}

      {/* ── Version history ── */}
      {history && (
        <AnimatedModal open onClose={() => setHistory(null)} className="jr-modal" ariaLabel="Version history">
          <header className="jr-modal-head"><div style={{ flex: 1 }}><div className="jr-modal-title">Version history</div><div className="jr-modal-sub">{history.rows.length} change(s) recorded</div></div></header>
          <div className="jr-modal-body">
            {history.rows.length === 0 ? (
              <p className="jr-sec-text">No changes recorded yet.</p>
            ) : history.rows.map((r) => (
              <div key={String(r.id)} className="jm-version">
                <div className="jm-version-top">
                  <b>{String(r.summary || r.field || "Change")}</b>
                  <span>{new Date(String(r.created_at)).toLocaleString("en-GB")}</span>
                </div>
                <div className="jm-version-meta">{String(r.editor_email ?? "unknown editor")} · field: {String(r.field ?? "—")}</div>
                <button
                  type="button" className="chat-chip"
                  onClick={async () => {
                    const next = r.next as Record<string, unknown>;
                    if (!next) return;
                    if (history.entity === "stage") await saveStage({ ...(next as Partial<DbStage>), id: history.id }, "Restored from history");
                    else await saveStep({ ...(next as Partial<DbStep>), id: history.id }, "Restored from history");
                    setHistory(null); await load();
                  }}
                >Restore this version</button>
              </div>
            ))}
          </div>
          <footer className="jr-modal-foot"><button type="button" className="chat-chip" onClick={() => setHistory(null)}>Close</button></footer>
        </AnimatedModal>
      )}
    </section>
  );
}

export default JourneyManager;
