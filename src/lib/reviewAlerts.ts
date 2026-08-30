"use client";

import { useEffect, useState } from "react";
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

  // TEMP DEBUG — fetching the actual rows (not just a head count), including
  // the reviewed_at/reviewed_by/review_comment columns each table already
  // keeps. Those three are the tell: a row a decision was genuinely never
  // made on has them null; a row showing them SET while its state/status still
  // matches the "pending" condition is a row that was decided once and then
  // put back into the pending bucket by something else — the workflow bug,
  // not a badge bug. Remove alongside the rest of the [badge-debug] tracing.
  const [steps, docs, stages] = await Promise.all([
    supabase.from("journey_progress")
      .select("id, user_id, step_id, state, submitted_at, reviewed_at, reviewed_by, review_comment, updated_at")
      .eq("state", "in_progress")
      .in("user_id", ids),
    /* A document is waiting on us from the moment it is uploaded until it is
       approved or sent back. */
    supabase.from("journey_documents")
      .select("id, user_id, step_id, doc_key, status, reviewed_at, reviewed_by, review_comment, updated_at")
      .in("status", ["uploaded", "under_review"])
      .in("user_id", ids),
    /* A SUBMITTED STAGE was missing from this count entirely. Sending a stage
       to an advisor writes `waiting` to journey_stage_approvals, which nothing
       here looked at, so the one request that most needs an admin never lit a
       badge. The two counts above cover a submitted step and an uploaded
       document; this is the third thing a student can be waiting on. */
    supabase.from("journey_stage_approvals")
      .select("stage_id, user_id, state, reviewed_at, reviewed_by, review_comment")
      .eq("state", "waiting")
      .in("user_id", ids),
  ]);

  const stepRows = (steps.data ?? []) as {
    id: string; user_id: string; step_id: string; state: string;
    submitted_at: string | null; reviewed_at: string | null; reviewed_by: string | null;
    review_comment: string; updated_at: string;
  }[];
  const docRows = (docs.data ?? []) as {
    id: string; user_id: string; step_id: string; doc_key: string; status: string;
    reviewed_at: string | null; reviewed_by: string | null; review_comment: string; updated_at: string;
  }[];
  const stageRows = (stages.data ?? []) as {
    stage_id: string; user_id: string; state: string;
    reviewed_at: string | null; reviewed_by: string | null; review_comment: string;
  }[];

  // Logged as one pre-stringified string, not a live object: a browser
  // console collapses an object/array reference to "Array(5) [ {…}, … ]"
  // once it's copied as text, which hides exactly the fields we need. A
  // string can't collapse — pasting it back gives the real values.
  console.log(`[badge-debug] countPending(${plan}): journey_progress — condition "state = 'in_progress'" matched:\n` +
    JSON.stringify(stepRows.map((r) => ({
      table: "journey_progress", user_id: r.user_id, step_id: r.step_id, state: r.state,
      submitted_at: r.submitted_at, reviewed_at: r.reviewed_at, reviewed_by: r.reviewed_by,
      review_comment: r.review_comment, updated_at: r.updated_at,
      previously_reviewed: r.reviewed_at !== null,
      note: r.reviewed_at !== null
        ? "⚠ has a reviewed_at timestamp WHILE still counted as in_progress — this row was decided once and is back in the queue"
        : "never reviewed — genuinely new/pending",
    })), null, 2), steps.error ?? "");

  console.log(`[badge-debug] countPending(${plan}): journey_documents — condition "status in (uploaded, under_review)" matched:\n` +
    JSON.stringify(docRows.map((r) => ({
      table: "journey_documents", user_id: r.user_id, step_id: r.step_id, doc_key: r.doc_key, status: r.status,
      reviewed_at: r.reviewed_at, reviewed_by: r.reviewed_by, review_comment: r.review_comment, updated_at: r.updated_at,
      previously_reviewed: r.reviewed_at !== null,
      note: r.reviewed_at !== null
        ? "⚠ has a reviewed_at timestamp WHILE still counted as pending — decided once, back in the queue"
        : "never reviewed — genuinely new/pending",
    })), null, 2), docs.error ?? "");

  console.log(`[badge-debug] countPending(${plan}): journey_stage_approvals — condition "state = 'waiting'" matched:\n` +
    JSON.stringify(stageRows.map((r) => ({
      table: "journey_stage_approvals", user_id: r.user_id, stage_id: r.stage_id, state: r.state,
      reviewed_at: r.reviewed_at, reviewed_by: r.reviewed_by, review_comment: r.review_comment,
      note: r.reviewed_at !== null
        ? "⚠ has a reviewed_at timestamp WHILE still 'waiting' — should be impossible, the resubmit guard clears these"
        : "not yet decided (or a genuine resubmission, which legitimately clears the old decision)",
    })), null, 2), stages.error ?? "");

  console.log(`[badge-debug] countPending(${plan}): TOTAL = ${stepRows.length} step(s) + ${docRows.length} doc(s) + ${stageRows.length} stage(s) = ${stepRows.length + docRows.length + stageRows.length}`);

  return stepRows.length + docRows.length + stageRows.length;
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

/* One shared channel and one shared fetch cycle for the whole admin session —
 * the same shape presence.ts and advisor.ts already use, and for the same
 * reason. useReviewAlerts has two simultaneous callers in a normal admin
 * session: the sidebar badge in admin/page.tsx, mounted for the whole
 * session, and WalletSummary's own copy, mounted whenever Finance is open.
 * Both used to call `supabase.channel("admin-review-alerts")` independently —
 * supabase-js hands back the SAME channel object for a topic already in use,
 * so whichever of the two mounted second was adding postgres_changes
 * listeners to a channel already subscribed by the first, which supabase-js
 * does not honour. That caller's `load` never fired again on a live change,
 * which is exactly "the admin decides, the badge doesn't clear" — a plain
 * page refresh always looked right because the ONE-TIME fetch on mount never
 * depended on the broken subscription in the first place.
 *
 * Fixed by making the channel and the fetch module-level singletons: every
 * component reads from the same cache and is notified through the same
 * listener set, so there is only ever one subscription to this topic no
 * matter how many components ask for it. */
let cachedCounts: Record<Plan, number> = { self_service: 0, full_service: 0 };
let lastCounts: Record<Plan, number> | null = null;
let alertsChannel: ReturnType<typeof supabase.channel> | null = null;
const alertListeners = new Set<(counts: Record<Plan, number>) => void>();

/** Exported so a decision handler can force the badge to drop the moment its
 *  write succeeds, without waiting on the Realtime event for the same row —
 *  belt and braces, since that event depends on the table actually being
 *  live-replicated in this project, which is infrastructure, not code. */
export async function refreshReviewAlerts() {
  // TEMP DEBUG — tracing the "decision made, dot doesn't clear" report end to
  // end. Remove once the sequence is confirmed in a real browser console.
  console.log("[badge-debug] refreshReviewAlerts: querying…");
  const [self_service, full_service] = await Promise.all([
    countPending("self_service"), countPending("full_service"),
  ]);
  const next = { self_service, full_service };
  console.log("[badge-debug] refreshReviewAlerts: DB counts =", next, "| listeners registered =", alertListeners.size);

  const before = lastCounts;
  const grew = before && (next.self_service > before.self_service || next.full_service > before.full_service);
  lastCounts = next;
  cachedCounts = next;
  for (const notify of alertListeners) notify(next);
  console.log("[badge-debug] refreshReviewAlerts: notified all listeners with", next);
  // One chime for the whole session regardless of how many components are
  // listening — a second useReviewAlerts() call must not double it up.
  if (grew) playReviewChime();
}

function ensureReviewAlertsChannel() {
  if (alertsChannel) return;
  alertsChannel = supabase
    .channel("admin-review-alerts")
    .on("postgres_changes", { event: "*", schema: "public", table: "journey_progress" }, () => { void refreshReviewAlerts(); })
    /* An upload has to ring the same bell a submitted step does. */
    .on("postgres_changes", { event: "*", schema: "public", table: "journey_documents" }, () => { void refreshReviewAlerts(); })
    /* And a submitted stage, now that it is counted. */
    .on("postgres_changes", { event: "*", schema: "public", table: "journey_stage_approvals" }, () => { void refreshReviewAlerts(); });
  alertsChannel.subscribe();
}

/**
 * Live pending-review counts for both plans.
 *
 * The chime plays only when a count rises, and never on the first read, so
 * opening the workspace with a backlog is silent.
 */
export function useReviewAlerts(enabled: boolean) {
  const [counts, setCounts] = useState<Record<Plan, number>>(cachedCounts);

  useEffect(() => {
    if (!enabled) return;
    ensureReviewAlertsChannel();
    // TEMP DEBUG — wrapping setCounts so the console shows the exact moment
    // this specific component's state is told about a new count. Remove once
    // the sequence is confirmed in a real browser console.
    const listener = (next: Record<Plan, number>) => {
      console.log("[badge-debug] useReviewAlerts: setCounts ->", next);
      setCounts(next);
    };
    alertListeners.add(listener);
    // Its own fresh read on becoming enabled; the shared cache used for the
    // initial state above may be a moment stale if this is the first
    // listener since the channel went quiet.
    void refreshReviewAlerts();
    return () => { alertListeners.delete(listener); };
  }, [enabled]);

  return counts;
}
