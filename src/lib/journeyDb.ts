"use client";

import { supabase } from "@/lib/supabase/client";
import { notify } from "@/lib/notifications";

/* Journey engine — data access.

   The roadmap a student sees is whatever an administrator published for their
   country and plan. Full Service and Self Service are separate rows, so editing
   one never touches the other. Nothing here is mocked: every stage, step,
   content block, link, attachment and reminder comes from the database.

   Until supabase/migrations/journey/*.sql is applied, every read
   returns empty and the UI shows its "not configured yet" state instead of
   breaking. */

export type Plan = "self_service" | "full_service";
export type PublishState = "draft" | "published" | "archived";

export type DbStage = {
  id: string; country: string; plan: Plan; sort_order: number;
  title: string; description: string; icon: string; tone: string;
  status: PublishState; rules: Record<string, unknown>;
};

export type DbStep = {
  id: string; stage_id: string; sort_order: number;
  title: string; subtitle: string; description: string;
  status: PublishState; required: boolean; estimated_time: string;
  due_at: string | null; document_keys: string[]; rules: Record<string, unknown>;
};

export type DbBlock = {
  id: string; step_id: string; sort_order: number; kind: string; enabled: boolean;
  title: string; body: string; data: Record<string, unknown>; audience: "student" | "advisor";
};

export type DbReminder = {
  id: string; step_id: string; kind: string; title: string; message: string;
  due_at: string | null; repeat_rule: string; priority: string; channels: string[]; enabled: boolean;
};

/** A document an administrator requires on a step. Stored in journey_steps.rules. */
export type DocRequirement = {
  key: string;
  name: string;
  description: string;
  instructions: string;
  required: boolean;
  /** Comma-separated extensions, e.g. "pdf,jpg,png". Empty means anything. */
  acceptedTypes: string;
  maxSizeMb: number;
  /** Optional sample or template the student can download before uploading. */
  templatePath: string;
  templateName: string;
  notes: string;
};

export const emptyRequirement = (key: string): DocRequirement => ({
  key, name: "", description: "", instructions: "", required: true,
  acceptedTypes: "pdf,jpg,png", maxSizeMb: 4, templatePath: "", templateName: "", notes: "",
});

/** Reads a step's document requirements out of its rules payload. */
export function stepRequirements(step: Pick<DbStep, "rules">): DocRequirement[] {
  const raw = (step.rules as { documents?: unknown })?.documents;
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => ({ ...emptyRequirement(""), ...(r as Partial<DocRequirement>) })).filter((r) => r.key);
}

/** True when the administrator allows this step to be skipped. */
export const stepAllowsSkip = (step: Pick<DbStep, "rules">) => Boolean((step.rules as { allowSkip?: boolean })?.allowSkip);

export type DocStatus = "pending" | "uploaded" | "under_review" | "needs_changes" | "approved";

export type DbDocument = {
  id: string; user_id: string; step_id: string | null; doc_key: string; name: string;
  file_path: string; file_name: string; mime_type: string; size_bytes: number;
  status: DocStatus; review_comment: string; reviewed_at: string | null; created_at: string; updated_at: string;
};

export type DbEvent = {
  id: string; user_id: string; step_id: string | null; stage_id: string | null;
  kind: string; actor: "student" | "admin" | "system"; actor_email: string | null;
  message: string; created_at: string;
};

export type DbProgress = {
  step_id: string;
  state: "pending" | "in_progress" | "completed" | "rejected" | "skipped";
  completed_at: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  student_comment?: string;
  review_comment?: string;
  advisor_note?: string;
};
export type DbApproval = { stage_id: string; state: "waiting" | "approved" | "rejected"; review_comment: string };

/** True once the migration has been applied. Everything degrades until then. */
export async function journeyReady(): Promise<boolean> {
  const { error } = await supabase.from("journey_stages").select("id").limit(1);
  return !error;
}

/* ── Reads ────────────────────────────────────────────────────────────────── */

export async function fetchStages(
  plan: Plan, country = "LT", includeDrafts = false, degree?: string | null,
): Promise<DbStage[]> {
  let q = supabase.from("journey_stages").select("*").eq("country", country).eq("plan", plan).order("sort_order");
  if (!includeDrafts) q = q.eq("status", "published");
  else q = q.neq("status", "archived");
  const { data, error } = await q;
  if (error) return [];
  const rows = (data ?? []) as DbStage[];
  /* A stage may be limited to one degree (the Bachelor journey imported from
     the Excel). Stages without a degree apply to everyone. */
  if (!degree) return rows;
  return rows.filter((s) => {
    const only = (s.rules as { degree?: string })?.degree;
    return !only || only.toLowerCase() === degree.toLowerCase();
  });
}

export async function fetchSteps(stageIds: string[], includeDrafts = false): Promise<DbStep[]> {
  if (!stageIds.length) return [];
  let q = supabase.from("journey_steps").select("*").in("stage_id", stageIds).order("sort_order");
  if (!includeDrafts) q = q.eq("status", "published");
  else q = q.neq("status", "archived");
  const { data, error } = await q;
  return error ? [] : ((data ?? []) as DbStep[]);
}

/** Blocks for one step — loaded on demand when the modal opens. */
export async function fetchBlocks(stepId: string, forAdmin = false): Promise<DbBlock[]> {
  let q = supabase.from("journey_blocks").select("*").eq("step_id", stepId).order("sort_order");
  if (!forAdmin) q = q.eq("enabled", true).eq("audience", "student");
  const { data, error } = await q;
  return error ? [] : ((data ?? []) as DbBlock[]);
}

export async function fetchReminders(stepIds: string[]): Promise<DbReminder[]> {
  if (!stepIds.length) return [];
  const { data, error } = await supabase.from("journey_reminders").select("*").in("step_id", stepIds).eq("enabled", true);
  return error ? [] : ((data ?? []) as DbReminder[]);
}

export async function fetchProgress(userId: string): Promise<Map<string, DbProgress>> {
  const { data, error } = await supabase
    .from("journey_progress")
    .select("step_id, state, completed_at, submitted_at, reviewed_at, student_comment, review_comment, advisor_note")
    .eq("user_id", userId);
  const map = new Map<string, DbProgress>();
  if (!error) (data as DbProgress[] ?? []).forEach((p) => map.set(p.step_id, p));
  return map;
}

export async function fetchApprovals(userId: string): Promise<Map<string, DbApproval>> {
  const { data, error } = await supabase.from("journey_stage_approvals").select("stage_id, state, review_comment").eq("user_id", userId);
  const map = new Map<string, DbApproval>();
  if (!error) (data as DbApproval[] ?? []).forEach((a) => map.set(a.stage_id, a));
  return map;
}

/* ── Student writes (own progress only; RLS enforces it) ──────────────────── */

export async function setStepState(userId: string, stepId: string, state: DbProgress["state"], comment?: string): Promise<void> {
  const now = new Date().toISOString();
  await supabase.from("journey_progress").upsert(
    {
      user_id: userId, step_id: stepId, state,
      completed_at: state === "completed" ? now : null,
      submitted_at: state === "in_progress" ? now : null,
      ...(comment === undefined ? {} : { student_comment: comment }),
      updated_at: now,
    },
    { onConflict: "user_id,step_id" },
  );
}

/* ── Documents ────────────────────────────────────────────────────────────── */

export async function fetchDocuments(userId: string, stepIds?: string[]): Promise<DbDocument[]> {
  let q = supabase.from("journey_documents").select("*").eq("user_id", userId).order("created_at");
  if (stepIds) {
    if (!stepIds.length) return [];
    q = q.in("step_id", stepIds);
  }
  const { data, error } = await q;
  return error ? [] : ((data ?? []) as DbDocument[]);
}

/** Records an upload against a requirement, replacing any earlier file. */
export async function saveDocument(doc: Partial<DbDocument> & { user_id: string; doc_key: string }): Promise<void> {
  await supabase.from("journey_documents").upsert(
    { ...doc, status: doc.status ?? "uploaded", updated_at: new Date().toISOString() },
    { onConflict: "user_id,step_id,doc_key" },
  );
}

/** Administrator verification of one document. */
export async function reviewDocument(id: string, status: DocStatus, comment = ""): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const { data: row } = await supabase.from("journey_documents")
    .update({ status, review_comment: comment, reviewed_by: data.user?.id ?? null, reviewed_at: new Date().toISOString() })
    .eq("id", id).select("user_id, name, doc_key").maybeSingle();

  // The student hears about their own document without opening the step.
  const doc = row as { user_id: string; name: string; doc_key: string } | null;
  if (doc) {
    const verdict = status === "approved" ? "verified" : status === "needs_changes" ? "needs changes" : status;
    await notify(doc.user_id, {
      kind: "document",
      title: `${doc.name || doc.doc_key}: ${verdict}`,
      body: comment,
      link: "documents",
    });
  }
}

/* ── Timeline ─────────────────────────────────────────────────────────────── */

export async function fetchEvents(userId: string, stepId?: string): Promise<DbEvent[]> {
  let q = supabase.from("journey_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(60);
  if (stepId) q = q.eq("step_id", stepId);
  const { data, error } = await q;
  return error ? [] : ((data ?? []) as DbEvent[]);
}

export async function logEvent(e: Omit<DbEvent, "id" | "created_at" | "actor_email">): Promise<void> {
  const { data } = await supabase.auth.getUser();
  await supabase.from("journey_events").insert({ ...e, actor_email: data.user?.email ?? null });
}

/* ── Administrator review of a step ───────────────────────────────────────── */

export async function reviewStep(
  userId: string, stepId: string,
  decision: "completed" | "rejected" | "pending",
  reviewComment = "", advisorNote?: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { data } = await supabase.auth.getUser();
  await supabase.from("journey_progress").update({
    state: decision,
    completed_at: decision === "completed" ? now : null,
    review_comment: reviewComment,
    ...(advisorNote === undefined ? {} : { advisor_note: advisorNote }),
    reviewed_by: data.user?.id ?? null,
    reviewed_at: now,
    updated_at: now,
  }).eq("user_id", userId).eq("step_id", stepId);
}

/** Advisor-only note, saved without making a decision. */
export async function saveAdvisorNote(userId: string, stepId: string, note: string): Promise<void> {
  await supabase.from("journey_progress").update({ advisor_note: note, updated_at: new Date().toISOString() })
    .eq("user_id", userId).eq("step_id", stepId);
}

/* ── Realtime ─────────────────────────────────────────────────────────────── */

/** Every table whose changes must reach an open page immediately. */
const LIVE_TABLES = [
  "journey_stages", "journey_steps", "journey_blocks", "journey_reminders",
  "journey_progress", "journey_stage_approvals", "journey_documents", "journey_events",
] as const;

/* One channel for the whole app, not one per component.
   Each subscription costs 8 postgres_changes listeners, and the journey page
   mounts several subscribers at once (roadmap, summary, step modal, blocks), so
   per-component channels meant dozens of listeners and a reload storm on every
   write. Subscribers now share a single channel and a single listener set. */
let liveChannel: ReturnType<typeof supabase.channel> | null = null;
const liveListeners = new Set<() => void>();
let coalesce: ReturnType<typeof setTimeout> | null = null;

function fanout() {
  /* One action usually writes several tables (progress, then an event), which
     would otherwise reload every subscriber several times over. */
  if (coalesce) clearTimeout(coalesce);
  coalesce = setTimeout(() => {
    coalesce = null;
    for (const listener of liveListeners) listener();
  }, 120);
}

/**
 * Calls `onChange` whenever any journey row changes, so an administrator's edit
 * appears on a student's open page with no refresh. Returns an unsubscribe.
 */
export function subscribeJourney(onChange: () => void): () => void {
  liveListeners.add(onChange);

  if (!liveChannel) {
    const channel = supabase.channel("journey-live");
    for (const table of LIVE_TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, fanout);
    }
    channel.subscribe();
    liveChannel = channel;
  }

  return () => {
    liveListeners.delete(onChange);
    // The last subscriber closes the channel, so a signed-out tab goes quiet.
    if (liveListeners.size === 0 && liveChannel) {
      const channel = liveChannel;
      liveChannel = null;
      void supabase.removeChannel(channel);
    }
  };
}

/** Submits a finished stage for advisor approval. */
export async function requestStageApproval(userId: string, stageId: string): Promise<void> {
  await supabase.from("journey_stage_approvals").upsert({ user_id: userId, stage_id: stageId, state: "waiting" }, { onConflict: "user_id,stage_id" });
}

/* ── Admin writes ─────────────────────────────────────────────────────────── */

async function recordVersion(entity: string, entityId: string, field: string, previous: unknown, next: unknown, summary: string) {
  const { data } = await supabase.auth.getUser();
  await supabase.from("journey_versions").insert({
    entity, entity_id: entityId, editor_email: data.user?.email ?? null,
    field, prev_value: previous as never, next_value: next as never, summary,
  });
}

export async function saveStage(stage: Partial<DbStage> & { id?: string }, summary = "Stage updated"): Promise<string | null> {
  const patch = { ...stage, updated_at: new Date().toISOString() };
  const { data, error } = stage.id
    ? await supabase.from("journey_stages").update(patch).eq("id", stage.id).select("id").maybeSingle()
    : await supabase.from("journey_stages").insert(patch).select("id").maybeSingle();
  if (error || !data) return null;
  await recordVersion("stage", (data as { id: string }).id, "stage", null, patch, summary);
  return (data as { id: string }).id;
}

export async function saveStep(step: Partial<DbStep> & { id?: string }, summary = "Step updated"): Promise<string | null> {
  const patch = { ...step, updated_at: new Date().toISOString() };
  const { data, error } = step.id
    ? await supabase.from("journey_steps").update(patch).eq("id", step.id).select("id").maybeSingle()
    : await supabase.from("journey_steps").insert(patch).select("id").maybeSingle();
  if (error || !data) return null;
  await recordVersion("step", (data as { id: string }).id, "step", null, patch, summary);
  return (data as { id: string }).id;
}

export async function saveBlock(block: Partial<DbBlock> & { id?: string }): Promise<string | null> {
  const patch = { ...block, updated_at: new Date().toISOString() };
  const { data, error } = block.id
    ? await supabase.from("journey_blocks").update(patch).eq("id", block.id).select("id").maybeSingle()
    : await supabase.from("journey_blocks").insert(patch).select("id").maybeSingle();
  if (error || !data) return null;
  await recordVersion("block", (data as { id: string }).id, block.kind ?? "block", null, patch, "Content block saved");
  return (data as { id: string }).id;
}

export async function saveReminder(reminder: Partial<DbReminder> & { id?: string }): Promise<string | null> {
  const { data, error } = reminder.id
    ? await supabase.from("journey_reminders").update(reminder).eq("id", reminder.id).select("id").maybeSingle()
    : await supabase.from("journey_reminders").insert(reminder).select("id").maybeSingle();
  if (error || !data) return null;
  await recordVersion("reminder", (data as { id: string }).id, "reminder", null, reminder, "Reminder saved");
  return (data as { id: string }).id;
}

const removeFrom = (table: string) => async (id: string) => { await supabase.from(table).delete().eq("id", id); };
export const deleteStage = removeFrom("journey_stages");
export const deleteStep = removeFrom("journey_steps");
export const deleteBlock = removeFrom("journey_blocks");
export const deleteReminder = removeFrom("journey_reminders");

/** Drag-and-drop ordering: one write per moved row. */
export async function reorder(table: "journey_stages" | "journey_steps" | "journey_blocks", ids: string[]): Promise<void> {
  await Promise.all(ids.map((id, i) => supabase.from(table).update({ sort_order: i }).eq("id", id)));
}

/** Duplicates a stage with all of its steps, blocks and reminders. */
export async function duplicateStage(stage: DbStage): Promise<string | null> {
  const newId = await saveStage(
    { country: stage.country, plan: stage.plan, sort_order: stage.sort_order + 1, title: `${stage.title} (copy)`, description: stage.description, icon: stage.icon, tone: stage.tone, status: "draft", rules: stage.rules },
    "Stage duplicated",
  );
  if (!newId) return null;
  const steps = await fetchSteps([stage.id], true);
  for (const s of steps) {
    const stepId = await saveStep({ stage_id: newId, sort_order: s.sort_order, title: s.title, subtitle: s.subtitle, description: s.description, status: "draft", required: s.required, estimated_time: s.estimated_time, document_keys: s.document_keys, rules: s.rules }, "Step duplicated");
    if (!stepId) continue;
    for (const b of await fetchBlocks(s.id, true)) {
      await saveBlock({ step_id: stepId, sort_order: b.sort_order, kind: b.kind, enabled: b.enabled, title: b.title, body: b.body, data: b.data, audience: b.audience });
    }
  }
  return newId;
}

export async function fetchVersions(entity: string, entityId: string) {
  const { data, error } = await supabase.from("journey_versions").select("*").eq("entity", entity).eq("entity_id", entityId).order("created_at", { ascending: false }).limit(50);
  return error ? [] : (data ?? []);
}
