"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Plan } from "@/lib/journeyDb";

/* Pending review requests, per plan, live.

   Drives the red badge beside each user-management module and the alert that
   plays when a new request lands. Both read the same subscription, so the
   number and the sound can never disagree. */

/** Steps a student has submitted and nobody has decided on yet. */
async function countPending(plan: Plan): Promise<number> {
  const { data: stages } = await supabase
    .from("journey_stages").select("id").eq("plan", plan).eq("country", "LT");
  const stageIds = ((stages ?? []) as { id: string }[]).map((s) => s.id);
  if (!stageIds.length) return 0;

  const { data: steps } = await supabase.from("journey_steps").select("id").in("stage_id", stageIds);
  const stepIds = ((steps ?? []) as { id: string }[]).map((s) => s.id);
  if (!stepIds.length) return 0;

  const { count } = await supabase
    .from("journey_progress")
    .select("id", { count: "exact", head: true })
    .eq("state", "in_progress")
    .in("step_id", stepIds);
  return count ?? 0;
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
      .on("postgres_changes", { event: "*", schema: "public", table: "journey_progress" }, () => { void load(); });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [enabled, load]);

  return counts;
}
