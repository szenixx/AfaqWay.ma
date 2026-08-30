"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Archive, ChevronDown, Copy, Eye, GripVertical, History, Pencil, Plus, Route, Trash2, Undo2,
} from "lucide-react";
import {
  Button, Chip, Input, Label, ListBox, Select, Skeleton, Switch, TextArea, TextField, Tooltip,
} from "@heroui/react";
import {
  deleteStage, deleteStep, duplicateStage, fetchStages, fetchSteps, fetchVersions,
  journeyReady, reorder, saveStage, saveStep, subscribeJourney,
  type DbStage, type DbStep, type Plan, type PublishState,
} from "@/lib/journeyDb";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
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

/** A publish state, in HeroUI's Chip colour vocabulary. */
const STATUS_CHIP: Record<PublishState, { color: "default" | "success" | "warning"; label: string }> = {
  draft: { color: "default", label: "Draft" },
  published: { color: "success", label: "Published" },
  archived: { color: "warning", label: "Archived" },
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
  const [confirmRemove, setConfirmRemove] = useState<{ title: string; body: string; onYes: () => void } | null>(null);

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
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  const stepsOf = (stageId: string) => steps.filter((s) => s.stage_id === stageId).sort((a, b) => a.sort_order - b.sort_order);

  /* ── Stage actions ── */
  const submitStage = async () => {
    if (!stageForm?.title?.trim()) return;
    setBusy(true);
    await saveStage({ country, plan, sort_order: stageForm.sort_order ?? stages.length, ...stageForm }, stageForm.id ? "Stage edited" : "Stage created");
    setStageForm(null); await load(); setBusy(false);
  };
  const setStageStatus = async (s: DbStage, status: PublishState) => { await saveStage({ id: s.id, status }, `Stage ${status}`); await load(); };
  const askRemoveStage = (s: DbStage) => setConfirmRemove({
    title: `Delete "${s.title}"?`, body: "This removes the stage and all of its steps. This cannot be undone.",
    onYes: () => { void deleteStage(s.id).then(load); setConfirmRemove(null); },
  });
  const copyStage = async (s: DbStage) => { setBusy(true); await duplicateStage(s); await load(); setBusy(false); };

  /* ── Step actions ── */
  const submitStep = async () => {
    if (!stepForm?.title?.trim() || !stepForm.stage_id) return;
    setBusy(true);
    await saveStep({ sort_order: stepForm.sort_order ?? stepsOf(stepForm.stage_id).length, ...stepForm }, stepForm.id ? "Step edited" : "Step created");
    setStepForm(null); await load(); setBusy(false);
  };
  const setStepStatus = async (s: DbStep, status: PublishState) => { await saveStep({ id: s.id, status }, `Step ${status}`); await load(); };
  const askRemoveStep = (s: DbStep) => setConfirmRemove({
    title: `Delete step "${s.title}"?`, body: "This cannot be undone.",
    onYes: () => { void deleteStep(s.id).then(load); setConfirmRemove(null); },
  });
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

  if (ready === null) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!ready) {
    return (
      <div className="afq-empty">
        <Route size={22} />
        <p><b>Journey engine not installed.</b> Run <code>supabase/migrations/journey/00_run_all.sql</code> in the Supabase SQL editor, then reload this page.</p>
      </div>
    );
  }

  return (
    <div className="afq-mini-card" style={{ gap: 14 }}>
      <div className="afq-mini-head">
        <div>
          <div className="afq-mini-title" style={{ fontSize: 14 }}>Journey Manager</div>
          <div className="afq-mini-sub">
            {plan === "full_service" ? "Full Service" : "Self Service"} · Lithuania — {stages.length} stage(s), {steps.length} step(s).
            Students see published items only.
          </div>
        </div>
        <Button onPress={() => setStageForm({ status: "draft", icon: "route", tone: "blue" })} size="sm" variant="primary">
          <Plus size={14} /> New stage
        </Button>
      </div>

      {stages.length === 0 ? (
        <div className="afq-empty">
          <Route size={20} />
          <p>No stages yet. Create the first stage of the {plan === "full_service" ? "Full Service" : "Self Service"} roadmap.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {stages.map((stage) => {
            const list = stepsOf(stage.id);
            const isOpen = open === stage.id;
            return (
              <article
                className="afq-mini-card" draggable key={stage.id}
                onDragOver={(e) => e.preventDefault()} onDragStart={() => setDrag({ kind: "stage", id: stage.id })} onDrop={() => dropStage(stage)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span aria-hidden style={{ cursor: "grab", color: "#B7C0D1" }}><GripVertical size={16} /></span>
                  <Chip color="accent" size="sm" variant="soft"><Route size={13} /></Chip>
                  <button
                    onClick={() => setOpen(isOpen ? null : stage.id)}
                    style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flex: 1, minWidth: 120, border: "none", background: "transparent", cursor: "pointer", textAlign: "left", padding: 0 }}
                    type="button"
                  >
                    <span className="afq-mini-sub">Stage {stage.sort_order + 1}</span>
                    <span className="afq-mini-title">{stage.title}</span>
                  </button>
                  <Chip color={STATUS_CHIP[stage.status].color} size="sm" variant="soft">{STATUS_CHIP[stage.status].label}</Chip>
                  {/* Imported stages stay fully editable; the chip is a warning
                      that a re-import will overwrite what you change here. */}
                  {fromExcel(stage) && (
                    <Tooltip>
                      <Tooltip.Trigger><Chip color="accent" size="sm" variant="soft">From Excel</Chip></Tooltip.Trigger>
                      <Tooltip.Content>Imported from the Excel source of truth. Re-running scripts/import-journey.mjs overwrites the title, order, description and Learn content of this stage.</Tooltip.Content>
                    </Tooltip>
                  )}
                  <span className="afq-mini-sub">{list.length} step(s)</span>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <Tooltip><Tooltip.Trigger><Button aria-label="Edit" isIconOnly onPress={() => setStageForm(stage)} size="sm" variant="secondary"><Pencil size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Edit</Tooltip.Content></Tooltip>
                    <Tooltip><Tooltip.Trigger><Button aria-label="Duplicate" isIconOnly onPress={() => copyStage(stage)} size="sm" variant="tertiary"><Copy size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Duplicate</Tooltip.Content></Tooltip>
                    <Tooltip><Tooltip.Trigger><Button aria-label="Version history" isIconOnly onPress={() => showHistory("stage", stage.id)} size="sm" variant="tertiary"><History size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Version history</Tooltip.Content></Tooltip>
                    {stage.status !== "published"
                      ? <Button onPress={() => setStageStatus(stage, "published")} size="sm" variant="primary">Publish</Button>
                      : <Button onPress={() => setStageStatus(stage, "draft")} size="sm" variant="secondary">Unpublish</Button>}
                    {stage.status !== "archived"
                      ? <Tooltip><Tooltip.Trigger><Button aria-label="Archive" isIconOnly onPress={() => setStageStatus(stage, "archived")} size="sm" variant="tertiary"><Archive size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Archive</Tooltip.Content></Tooltip>
                      : <Tooltip><Tooltip.Trigger><Button aria-label="Restore" isIconOnly onPress={() => setStageStatus(stage, "draft")} size="sm" variant="tertiary"><Undo2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Restore</Tooltip.Content></Tooltip>}
                    <Tooltip><Tooltip.Trigger><Button aria-label="Delete" isIconOnly onPress={() => askRemoveStage(stage)} size="sm" variant="danger-soft"><Trash2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Delete</Tooltip.Content></Tooltip>
                    <Button aria-label={isOpen ? "Collapse" : "Expand"} isIconOnly onPress={() => setOpen(isOpen ? null : stage.id)} size="sm" variant="tertiary">
                      <ChevronDown size={15} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 4 }}>
                    {stage.description && <p className="afq-dialog-desc">{stage.description}</p>}

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                      {list.map((step) => (
                        <div
                          className="afq-mini-card" draggable key={step.id}
                          onDragOver={(e) => e.preventDefault()} onDragStart={() => setDrag({ kind: "step", id: step.id })} onDrop={() => dropStep(step)}
                          style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}
                        >
                          <span aria-hidden style={{ cursor: "grab", color: "#B7C0D1" }}><GripVertical size={14} /></span>
                          <span className="afq-mini-sub" style={{ minWidth: 18 }}>{step.sort_order + 1}</span>
                          <div style={{ flex: 1, minWidth: 140 }}>
                            <div className="afq-mini-title">{step.title}</div>
                            <div className="afq-mini-sub">
                              {step.required ? "Required" : "Optional"}
                              {step.estimated_time ? ` · ${step.estimated_time}` : ""}
                              {step.document_keys?.length ? ` · ${step.document_keys.length} document(s)` : ""}
                            </div>
                          </div>
                          <Chip color={STATUS_CHIP[step.status].color} size="sm" variant="soft">{STATUS_CHIP[step.status].label}</Chip>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <Button onPress={() => setEditing(step)} size="sm" variant="secondary">Content</Button>
                            <Tooltip><Tooltip.Trigger><Button aria-label="Edit" isIconOnly onPress={() => setStepForm(step)} size="sm" variant="tertiary"><Pencil size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Edit</Tooltip.Content></Tooltip>
                            <Tooltip><Tooltip.Trigger><Button aria-label="Duplicate" isIconOnly onPress={() => copyStep(step)} size="sm" variant="tertiary"><Copy size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Duplicate</Tooltip.Content></Tooltip>
                            <Tooltip><Tooltip.Trigger><Button aria-label="Version history" isIconOnly onPress={() => showHistory("step", step.id)} size="sm" variant="tertiary"><History size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Version history</Tooltip.Content></Tooltip>
                            {step.status !== "published"
                              ? <Tooltip><Tooltip.Trigger><Button aria-label="Publish" isIconOnly onPress={() => setStepStatus(step, "published")} size="sm" variant="tertiary"><Eye size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Publish</Tooltip.Content></Tooltip>
                              : <Tooltip><Tooltip.Trigger><Button aria-label="Unpublish" isIconOnly onPress={() => setStepStatus(step, "draft")} size="sm" variant="tertiary"><Archive size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Unpublish</Tooltip.Content></Tooltip>}
                            <Tooltip><Tooltip.Trigger><Button aria-label="Delete" isIconOnly onPress={() => askRemoveStep(step)} size="sm" variant="danger-soft"><Trash2 size={14} /></Button></Tooltip.Trigger><Tooltip.Content>Delete</Tooltip.Content></Tooltip>
                          </div>
                        </div>
                      ))}

                      <Button onPress={() => setStepForm({ stage_id: stage.id, status: "draft", required: true })} size="sm" style={{ alignSelf: "flex-start" }} variant="tertiary">
                        <Plus size={14} /> Add step
                      </Button>
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
        <AdminDialog
          description={`${plan === "full_service" ? "Full Service" : "Self Service"} · Lithuania`}
          footer={(
            <>
              <Button onPress={() => setStageForm(null)} size="sm" variant="tertiary">Cancel</Button>
              <Button isDisabled={busy || !stageForm.title?.trim()} onPress={submitStage} size="sm" variant="primary">{busy ? "Saving…" : "Save stage"}</Button>
            </>
          )}
          icon={<Route className="size-5" />}
          onClose={() => setStageForm(null)}
          title={stageForm.id ? "Edit stage" : "New stage"}
        >
          <div className="afq-form">
            <TextField fullWidth onChange={(v) => setStageForm({ ...stageForm, title: v })} value={stageForm.title ?? ""}>
              <Label>Stage title</Label>
              <Input placeholder="e.g. University Application" variant="secondary" />
            </TextField>
            <TextField fullWidth onChange={(v) => setStageForm({ ...stageForm, description: v })} value={stageForm.description ?? ""}>
              <Label>Description</Label>
              <TextArea rows={3} variant="secondary" />
            </TextField>
            <div className="afq-form-row">
              <Select onSelectionChange={(k) => setStageForm({ ...stageForm, icon: String(k) })} selectedKey={stageForm.icon ?? "route"}>
                <Label>Icon</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover><ListBox>{ICONS.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
              </Select>
              <Select onSelectionChange={(k) => setStageForm({ ...stageForm, tone: String(k) })} selectedKey={stageForm.tone ?? "blue"}>
                <Label>Accent colour</Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover><ListBox>{TONES.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
              </Select>
            </div>
            <Select onSelectionChange={(k) => setStageForm({ ...stageForm, status: k as PublishState })} selectedKey={stageForm.status ?? "draft"}>
              <Label>Status</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover><ListBox>{STATUSES.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            </Select>
            <div className="afq-mini-card" style={{ flexDirection: "row", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div className="afq-mini-title">Require advisor approval</div>
                <div className="afq-mini-sub">The next stage stays locked until an advisor approves this one.</div>
              </div>
              <Switch
                aria-label="Require advisor approval"
                isSelected={(stageForm.rules as { requireAdvisorApproval?: boolean } | undefined)?.requireAdvisorApproval ?? true}
                onChange={(v) => setStageForm({ ...stageForm, rules: { ...(stageForm.rules ?? {}), requireAdvisorApproval: v } })}
              >
                <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
              </Switch>
            </div>
          </div>
        </AdminDialog>
      )}

      {/* ── Step form ── */}
      {stepForm && (
        <AdminDialog
          description="Students see published steps only"
          footer={(
            <>
              <Button onPress={() => setStepForm(null)} size="sm" variant="tertiary">Cancel</Button>
              <Button isDisabled={busy || !stepForm.title?.trim()} onPress={submitStep} size="sm" variant="primary">{busy ? "Saving…" : "Save step"}</Button>
            </>
          )}
          icon={<Pencil className="size-5" />}
          onClose={() => setStepForm(null)}
          size="lg"
          title={stepForm.id ? "Edit step" : "New step"}
        >
          <div className="afq-form">
            <TextField fullWidth onChange={(v) => setStepForm({ ...stepForm, title: v })} value={stepForm.title ?? ""}>
              <Label>Step title</Label>
              <Input placeholder="e.g. Upload transcript" variant="secondary" />
            </TextField>
            <TextField fullWidth onChange={(v) => setStepForm({ ...stepForm, subtitle: v })} value={stepForm.subtitle ?? ""}>
              <Label>Subtitle</Label>
              <Input variant="secondary" />
            </TextField>
            <TextField fullWidth onChange={(v) => setStepForm({ ...stepForm, description: v })} value={stepForm.description ?? ""}>
              <Label>Description / instructions</Label>
              <TextArea rows={4} variant="secondary" />
            </TextField>
            <div className="afq-form-row">
              <TextField fullWidth onChange={(v) => setStepForm({ ...stepForm, estimated_time: v })} value={stepForm.estimated_time ?? ""}>
                <Label>Estimated time</Label>
                <Input placeholder="e.g. 20 minutes" variant="secondary" />
              </TextField>
              <TextField fullWidth onChange={(v) => setStepForm({ ...stepForm, due_at: v ? new Date(v).toISOString() : null })} value={(stepForm.due_at ?? "").slice(0, 10)}>
                <Label>Due date</Label>
                <Input type="date" variant="secondary" />
              </TextField>
            </div>
            <TextField
              fullWidth
              onChange={(v) => setStepForm({ ...stepForm, document_keys: v.split(",").map((x) => x.trim()).filter(Boolean) })}
              value={(stepForm.document_keys ?? []).join(", ")}
            >
              <Label>Document keys (comma separated)</Label>
              <Input placeholder="passport, transcript" variant="secondary" />
            </TextField>
            <Select onSelectionChange={(k) => setStepForm({ ...stepForm, status: k as PublishState })} selectedKey={stepForm.status ?? "draft"}>
              <Label>Status</Label>
              <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
              <Select.Popover><ListBox>{STATUSES.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
            </Select>
            <div className="afq-mini-card" style={{ flexDirection: "row", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div className="afq-mini-title">Required step</div>
                <div className="afq-mini-sub">Optional steps do not block the stage from completing.</div>
              </div>
              <Switch aria-label="Required step" isSelected={stepForm.required ?? true} onChange={(v) => setStepForm({ ...stepForm, required: v })}>
                <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control></Switch.Content>
              </Switch>
            </div>
          </div>
        </AdminDialog>
      )}

      {/* ── Step content editor ── */}
      {editing && <StepEditor onClose={() => { setEditing(null); void load(); }} step={editing} />}

      {/* ── Version history ── */}
      {history && (
        <AdminDialog
          description={`${history.rows.length} change(s) recorded`}
          footer={<Button onPress={() => setHistory(null)} size="sm" variant="primary">Close</Button>}
          icon={<History className="size-5" />}
          onClose={() => setHistory(null)}
          size="lg"
          title="Version history"
        >
          {history.rows.length === 0 ? (
            <p className="afq-mini-sub">No changes recorded yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.rows.map((r) => (
                <div className="afq-mini-card" key={String(r.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b className="afq-mini-title">{String(r.summary || r.field || "Change")}</b>
                    <span className="afq-mini-sub">{new Date(String(r.created_at)).toLocaleString("en-GB")}</span>
                  </div>
                  <div className="afq-mini-sub">{String(r.editor_email ?? "unknown editor")} · field: {String(r.field ?? "—")}</div>
                  <Button
                    onPress={async () => {
                      const next = r.next as Record<string, unknown>;
                      if (!next) return;
                      if (history.entity === "stage") await saveStage({ ...(next as Partial<DbStage>), id: history.id }, "Restored from history");
                      else await saveStep({ ...(next as Partial<DbStep>), id: history.id }, "Restored from history");
                      setHistory(null); await load();
                    }}
                    size="sm" style={{ alignSelf: "flex-start" }} variant="secondary"
                  >
                    Restore this version
                  </Button>
                </div>
              ))}
            </div>
          )}
        </AdminDialog>
      )}

      {confirmRemove && (
        <ConfirmDialog
          body={confirmRemove.body} iconClassName="afq-dialog-ico afq-dialog-ico--danger"
          onClose={() => setConfirmRemove(null)} onYes={confirmRemove.onYes} title={confirmRemove.title} tone="danger"
        />
      )}
    </div>
  );
}

export default JourneyManager;
