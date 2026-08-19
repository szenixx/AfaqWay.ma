"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchApprovals, fetchDocuments, fetchProgress, fetchStages, fetchSteps,
  stepRequirements, subscribeJourney, type Plan,
} from "@/lib/journeyDb";
import { assembleRoadmap, roadmapProgress, type StageState, type StepState } from "@/lib/journey";
import type { DocStatus } from "@/lib/journeyDb";

/* Live journey and document counters.

   The Overview, the right panel and anything else that shows "how far am I"
   read from here, so every screen quotes the same numbers and updates without a
   refresh when an advisor approves something. */

export type JourneySummary = {
  loading: boolean;
  pct: number;
  stepsDone: number;
  stepsTotal: number;
  stageIndex: number;
  stageCount: number;
  stageTitle: string;
  docsApproved: number;
  docsTotal: number;
  docsPending: number;
  /** Every stage with its state, for the roadmap strip on the Overview. */
  stages: { id: string; title: string; state: StageState }[];
  /** A four-step window onto the roadmap, for the dashboard's Next Steps
      snapshot. Same steps the Journey page renders, just sliced. */
  nextSteps: PreviewStep[];
  /** The most recently touched uploads, newest first. */
  recentDocs: { id: string; name: string; status: DocStatus; updatedAt: string }[];
};

/** One row of the Next Steps snapshot — the same shape the Journey page's own
    rows are built from, reduced to what a preview needs. */
export type PreviewStep = {
  id: string;
  title: string;
  stageTitle: string;
  state: StepState;
  /** Held shut by the stage's own order: an earlier step is not approved yet. */
  blocked: boolean;
};

const EMPTY: JourneySummary = {
  loading: true, pct: 0, stepsDone: 0, stepsTotal: 0,
  stageIndex: 0, stageCount: 0, stageTitle: "", docsApproved: 0, docsTotal: 0, docsPending: 0,
  stages: [], nextSteps: [], recentDocs: [],
};

/* ── The four-step window ──────────────────────────────────────────────────
   Anchored on the step the student should act on next, falling back through
   progressively weaker signals so the card is never empty:

     1. the first step they can actually start,
     2. otherwise the step that is with an advisor, or the first unfinished
        one — including a locked one, since "what is coming" is still useful,
     3. otherwise the tail of the roadmap, for a student who has finished.

   The window is then clamped so it always yields four rows where four exist. */
function pickWindow(all: PreviewStep[], size = 4): PreviewStep[] {
  if (all.length === 0) return [];

  const settled = (s: PreviewStep) => s.state === "completed" || s.state === "skipped";
  let anchor = all.findIndex((s) => !settled(s) && !s.blocked && s.state !== "submitted");
  if (anchor === -1) anchor = all.findIndex((s) => s.state === "submitted");
  if (anchor === -1) anchor = all.findIndex((s) => !settled(s));
  if (anchor === -1) anchor = Math.max(0, all.length - size);   // everything done

  // Never run past the end: shift the window back rather than return fewer.
  return all.slice(Math.min(anchor, Math.max(0, all.length - size)), undefined).slice(0, size);
}

export function useJourneySummary(
  userId: string, plan: string | null, degree?: string | null, tester = false,
): JourneySummary {
  const [summary, setSummary] = useState<JourneySummary>(EMPTY);

  const load = useCallback(async () => {
    const stages = await fetchStages((plan ?? "self_service") as Plan, "LT", false, degree);
    const steps = await fetchSteps(stages.map((s) => s.id));
    const [progress, approvals, uploads] = await Promise.all([
      fetchProgress(userId), fetchApprovals(userId), fetchDocuments(userId),
    ]);
    const road = assembleRoadmap(stages, steps, progress, approvals, { plan, tester });
    const overall = roadmapProgress(road);
    /* When nothing is in progress the student is either at the very start or
       has finished everything there is to do. Falling back to road[0] in both
       cases told a student who had completed the journey that they were on
       Stage 1, so the finished case falls back to the last stage they worked in. */
    const current =
      road.find((s) => s.state === "current" || s.state === "waiting_approval")
      ?? [...road].reverse().find((s) => s.state === "completed")
      ?? road[0];

    const required = steps.flatMap((s) => stepRequirements(s).map((r) => `${s.id}:${r.key}`));
    const byKey = new Map(uploads.map((u) => [`${u.step_id}:${u.doc_key}`, u]));
    const docsApproved = required.filter((k) => byKey.get(k)?.status === "approved").length;
    const docsPending = required.filter((k) => {
      const st = byKey.get(k)?.status;
      return !st || st === "pending" || st === "uploaded" || st === "under_review";
    }).length;

    /* The names the student would actually recognise on an upload, resolved
       from the requirement rather than the storage key. */
    const nameFor = new Map(
      steps.flatMap((s) => stepRequirements(s).map((r) => [`${s.id}:${r.key}`, r.name || r.key] as const)),
    );
    const recentDocs = uploads
      .filter((u) => u.file_path)
      .slice()
      .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
      .slice(0, 4)
      .map((u) => ({
        id: u.id,
        name: nameFor.get(`${u.step_id}:${u.doc_key}`) ?? u.name ?? u.doc_key,
        status: u.status,
        updatedAt: u.updated_at,
      }));

    setSummary({
      loading: false,
      pct: overall.pct, stepsDone: overall.done, stepsTotal: overall.total,
      stageIndex: current ? current.index : 0, stageCount: road.length, stageTitle: current?.title ?? "",
      docsApproved, docsTotal: required.length, docsPending,
      stages: road.map((s) => ({ id: s.id, title: s.title, state: s.state })),
      nextSteps: pickWindow(
        /* Flattened in roadmap order, so the window reads as the journey does.
           Plan-excluded stages are left out — a Self Service student should
           not be told their next step is one they cannot reach. */
        road.filter((s) => !s.planLocked).flatMap((stage) =>
          stage.steps.map((st) => ({
            id: st.id,
            title: st.title,
            stageTitle: stage.title,
            state: st.state,
            blocked: st.blockedBy.length > 0,
          })),
        ),
      ),
      recentDocs,
    });
  }, [userId, plan, degree, tester]);

  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeJourney(() => { void load(); }), [load]);

  return summary;
}
