"use client";

import { supabase } from "@/lib/supabase/client";
import type { ScheduleEvent } from "@/lib/schedule";

/* Schedule data access.

   Events live in the database, not the browser, so a student sees the same
   calendar on every device and an advisor can work on it with them. The row
   shape is translated to the ScheduleEvent the UI already uses, so nothing
   downstream had to change. */

export type RepeatRule = "none" | "daily" | "weekly" | "monthly" | "yearly";

/* Who owns an event decides who may change it. A student owns what they add;
   everything else is placed on their calendar by someone else and is read-only
   to them. The database enforces this, so the UI only has to show it. */
export type EventOwner = "student" | "advisor" | "platform" | "country" | "system";

export const OWNER_META: Record<EventOwner, { label: string; icon: string; tone: string }> = {
  student:  { label: "You",      icon: "user",     tone: "indigo" },
  advisor:  { label: "Advisor",  icon: "advisor",  tone: "green" },
  platform: { label: "Platform", icon: "platform", tone: "amber" },
  country:  { label: "Country",  icon: "country",  tone: "grey" },
  system:   { label: "System",   icon: "system",   tone: "grey" },
};

/** A student may only edit or delete what they created themselves. */
export const canStudentEdit = (owner: EventOwner | string | undefined) => (owner ?? "student") === "student";

export type DbEventRow = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  event_end_time: string | null;
  category: string;
  university: string;
  mode: string;
  location: string;
  completed: boolean;
  pinned: boolean;
  checklist: { label: string; done: boolean }[];
  reminder: { enabled?: boolean; timing?: string };
  repeat_rule: RepeatRule;
  repeat_until: string | null;
  colour: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

/** A schedule event as the calendar UI wants it, plus the fields only it has. */
export type FullEvent = ScheduleEvent & {
  userId: string;
  /** When the event ends, e.g. a meeting's block runs longer than one instant. */
  endTime?: string;
  repeatRule: RepeatRule;
  repeatUntil?: string;
  colour?: string;
  owner: EventOwner;
};

const toEvent = (r: DbEventRow): FullEvent => ({
  id: r.id,
  userId: r.user_id,
  kind: r.kind as FullEvent["kind"],
  title: r.title,
  description: r.description || undefined,
  date: r.event_date,
  time: r.event_time || undefined,
  endTime: r.event_end_time || undefined,
  createdBy: (r.created_by as FullEvent["createdBy"]) ?? "student",
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  completed: r.completed,
  pinned: r.pinned,
  category: r.category || undefined,
  university: r.university || undefined,
  mode: r.mode || undefined,
  location: r.location || undefined,
  checklist: Array.isArray(r.checklist) ? r.checklist : [],
  reminder: r.reminder?.enabled === undefined ? undefined
    : { enabled: Boolean(r.reminder.enabled), timing: (r.reminder.timing ?? "1_day") as FullEvent["reminder"] extends undefined ? never : "same_day" | "1_day" | "3_days" | "1_week" },
  repeatRule: r.repeat_rule ?? "none",
  repeatUntil: r.repeat_until ?? undefined,
  colour: r.colour || undefined,
  owner: (r.created_by as EventOwner) ?? "student",
});

const toRow = (e: Partial<FullEvent> & { userId: string }) => ({
  user_id: e.userId,
  kind: e.kind ?? "note",
  title: e.title ?? "",
  description: e.description ?? "",
  event_date: e.date,
  event_time: e.time ?? null,
  event_end_time: e.endTime ?? null,
  category: e.category ?? "",
  university: e.university ?? "",
  mode: e.mode ?? "",
  location: e.location ?? "",
  completed: e.completed ?? false,
  pinned: e.pinned ?? false,
  checklist: e.checklist ?? [],
  reminder: e.reminder ?? {},
  repeat_rule: e.repeatRule ?? "none",
  repeat_until: e.repeatUntil ?? null,
  colour: e.colour ?? "",
  created_by: e.owner ?? e.createdBy ?? "student",
});

/** True once migration 10 has been applied. */
export async function scheduleReady(): Promise<boolean> {
  const { error } = await supabase.from("schedule_events").select("id").limit(1);
  return !error;
}

export async function fetchEvents(userId: string): Promise<FullEvent[]> {
  const { data, error } = await supabase
    .from("schedule_events").select("*").eq("user_id", userId).order("event_date");
  return error ? [] : ((data ?? []) as DbEventRow[]).map(toEvent);
}

export async function saveEvent(event: Partial<FullEvent> & { userId: string; date: string }): Promise<string | null> {
  const row = toRow(event);
  const { data, error } = event.id
    ? await supabase.from("schedule_events").update(row).eq("id", event.id).select("id").maybeSingle()
    : await supabase.from("schedule_events").insert(row).select("id").maybeSingle();
  return error || !data ? null : (data as { id: string }).id;
}

export async function deleteEvent(id: string): Promise<void> {
  await supabase.from("schedule_events").delete().eq("id", id);
}

/** Drag and drop: only the date changes, so this is one narrow write. */
export async function moveEvent(id: string, date: string): Promise<void> {
  await supabase.from("schedule_events").update({ event_date: date }).eq("id", id);
}

export function subscribeSchedule(userId: string, onChange: () => void): () => void {
  const channel = supabase
    .channel(`schedule-${userId.slice(0, 8)}-${Math.random().toString(36).slice(2, 6)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "schedule_events" }, onChange);
  channel.subscribe();
  return () => { void supabase.removeChannel(channel); };
}

/* ── Recurrence ───────────────────────────────────────────────────────────── */

const addTo = (d: Date, rule: RepeatRule): Date => {
  const n = new Date(d);
  if (rule === "daily") n.setDate(n.getDate() + 1);
  else if (rule === "weekly") n.setDate(n.getDate() + 7);
  else if (rule === "monthly") n.setMonth(n.getMonth() + 1);
  else if (rule === "yearly") n.setFullYear(n.getFullYear() + 1);
  return n;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Expands recurring events into the occurrences that fall inside a window.
 * Only the first occurrence is a real row; the rest are generated for display,
 * which keeps the table small and editing unambiguous.
 */
export function expandRecurring(events: FullEvent[], fromISO: string, toISO: string): FullEvent[] {
  const out: FullEvent[] = [];
  const windowEnd = new Date(toISO);

  for (const event of events) {
    if (!event.repeatRule || event.repeatRule === "none") { out.push(event); continue; }
    const stop = event.repeatUntil ? new Date(event.repeatUntil) : windowEnd;
    const last = stop < windowEnd ? stop : windowEnd;

    let cursor = new Date(event.date);
    let guard = 0;
    while (cursor <= last && guard < 400) {
      if (iso(cursor) >= fromISO) {
        out.push(guard === 0 ? event : { ...event, id: `${event.id}::${iso(cursor)}`, date: iso(cursor) });
      }
      cursor = addTo(cursor, event.repeatRule);
      guard += 1;
    }
  }
  return out;
}

/** A generated occurrence carries its source row's id before the separator. */
export const sourceId = (id: string) => id.split("::")[0];
export const isOccurrence = (id: string) => id.includes("::");
