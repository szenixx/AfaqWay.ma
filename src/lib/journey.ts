"use client";

/* Journey roadmap — the model behind the student's Journey page.

   The page is a roadmap of stages, not a checklist: a student works inside one
   unlocked stage at a time, and the next stage opens only when every step is
   done, its documents are in, and an advisor approves the stage.

   Nothing about the roadmap is hardcoded in a component. Stages, steps, counts,
   statuses and progress are all derived here from the assigned roadmap, so a
   different country or plan only means different data. */


/* A student never marks their own step complete. They submit it, and only an
   administrator's approval turns it into "completed". */
export type StepState = "completed" | "submitted" | "rejected" | "skipped" | "pending" | "locked";
export type StageState = "completed" | "current" | "waiting_approval" | "locked";

export type JourneyStep = {
  id: string;
  index: number;
  title: string;
  description: string;
  state: StepState;
  due?: string;
  /** Document category this step maps to inside the Documents module. */
  documentKeys: string[];
  /** Document requirements the administrator defined on this step. */
  requirements: DocRequirement[];
  /** Whether the administrator allows this step to be skipped. */
  allowSkip: boolean;
  /** What the student wrote when they submitted it. */
  studentComment: string;
  /** The advisor's message back to the student. */
  reviewComment: string;
  submittedAt: string | null;
  completedAt: string | null;
};

export type JourneyStage = {
  id: string;
  index: number;
  title: string;
  description: string;
  eta: string;
  state: StageState;
  steps: JourneyStep[];
  done: number;
  total: number;
  pct: number;
  completedOn?: string;
  /** The advisor's decision on this stage, when the student has asked for one. */
  approval?: "waiting" | "approved" | "rejected";
  /** Accent used by the stage icon; the step icons stay grey by design. */
  tone: "blue" | "purple" | "amber" | "red" | "green" | "teal" | "pink" | "grey";
};

const TONES: JourneyStage["tone"][] = ["purple", "green", "amber", "blue", "pink", "teal"];


/** Overall roadmap completion, shared with the right panel and the sidebar. */
export function roadmapProgress(stages: JourneyStage[]): { done: number; total: number; pct: number } {
  const total = stages.reduce((s, st) => s + st.total, 0);
  const done = stages.reduce((s, st) => s + st.done, 0);
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

/** One requirement joined with whatever the student has uploaded for it. */
export type StepDoc = {
  requirement: DocRequirement;
  upload: DbDocument | null;
  status: DocStatus;
};

/**
 * Document summary for a step: the administrator's requirements joined with the
 * student's uploads. Uploading itself always happens in the Documents module.
 */
export function stepDocuments(step: JourneyStep, uploads: DbDocument[] = []) {
  const byKey = new Map(uploads.filter((u) => u.step_id === step.id).map((u) => [u.doc_key, u]));
  const docs: StepDoc[] = step.requirements.map((requirement) => {
    const upload = byKey.get(requirement.key) ?? null;
    return { requirement, upload, status: (upload?.status ?? "pending") as DocStatus };
  });

  const mandatory = docs.filter((d) => d.requirement.required);
  const uploaded = docs.filter((d) => d.status !== "pending").length;
  const verified = docs.filter((d) => d.status === "approved").length;
  return {
    docs,
    required: docs.length,
    uploaded,
    verified,
    remaining: Math.max(0, docs.length - uploaded),
    pct: docs.length ? Math.round((verified / docs.length) * 100) : 0,
    /** A step with outstanding mandatory uploads cannot be marked done. */
    missingRequired: mandatory.filter((d) => d.status === "pending").length,
  };
}

export const STATE_BADGE: Record<StepState | StageState, { label: string; cls: string }> = {
  completed: { label: "Completed", cls: "pill pill-green" },
  submitted: { label: "Waiting review", cls: "pill pill-amber" },
  rejected: { label: "Changes requested", cls: "pill pill-red" },
  skipped: { label: "Skipped", cls: "pill pill-grey" },
  current: { label: "In progress", cls: "pill pill-indigo" },
  pending: { label: "Pending", cls: "pill pill-amber" },
  waiting_approval: { label: "Waiting approval", cls: "pill pill-amber" },
  locked: { label: "Locked", cls: "pill pill-grey" },
};

/* ── Database-backed roadmap ──────────────────────────────────────────────────
   Assembles the published configuration for a plan with the student's own
   progress and the advisor's stage approvals. Replaces every demo object. */

import { stepAllowsSkip, stepRequirements, type DbApproval, type DbDocument, type DocRequirement, type DocStatus, type DbProgress, type DbStage, type DbStep } from "@/lib/journeyDb";

export function assembleRoadmap(
  stages: DbStage[],
  steps: DbStep[],
  progress: Map<string, DbProgress>,
  approvals: Map<string, DbApproval>,
): JourneyStage[] {
  const byStage = new Map<string, DbStep[]>();
  steps.forEach((st) => { const list = byStage.get(st.stage_id) ?? []; list.push(st); byStage.set(st.stage_id, list); });

  // The first stage that is not finished-and-approved is the one in play.
  const finished = (s: DbStage) => {
    const list = byStage.get(s.id) ?? [];
    const done = list.every((st) => { const v = progress.get(st.id)?.state; return v === "completed" || v === "skipped"; });
    return list.length > 0 && done && approvals.get(s.id)?.state === "approved";
  };
  const firstOpen = stages.findIndex((s) => !finished(s));

  return stages.map((stage, i) => {
    const list = (byStage.get(stage.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const total = list.length;
    const settled = (id: string) => { const v = progress.get(id)?.state; return v === "completed" || v === "skipped"; };
    const done = list.filter((st) => settled(st.id)).length;
    const allDone = total > 0 && done === total;
    const approval = approvals.get(stage.id)?.state;

    let state: StageState;
    if (approval === "approved") state = "completed";
    else if (firstOpen === -1 || i < firstOpen) state = "completed";
    else if (i === firstOpen) state = allDone ? "waiting_approval" : "current";
    else state = "locked";

    /* Steps have no required order: a student may work on any of them. A step
       turns completed only when an administrator approves it. */
    const journeySteps: JourneyStep[] = list.map((st, j) => {
      const row = progress.get(st.id);
      const own = row?.state;
      let stepState: StepState;
      if (own === "completed") stepState = "completed";
      else if (own === "skipped") stepState = "skipped";
      else if (state === "locked") stepState = "locked";
      else if (own === "in_progress") stepState = "submitted";   // sent for review
      else if (own === "rejected") stepState = "rejected";
      else stepState = "pending";
      return {
        id: st.id,
        index: j + 1,
        title: st.title,
        description: st.description || st.subtitle || "",
        state: stepState,
        due: st.due_at ? new Date(st.due_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : undefined,
        documentKeys: st.document_keys ?? [],
        requirements: stepRequirements(st),
        allowSkip: stepAllowsSkip(st),
        studentComment: row?.student_comment ?? "",
        reviewComment: row?.review_comment ?? "",
        submittedAt: row?.submitted_at ?? null,
        completedAt: row?.completed_at ?? null,
      };
    });

    return {
      id: stage.id,
      index: i + 1,
      title: stage.title,
      description: stage.description,
      eta: "",
      state,
      approval,
      steps: journeySteps,
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
      tone: (stage.tone as JourneyStage["tone"]) || TONES[i % TONES.length],
    };
  });
}
