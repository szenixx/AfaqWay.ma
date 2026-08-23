"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Plan } from "@/lib/journeyDb";

/* Pending review requests, per plan, live.

   Drives the red badge beside each user-management module and the alert that
   plays when a new request lands. Both read the same subscription, so the
   number and the sound can never disagree. */

/** Everything a student has handed over that nobody has decided on yet —
 *  submitted steps AND uploaded documents.
 *
 *  Counted by the STUDENT'S current plan, not by which plan's steps the row
 *  happens to hang off. Two things go wrong the other way, and both were
 *  showing up as inflated badges:
 *
 *    · a student who changed plan leaves rows attached to their old plan's
 *      steps, so one person was counted under both plans at once;
 *    · a deleted account leaves its rows behind, and nothing filtered them
 *      out — they can never be actioned because the student is gone.
 *
 *  Going through `profiles` fixes both: every row counted belongs to a student
 *  who exists and is on this plan today. */
async function countPending(plan: Plan): Promise<number> {
  const { data: people } = await supabase
    .from("profiles").select("id").eq("plan", plan);
  const ids = ((people ?? []) as { id: string }[]).map((p) => p.id);
  if (!ids.length) return 0;

  const [steps, docs, stages] = await Promise.all([
    supabase.from("journey_progress")
      .select("id", { count: "exact", head: true })
      .eq("state", "in_progress")
      .in("user_id", ids),
    /* A document is waiting on us from the moment it is uploaded until it is
       approved or sent back. */
    supabase.from("journey_documents")
      .select("id", { count: "exact", head: true })
      .in("status", ["uploaded", "under_review"])
      .in("user_id", ids),
    /* A SUBMITTED STAGE was missing from this count entirely. Sending a stage
       to an advisor writes `waiting` to journey_stage_approvals, which nothing
       here looked at, so the one request that most needs an admin never lit a
       badge. The two counts above cover a submitted step and an uploaded
       document; this is the third thing a student can be waiting on. */
    supabase.from("journey_stage_approvals")
      .select("stage_id", { count: "exact", head: true })
      .eq("state", "waiting")
      .in("user_id", ids),
  ]);
  return (steps.count ?? 0) + (docs.count ?? 0) + (stages.count ?? 0);
}

/**
 * A short two-tone chime, distinct from every other sound on the platform, so
 * a review request is recognisable without looking. Synthesised rather than
 * shipped as a file: no asset to load, and nothing to go missing.
 */
export function playReviewChime() {
  try {
    type WindowWithAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const Ctor = window.AudioContext ?? (window as WindowWithAudio).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();

    // Two rising notes: a request arriving, not an error.
    [
      { at: 0, hz: 660, ms: 140 },
      { at: 0.13, hz: 990, ms: 220 },
    ].forEach(({ at, hz, ms }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(hz, ctx.currentTime + at);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + ms / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + ms / 1000);
    });

    // Release the device once the chime has finished.
    setTimeout(() => { void ctx.close(); }, 900);
  } catch {
    // A browser that blocks audio until the first gesture must not break the badge.
  }
}

/**
 * Live pending-review counts for both plans.
 *
 * The chime plays only when a count rises, and never on the first read, so
 * opening the workspace with a backlog is silent.
 */
export function useReviewAlerts(enabled: boolean) {
  const [counts, setCounts] = useState<Record<Plan, number>>({ self_service: 0, full_service: 0 });
  const seen = useRef<Record<Plan, number> | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    const [self_service, full_service] = await Promise.all([
      countPending("self_service"), countPending("full_service"),
    ]);
    const next = { self_service, full_service };

    const before = seen.current;
    const grew = before && (next.self_service > before.self_service || next.full_service > before.full_service);
    seen.current = next;
    setCounts(next);
    if (grew) playReviewChime();
  }, [enabled]);

  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-review-alerts")
      .on("postgres_changes", { event: "*", schema: "public", table: "journey_progress" }, () => { void load(); })
      /* An upload has to ring the same bell a submitted step does. */
      .on("postgres_changes", { event: "*", schema: "public", table: "journey_documents" }, () => { void load(); })
      /* And a submitted stage, now that it is counted. */
      .on("postgres_changes", { event: "*", schema: "public", table: "journey_stage_approvals" }, () => { void load(); });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [enabled, load]);

  return counts;
}
