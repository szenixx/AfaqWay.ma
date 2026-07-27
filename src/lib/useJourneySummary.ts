"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchApprovals, fetchDocuments, fetchProgress, fetchStages, fetchSteps,
  stepRequirements, subscribeJourney, type Plan,
} from "@/lib/journeyDb";
import { assembleRoadmap, roadmapProgress } from "@/lib/journey";

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
};

const EMPTY: JourneySummary = {
  loading: true, pct: 0, stepsDone: 0, stepsTotal: 0,
  stageIndex: 0, stageCount: 0, stageTitle: "", docsApproved: 0, docsTotal: 0, docsPending: 0,
};

export function useJourneySummary(userId: string, plan: string | null, degree?: string | null): JourneySummary {
  const [summary, setSummary] = useState<JourneySummary>(EMPTY);

  const load = useCallback(async () => {
    const stages = await fetchStages((plan ?? "self_service") as Plan, "LT", false, degree);
    const steps = await fetchSteps(stages.map((s) => s.id));
    const [progress, approvals, uploads] = await Promise.all([
      fetchProgress(userId), fetchApprovals(userId), fetchDocuments(userId),
    ]);
    const road = assembleRoadmap(stages, steps, progress, approvals);
    const overall = roadmapProgress(road);
    const current = road.find((s) => s.state === "current" || s.state === "waiting_approval") ?? road[0];

    const required = steps.flatMap((s) => stepRequirements(s).map((r) => `${s.id}:${r.key}`));
    const byKey = new Map(uploads.map((u) => [`${u.step_id}:${u.doc_key}`, u]));
    const docsApproved = required.filter((k) => byKey.get(k)?.status === "approved").length;
    const docsPending = required.filter((k) => {
      const st = byKey.get(k)?.status;
      return !st || st === "pending" || st === "uploaded" || st === "under_review";
    }).length;

    setSummary({
      loading: false,
      pct: overall.pct, stepsDone: overall.done, stepsTotal: overall.total,
      stageIndex: current ? current.index : 0, stageCount: road.length, stageTitle: current?.title ?? "",
      docsApproved, docsTotal: required.length, docsPending,
    });
  }, [userId, plan, degree]);

  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeJourney(() => { void load(); }, "summary"), [load]);

  return summary;
}
