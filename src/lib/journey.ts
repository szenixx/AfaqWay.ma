"use client";

/* Journey roadmap — the model behind the student's Journey page.

   The page is a roadmap of stages, not a checklist: a student works inside one
   unlocked stage at a time, and the next stage opens only when every step is
   done, its documents are in, and an advisor approves the stage.

   Nothing about the roadmap is hardcoded in a component. Stages, steps, counts,
   statuses and progress are all derived here from the assigned roadmap, so a
   different country or plan only means different data. */


/* By default a student never marks their own step complete: they submit it, and
   only an administrator's approval turns it into "completed".

   The Excel names exceptions, and they are exceptions by design rather than by
   accident. Of several Stage 4 steps it says plainly "Do not require admin
   approval" — nobody but the student can know whether they attended their VFS
   appointment, so waiting for an advisor to confirm it would stall the journey
   on a fact the advisor cannot check. Which steps those are travels on the step
   itself (rules.completion) and is enforced again by the database guard. */
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

  /* ── Behaviour, from the step's rules ── */
  /** Who settles this step: an advisor, the student, or the TRP outcome. */
  completion: CompletionMode;
  /** Wording of the confirmation dialog, when the Excel gives one. */
  confirm: ConfirmSpec | null;
  /** Items to tick before the step can be completed. */
  gate: string[];
  /** A form to fill in first, e.g. "vfs_appointment". */
  capture: string;
  /** An outcome this step records, e.g. "trp". */
  decision: string;
  /** Locked until every earlier step in the stage is settled. */
  requiresSteps: boolean;
  /** A one-shot message raised when this step's stage opens. */
  announce: AnnounceSpec | null;
  /** What the student has already answered here. */
  meta: StepMeta;
  /** Earlier steps in this stage that are not settled yet, when gated. */
  blockedBy: string[];

  /* ── Optional module ── */
  /** Non-empty when this step is the container for an optional module. */
  moduleKey: string;
  /** The module this step belongs to, when it is one of the children. */
  moduleOf: string;
  /** Container only: whether the student has switched the module on. */
  moduleEnabled: boolean;
  /** Container only: whether the reminder has been declined for good. */
  moduleReminderDismissed: boolean;
  /** Container only: the wording of its enable, disable and reminder dialogs. */
  moduleDialogs: ModuleDialogs;
  /** Container only: the icon drawn behind the card. */
  moduleIcon: string;
  /** Container only: its child steps, in order. */
  children: JourneyStep[];
  /** Label for the action button, when the step names its own. */
  cta: string;
  /** Pressing the button opens a support request instead of completing. */
  support: boolean;
  /** The reviewer may only approve this step, never reject it. */
  approveOnly: boolean;
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
  /**
   * How this stage completes.
   *
   * "approval" — the student sends it to an advisor, who opens the next stage.
   * "auto"     — its own last step decides it. Stage 4 ends on the residence
   *              permit outcome, which the Excel says unlocks Stage 5 directly:
   *              asking an advisor to approve a decision the Migration
   *              Department already made would only add a delay.
   */
  unlock: "approval" | "auto";
  /**
   * Locked because of the student's plan rather than their progress.
   *
   * Stage 5 belongs to Full Service. A Self Service student sees it sitting at
   * the end of their roadmap and can read what it covers, but it never opens,
   * no matter how much they finish — so the roadmap shows the upgrade rather
   * than a lock with no explanation.
   */
  planLocked: boolean;
};

const TONES: JourneyStage["tone"][] = ["purple", "pink", "amber", "blue", "green", "teal"];


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

/**
 * How each journey state is labelled and coloured.
 *
 * A tone, not a class name: the caller hands it to the shared Pill, so this
 * table describes the state and owns no markup. Holding CSS class strings here
 * is what let these badges quietly keep their own styling while every visible
 * pill in the platform moved to the shared component.
 */
export const STATE_BADGE: Record<StepState | StageState, { label: string; tone: PillTone }> = {
  completed: { label: "Completed", tone: "green" },
  submitted: { label: "Waiting review", tone: "amber" },
  rejected: { label: "Changes requested", tone: "red" },
  skipped: { label: "Skipped", tone: "grey" },
  current: { label: "In progress", tone: "indigo" },
  pending: { label: "Pending", tone: "amber" },
  waiting_approval: { label: "Waiting approval", tone: "amber" },
  locked: { label: "Locked", tone: "grey" },
};

/**
 * How each document status is labelled and indicated.
 *
 * One table for the whole platform. There used to be six copies of this — in
 * the documents module, the replace dialog, the step modal, the review modal,
 * the admin user details and the workspace data file — and they had already
 * drifted: the same approved document read "Approved" in one place and
 * "Verified" in another, and a rejected one was "Needs changes" or "Rejected"
 * depending on which screen you were looking at.
 */
export const DOC_STATUS: Record<DocStatus, { label: string; state: StatusState }> = {
  pending:       { label: "Not uploaded", state: "neutral" },
  uploaded:      { label: "Uploaded",     state: "submitted" },
  under_review:  { label: "Under review", state: "waiting" },
  needs_changes: { label: "Needs changes", state: "rejected" },
  approved:      { label: "Verified",     state: "approved" },
};

/** The journey states, as the shared status vocabulary names them. */
export const STATE_STATUS: Record<StepState | StageState, StatusState> = {
  completed: "completed",
  submitted: "waiting",
  rejected: "rejected",
  skipped: "cancelled",
  current: "processing",
  pending: "pending",
  waiting_approval: "waiting",
  locked: "neutral",
};

/* ── Database-backed roadmap ──────────────────────────────────────────────────
   Assembles the published configuration for a plan with the student's own
   progress and the advisor's stage approvals. Replaces every demo object. */

import {
  stageRequiresPlan, stageUnlock, stepAllowsSkip, stepAnnounce, stepApproveOnly, stepCapture,
  stepCompletion, stepConfirm, stepCta, stepDecision, stepGate, stepIsSupport,
  stepModule, stepModuleDialogs, stepModuleIcon, stepModuleOf,
  stepRequirements, stepRequiresSteps, stepUnlockedBy,
  type AnnounceSpec, type CompletionMode, type ConfirmSpec, type DbApproval, type DbDocument,
  type ModuleDialogs,
  type DocRequirement, type DocStatus, type DbProgress, type DbStage, type DbStep, type StepMeta,
} from "@/lib/journeyDb";
import type { PillTone } from "@/components/ds/Pill";
import type { StatusState } from "@/components/ds/Status";

export function assembleRoadmap(
  stages: DbStage[],
  steps: DbStep[],
  progress: Map<string, DbProgress>,
  approvals: Map<string, DbApproval>,
  options: {
    /** The student's plan, for stages sold with one plan only. */
    plan?: string | null;
    /**
     * Opens every stage and step FOR READING.
     *
     * Granted by an administrator on the profile. Reviewing Stage 5 otherwise
     * means walking an account through a TRP approval and a support approval
     * just to read a paragraph, and faking that progress leaves rows behind
     * that look like a real student's history.
     *
     * It unlocks the view and nothing else: every write still goes through
     * journey_progress_guard, so a tester cannot approve their own reviewed
     * step any more than anyone else can.
     */
    tester?: boolean;
  } = {},
): JourneyStage[] {
  const tester = Boolean(options.tester);
  const byStage = new Map<string, DbStep[]>();
  steps.forEach((st) => { const list = byStage.get(st.stage_id) ?? []; list.push(st); byStage.set(st.stage_id, list); });

  const settledState = (id: string) => {
    const v = progress.get(id)?.state;
    return v === "completed" || v === "skipped";
  };

  /* The first stage that is not finished is the one in play.
     "Finished" means every step is settled AND the stage has been signed off —
     by an advisor for most stages, or by its own last step for a stage the
     Excel says unlocks automatically. */
  const finished = (s: DbStage) => {
    const list = byStage.get(s.id) ?? [];
    if (list.length === 0) return false;
    if (!list.every((st) => settledState(st.id))) return false;
    return stageUnlock(s) === "auto" || approvals.get(s.id)?.state === "approved";
  };
  /* A stage the student's plan excludes is not "in play" and must never become
     the current one, or a Self Service student would finish Stage 4 and land on
     a stage they can never open, with the roadmap insisting it is their turn. */
  const planBlocked = (s: DbStage) => {
    if (tester) return false;
    const needs = stageRequiresPlan(s);
    return Boolean(needs) && s.plan !== needs;
  };
  const firstOpen = stages.findIndex((s) => !finished(s) && !planBlocked(s));

  return stages.map((stage, i) => {
    const list = (byStage.get(stage.id) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);

    /* ── Optional modules ──────────────────────────────────────────────────
       A module's steps exist in the database whether or not the student wants
       them. Until the module is switched on they are hidden AND uncounted: a
       student who funds their own studies must be able to finish the stage
       without four sponsor uploads sitting unfinished in their progress. */
    const moduleOn = new Map<string, boolean>();
    for (const st of list) {
      const key = stepModule(st);
      if (key) moduleOn.set(key, Boolean((progress.get(st.id)?.meta as StepMeta | undefined)?.moduleEnabled));
    }
    /** True for a step that should not appear or count right now. */
    const dormant = (st: DbStep) => {
      const of = stepModuleOf(st);
      return Boolean(of) && !moduleOn.get(of);
    };
    /* The container is a card, not a task, so it never counts either way. */
    const counts = (st: DbStep) => !stepModule(st) && !dormant(st);

    const counted = list.filter(counts);
    const total = counted.length;
    const done = counted.filter((st) => settledState(st.id)).length;
    const allDone = total > 0 && done === total;
    const approval = approvals.get(stage.id)?.state;
    const unlock = stageUnlock(stage);
    const planLocked = planBlocked(stage);

    /* Two reasons a stage can be shut that have nothing to do with progress:
       the student's plan does not include it, and it has no steps to work on.
       Both stay locked however far the student has come, so they are settled
       before the ordinary "where am I" logic runs. */
    let state: StageState;
    if (planLocked || total === 0) state = "locked";
    else if (approval === "approved") state = "completed";
    else if (firstOpen === -1 || i < firstOpen) state = "completed";
    else if (i === firstOpen) {
      // An automatic stage never sits in "waiting_approval": finishing its last
      // step is the approval, so it is either in progress or already behind us.
      state = allDone && unlock === "approval" ? "waiting_approval" : "current";
    } else state = tester ? "current" : "locked";

    /* Steps have no required order: a student may work on any of them, except
       where the Excel says otherwise ("This step must remain locked … until
       every previous step in Stage 3 has been completed"). */
    const journeySteps: JourneyStep[] = list.map((st, j) => {
      const row = progress.get(st.id);
      const own = row?.state;
      const requiresSteps = stepRequiresSteps(st);
      const unlockedBy = stepUnlockedBy(st);

      /* The names of the steps still outstanding, so a locked step can "display
         a checklist showing any incomplete prerequisites" rather than just
         refusing to open.

         Two shapes. requiresSteps waits for EVERY earlier step in the stage
         (Stage 3's MIGRIS submission). unlockedBy waits for ONE named step
         wherever it sits, which is how Stage 5 works: approving the support
         request opens all twelve remaining steps at once, so each of them
         depends on that single step and not on each other. */
      const blockedBy = tester
        ? []
        : unlockedBy
          ? list.filter((p) => p.title === unlockedBy && !settledState(p.id)).map((p) => p.title)
          : requiresSteps
            ? list.slice(0, j).filter((prev) => !settledState(prev.id)).map((prev) => prev.title)
            : [];

      let stepState: StepState;
      if (own === "completed") stepState = "completed";
      else if (own === "skipped") stepState = "skipped";
      /* A tester reads a step in whatever stage it sits in, so the stage's own
         lock does not close it. Their real progress still shows: an untouched
         step reads "pending", not "unlocked-for-testing". */
      else if (state === "locked" && !tester) stepState = "locked";
      else if (blockedBy.length > 0) stepState = "locked";
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
        completion: stepCompletion(st),
        confirm: stepConfirm(st),
        gate: stepGate(st),
        capture: stepCapture(st),
        decision: stepDecision(st),
        requiresSteps,
        announce: stepAnnounce(st),
        meta: (row?.meta ?? {}) as StepMeta,
        blockedBy,
        cta: stepCta(st),
        support: stepIsSupport(st),
        approveOnly: stepApproveOnly(st),
        moduleKey: stepModule(st),
        moduleOf: stepModuleOf(st),
        moduleEnabled: Boolean((row?.meta as StepMeta | undefined)?.moduleEnabled),
        moduleReminderDismissed: Boolean((row?.meta as StepMeta | undefined)?.moduleReminderDismissed),
        moduleDialogs: stepModuleDialogs(st),
        moduleIcon: stepModuleIcon(st),
        children: [],
      };
    });

    /* Children hang off their container rather than sitting beside it, so the
       roadmap renders one card that expands instead of five loose steps. They
       keep their own state and numbering; only their placement changes. */
    const byModule = new Map<string, JourneyStep[]>();
    for (const step of journeySteps) {
      if (!step.moduleOf) continue;
      const group = byModule.get(step.moduleOf) ?? [];
      group.push(step);
      byModule.set(step.moduleOf, group);
    }
    for (const step of journeySteps) {
      if (!step.moduleKey) continue;
      step.children = (byModule.get(step.moduleKey) ?? []).map((c, n) => ({ ...c, index: n + 1 }));
    }
    /* Only containers and ordinary steps remain at the top level, renumbered so
       a student never sees "Step 14" for what the page shows as the fourth. */
    const topLevel = journeySteps
      .filter((step) => !step.moduleOf)
      .map((step, n) => ({ ...step, index: n + 1 }));

    return {
      id: stage.id,
      index: i + 1,
      title: stage.title,
      description: stage.description,
      eta: "",
      state,
      approval,
      steps: topLevel,
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
      // Stage 2 is pink, always — the imported row already has its own
      // "green" stored in journey_stages.tone (scripts/import-journey.mjs's
      // STAGE_TONES, at the time the DB was seeded), which otherwise wins
      // over this function's own fallback below and made that fallback a
      // no-op for every already-imported stage. Forced by position rather
      // than by re-importing, since nothing here can reach the live table
      // to update the stored value directly.
      tone: i === 1 ? "pink" : ((stage.tone as JourneyStage["tone"]) || TONES[i % TONES.length]),
      unlock,
      planLocked,
    };
  });
}
