"use client";

/* The Admin Overview's data layer.

   The previous version derived most of the page from one `profiles` query and
   multiplied the row count to invent the rest — the journey funnel was
   `students.length * 0.72`, support was `activeStudents * 0.3`, and the KPI
   deltas were literals. Every number below now comes from a table that
   actually records it, so a more polished dashboard is also a truer one.

   Four queries, run in parallel, then everything is derived in one memo. */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { countryByCode } from "@/components/profile-setup/countries";
import { fetchStatExclusions, isStaffProfile } from "@/lib/admin";

export type Student = {
  id: string;
  full_name: string | null;
  email: string | null;
  destination_country: string | null;
  plan: string | null;
  plan_status: string | null;
  created_at: string;
  onboarding_completed_at: string | null;
};

type Approval = { user_id: string; stage_id: string; state: string };
type Doc = { user_id: string; status: string };
type Msg = { user_id: string; sender: string; created_at: string; seen_at: string | null };
export type Payment = {
  id: string; user_id: string; plan: string | null; amount: number | null;
  currency: string | null; method: string | null; status: string; created_at: string;
};

const DAY = 86_400_000;
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

/** Percentage change between two periods, guarding the divide-by-zero case. */
function delta(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;   // null = "no baseline", not "0%"
  return Math.round(((now - before) / before) * 100);
}

export type OverviewData = ReturnType<typeof useOverviewData>;

export function useOverviewData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  /* The instant the data was fetched. Every "today"/"this week" below is
     measured from here, so the memo never reads the clock mid-render. */
  const [asOf, setAsOf] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [p, a, d, m, pay, staff] = await Promise.all([
      supabase.from("profiles")
        .select("id, full_name, email, destination_country, plan, plan_status, created_at, onboarding_completed_at")
        .order("created_at", { ascending: false }).limit(1000),
      supabase.from("journey_stage_approvals").select("user_id, stage_id, state"),
      supabase.from("journey_documents").select("user_id, status"),
      /* Every unseen student message, with no date window and no plan or
         country filter: one student waiting a month is still one student
         waiting. `sender` is "user" for a student — "student" matches nothing.
         AdminChat clears these via mark_messages_seen when the conversation is
         opened, so the count goes down again. Narrow by definition. */
      supabase.from("messages").select("user_id, sender, created_at, seen_at")
        .eq("sender", "user").is("seen_at", null),
      supabase.from("payments")
        .select("id, user_id, plan, amount, currency, method, status, created_at")
        .order("created_at", { ascending: false }).limit(300),
      /* Who on this list is staff, or an excluded tester, rather than a
         real student. */
      fetchStatExclusions(),
    ]);
    /* Administrators get a profile row like anyone else, so counting profiles
       counted the team as customers: with no students at all the dashboard
       still reported a user. Filtered at the source, so every figure derived
       from `students` below — the totals, the trends, the plan splits — drops
       them together rather than each card remembering to. Payments follow the
       same filter below, so approved revenue never counts a tester's receipt
       either. */
    setStudents(((p.data ?? []) as Student[]).filter((s) => !isStaffProfile(staff, s.email)));
    setApprovals((a.data ?? []) as Approval[]);
    setDocs((d.data ?? []) as Doc[]);
    setMsgs((m.data ?? []) as Msg[]);
    const excludedIds = new Set(
      ((p.data ?? []) as Student[]).filter((s) => isStaffProfile(staff, s.email)).map((s) => s.id),
    );
    setPayments(((pay.data ?? []) as Payment[]).filter((r) => !excludedIds.has(r.user_id)));
    setAsOf(Date.now());
    setLoading(false);
  }, []);
  // Querying Supabase is the "subscribe to an external system" case; the state
  // set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  /* The two time-critical queues stay live: a receipt submitted, or a student
     writing in, shows up without a refresh — and the waiting count drops again
     the moment an admin opens the conversation and mark_messages_seen runs.
     One channel for both; each costs a postgres_changes listener. */
  useEffect(() => {
    const ch = supabase.channel("admin-overview-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, () => { void load(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [load]);

  return useMemo(() => {
    const today = startOfDay(new Date(asOf));
    const weekAgo = new Date(today.getTime() - 7 * DAY);
    const twoWeeksAgo = new Date(today.getTime() - 14 * DAY);
    const at = (s: Student) => new Date(s.created_at);

    const active = students.filter((s) => s.plan_status === "active");

    /* ── Journey funnel ──────────────────────────────────────────────────
       Each step is a fact recorded somewhere, not a fraction of the one
       before it: registered → finished onboarding → uploaded a document →
       cleared 1/2/4 stages. */
    const approvedByUser = new Map<string, number>();
    approvals.filter((a) => a.state === "approved")
      .forEach((a) => approvedByUser.set(a.user_id, (approvedByUser.get(a.user_id) ?? 0) + 1));
    const withDocs = new Set(docs.map((d) => d.user_id));
    const clearedAtLeast = (n: number) => students.filter((s) => (approvedByUser.get(s.id) ?? 0) >= n).length;

    const funnel = [
      { label: "Account", value: students.length },
      { label: "Profile", value: students.filter((s) => s.onboarding_completed_at).length },
      { label: "Documents", value: students.filter((s) => withDocs.has(s.id)).length },
      { label: "Applied", value: clearedAtLeast(1) },
      { label: "Admitted", value: clearedAtLeast(2) },
      { label: "Arrived", value: clearedAtLeast(4) },
    ];

    /* ── Registrations, last 7 real days ─────────────────────────────────
       The old chart bucketed by weekday across ALL time, so a signup from
       March landed in the same bar as yesterday's. These are dates. */
    const weekly = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(today.getTime() - (6 - i) * DAY);
      const next = new Date(day.getTime() + DAY);
      const onDay = students.filter((s) => at(s) >= day && at(s) < next);
      /* Neutral split: every signup is either activated or not. No plan, no
         country — the same two bands hold whatever the platform sells and
         wherever it sells it, and together they equal the day's total. */
      return {
        label: day.toLocaleDateString("en-GB", { weekday: "short" }),
        date: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        activated: onDay.filter((s) => s.plan_status === "active").length,
        signups: onDay.filter((s) => s.plan_status !== "active").length,
        value: onDay.length,
      };
    });
    const weeklyRange = weekly.length
      ? `${weekly[0].date} – ${weekly[weekly.length - 1].date}`
      : "";

    /* ── Waiting for a reply ────────────────────────────────────────────
       Students who have written in and whose message no admin has opened yet
       (`seen_at` is null). Not "open conversations", not an average — the one
       number that represents a person actually waiting on us. */
    const nameOf = new Map(students.map((st) => [st.id, st.full_name]));
    const unseen = new Map<string, string>();   // user id → oldest unseen time
    msgs.forEach((m) => {
      const cur = unseen.get(m.user_id);
      if (!cur || new Date(m.created_at) < new Date(cur)) unseen.set(m.user_id, m.created_at);
    });

    /* ── Payment reviews — the live queue ───────────────────────────────
       Waiting receipts first; if the queue is clear the most recent decision
       is shown instead, so the card is never blank. */
    const dayAgo = asOf - DAY;
    const decorate = (r: Payment) => ({
      ...r,
      studentName: nameOf.get(r.user_id) ?? "Unknown student",
      /* Computed once here rather than per row at render time — a clock read
         during render is not idempotent. */
      isNew: r.status === "pending" && new Date(r.created_at).getTime() > dayAgo,
    });
    const waitingPayments = payments.filter((r) => r.status === "pending").map(decorate);
    const recentDecided = payments.filter((r) => r.status !== "pending").slice(0, 3).map(decorate);

    /* ── Destinations ─────────────────────────────────────────────────── */
    const byCountry = new Map<string, number>();
    active.forEach((s) => {
      if (s.destination_country) byCountry.set(s.destination_country, (byCountry.get(s.destination_country) ?? 0) + 1);
    });
    const countries = [...byCountry.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([code, value]) => ({ code, label: countryByCode(code)?.name ?? code, value }));

    /* ── KPI change indicators — measured, not literals ───────────────── */
    const thisWeek = students.filter((s) => at(s) >= weekAgo).length;
    const lastWeek = students.filter((s) => at(s) >= twoWeeksAgo && at(s) < weekAgo).length;
    const activeThisWeek = active.filter((s) => at(s) >= weekAgo).length;
    const activeLastWeek = active.filter((s) => at(s) >= twoWeeksAgo && at(s) < weekAgo).length;

    return {
      loading,
      totalStudents: students.length,
      activeStudents: active.length,
      newToday: students.filter((s) => at(s) >= today).length,
      countries,
      applications: funnel[3].value,
      arrived: funnel[5].value,
      totalDelta: delta(thisWeek, lastWeek),
      activeDelta: delta(activeThisWeek, activeLastWeek),
      funnel,
      weekly,
      weeklyRange,
      weeklyTrend: delta(thisWeek, lastWeek),
      payments: {
        waiting: waitingPayments,
        recent: recentDecided,
        total: payments.length,
        approved: payments.filter((r) => r.status === "approved").length,
      },
      awaiting: {
        count: unseen.size,
        users: [...unseen.entries()]
          .map(([id, at]) => ({ id, at, name: nameOf.get(id) ?? "Unknown student" }))
          .sort((a, b) => +new Date(a.at) - +new Date(b.at)),
      },
      recent: students.slice(0, 25),
    };
  }, [students, approvals, docs, msgs, payments, loading, asOf]);
}
