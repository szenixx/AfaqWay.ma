"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* Platform activity, per student, per day.
 *
 * Everything here is read from rows the platform already writes. Nothing is
 * generated, padded or smoothed: a day with no activity is an empty square,
 * because that is what actually happened. A graph that invents its own history
 * is worse than no graph — it teaches the reader to distrust the real ones.
 *
 * The four sources are the four things a student does that leave a record:
 *
 *   journey_events      every journey interaction — a step submitted, a
 *                       decision received, a stage advanced
 *   messages            messages the student sent (theirs only; an advisor's
 *                       reply is not the student's activity)
 *   journey_documents   documents uploaded, dated by their last change
 *   schedule_events     appointments, deadlines, notes and reminders created
 *
 * Deliberately absent: logins, page views and profile visits. The platform does
 * not record them — there is no session or pageview table — so they cannot be
 * counted. Adding them means writing them down first; until then they are
 * simply not part of this graph. */

export type ActivityDay = {
  /** YYYY-MM-DD, in the reader's own timezone. */
  date: string;
  count: number;
  /** What made up that day's count, for the tooltip. */
  breakdown: { journey: number; messages: number; documents: number; schedule: number };
};

export type ActivitySummary = {
  days: ActivityDay[];
  total: number;
  /** Consecutive days with activity, counting back from today. */
  streak: number;
  /** The busiest single day in the window. */
  best: number;
  loading: boolean;
};

const iso = (d: Date | string) => {
  const date = typeof d === "string" ? new Date(d) : d;
  // Local date, not UTC: a student's Monday evening is their Monday.
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

type Source = keyof ActivityDay["breakdown"];

/**
 * One year of daily activity for a student.
 *
 * Reads the four sources in parallel and buckets them by local day. A table
 * that does not exist yet — or that the reader may not select from — comes back
 * as an error, which is counted as zero rather than failing the whole graph.
 */
export async function fetchActivity(userId: string, days = 365): Promise<ActivityDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();

  /** Pulls the timestamps out of one result, treating any error as no rows. */
  const stampsOf = (
    result: { data: unknown; error: unknown }, column: string,
  ): string[] => {
    if (result.error || !Array.isArray(result.data)) return [];
    return (result.data as Record<string, unknown>[])
      .map((row) => row[column])
      .filter((value): value is string => typeof value === "string");
  };

  const [journey, messages, documents, schedule] = await Promise.all([
    supabase.from("journey_events").select("created_at").eq("user_id", userId).gte("created_at", sinceIso),
    // The student's own messages only; an advisor's reply is not their activity.
    supabase.from("messages").select("created_at").eq("user_id", userId).eq("sender", "user").gte("created_at", sinceIso),
    // Dated by last change, so a re-upload counts on the day it happened.
    supabase.from("journey_documents").select("updated_at").eq("user_id", userId).gte("updated_at", sinceIso),
    supabase.from("schedule_events").select("created_at").eq("user_id", userId).gte("created_at", sinceIso),
  ]);

  const results: { source: Source; stamps: string[] }[] = [
    { source: "journey", stamps: stampsOf(journey, "created_at") },
    { source: "messages", stamps: stampsOf(messages, "created_at") },
    { source: "documents", stamps: stampsOf(documents, "updated_at") },
    { source: "schedule", stamps: stampsOf(schedule, "created_at") },
  ];

  // Every day in the window exists, so gaps render as gaps rather than vanish.
  const byDate = new Map<string, ActivityDay>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDate.set(iso(d), { date: iso(d), count: 0, breakdown: { journey: 0, messages: 0, documents: 0, schedule: 0 } });
  }

  for (const { source, stamps } of results) {
    for (const stamp of stamps) {
      const day = byDate.get(iso(stamp));
      if (!day) continue;             // outside the window after timezone shift
      day.count++;
      day.breakdown[source]++;
    }
  }

  return [...byDate.values()];
}

/** Live activity for one student, with the totals the header shows. */
export function useActivity(userId: string | null | undefined, days = 365): ActivitySummary {
  const [state, setState] = useState<Omit<ActivitySummary, "loading">>({ days: [], total: 0, streak: 0, best: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const list = await fetchActivity(userId, days);

    let streak = 0;
    // Count back from the most recent day; the first empty day ends the run.
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].count === 0) break;
      streak++;
    }

    setState({
      days: list,
      total: list.reduce((sum, d) => sum + d.count, 0),
      best: list.reduce((max, d) => Math.max(max, d.count), 0),
      streak,
    });
    setLoading(false);
  }, [userId, days]);

  // Fetching is the "subscribe to an external system" case; the state set here
  // is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  return { ...state, loading };
}
