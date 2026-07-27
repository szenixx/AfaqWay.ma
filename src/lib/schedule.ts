"use client";

/* Schedule module — event model, official read-only dates, and the reminder
   architecture that a future WhatsApp integration plugs into.

   Student and advisor events are kept per user in local storage: this module
   adds no backend tables and changes no existing workflow. Swapping the two
   `read`/`write` helpers for a Supabase table is the only change needed when a
   server-side store is added. */

export type EventKind = "appointment" | "deadline" | "note" | "reminder" | "interview" | "official";
export type Author = "student" | "advisor" | "system";
export type ReminderTiming = "same_day" | "1_day" | "3_days" | "1_week";

export type ScheduleEvent = {
  id: string;
  kind: EventKind;
  title: string;
  description?: string;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  /** HH:MM, optional for all-day items. */
  time?: string;
  createdBy: Author;
  createdAt: string;
  updatedAt?: string;
  completed?: boolean;
  pinned?: boolean;
  category?: string;
  /** Interview extras. */
  university?: string;
  mode?: string;
  location?: string;
  checklist?: { label: string; done: boolean }[];
  /** WhatsApp reminder, prepared but not yet delivered. */
  reminder?: { enabled: boolean; timing: ReminderTiming };
};

/* ── Presentation ─────────────────────────────────────────────────────────── */

export const KIND_META: Record<EventKind, { label: string; color: string; tint: string }> = {
  note: { label: "Note", color: "#6B4BA8", tint: "#F5EEFF" },
  official: { label: "Official", color: "var(--grey)", tint: "var(--grey-tint)" },
  deadline: { label: "Deadline", color: "var(--green)", tint: "var(--green-tint)" },
  interview: { label: "Interview", color: "var(--amber)", tint: "var(--amber-tint)" },
  reminder: { label: "Reminder", color: "var(--red)", tint: "var(--red-tint)" },
  appointment: { label: "Appointment", color: "var(--indigo-600)", tint: "var(--indigo-tint)" },
};

/** Students may only touch what they created themselves. */
export const canEdit = (e: ScheduleEvent, role: "student" | "advisor") =>
  role === "advisor" ? e.createdBy !== "system" : e.createdBy === "student";

/* ── Reminders (WhatsApp-ready, delivery not yet connected) ───────────────── */

export const TIMING_LABEL: Record<ReminderTiming, string> = {
  same_day: "Same day",
  "1_day": "1 day before",
  "3_days": "3 days before",
  "1_week": "1 week before",
};

/** The platform default: 24 hours before the event. */
export const DEFAULT_TIMING: ReminderTiming = "1_day";

const OFFSET_HOURS: Record<ReminderTiming, number> = { same_day: 0, "1_day": 24, "3_days": 72, "1_week": 168 };

/** Message templates, one per event type, filled with the event's own data. */
export function reminderTemplate(e: ScheduleEvent): string {
  const at = e.time ? ` at ${e.time}` : "";
  switch (e.kind) {
    case "appointment": return `Reminder: your ${e.title} is tomorrow${at}.`;
    case "interview": return `Reminder: your ${e.title}${e.university ? ` with ${e.university}` : ""} is tomorrow${at}.`;
    case "deadline": return `Reminder: ${e.title} deadline is tomorrow${at}.`;
    case "reminder": return `Reminder: ${e.title} is tomorrow${at}.`;
    case "note": return `Reminder about your note: ${e.title}.`;
    default: return `Reminder: ${e.title} is tomorrow${at}.`;
  }
}

/** What the future integration will consume: when to fire and what to send.
    Nothing is dispatched until the WhatsApp API is connected. */
export function reminderPlan(e: ScheduleEvent): { sendAt: string; message: string; channel: "whatsapp"; enabled: boolean } | null {
  if (!e.reminder?.enabled) return null;
  const base = new Date(`${e.date}T${e.time ?? "09:00"}:00`);
  base.setHours(base.getHours() - OFFSET_HOURS[e.reminder.timing]);
  return { sendAt: base.toISOString(), message: reminderTemplate(e), channel: "whatsapp", enabled: false };
}

/* ── Official, read-only dates ────────────────────────────────────────────── */

/* Lithuanian public holidays on which universities and the Migration Department
   are closed, plus the admission dates that affect an AfaqWay application.
   Unrelated national observances are deliberately excluded. */
const FIXED_HOLIDAYS: { md: string; title: string }[] = [
  { md: "01-01", title: "New Year's Day — universities and MIGRIS closed" },
  { md: "02-16", title: "Restoration of the State — offices closed" },
  { md: "03-11", title: "Restoration of Independence — offices closed" },
  { md: "05-01", title: "Labour Day — universities and MIGRIS closed" },
  { md: "06-24", title: "St John's Day — offices closed" },
  { md: "07-06", title: "Statehood Day — universities and MIGRIS closed" },
  { md: "08-15", title: "Assumption Day — offices closed" },
  { md: "11-01", title: "All Saints' Day — offices closed" },
  { md: "11-02", title: "All Souls' Day — offices closed" },
  { md: "12-24", title: "Christmas Eve — universities and MIGRIS closed" },
  { md: "12-25", title: "Christmas Day — offices closed" },
  { md: "12-26", title: "Second day of Christmas — offices closed" },
];

/* Admission and immigration milestones that shape an application year. */
const APPLICATION_DATES: { md: string; title: string }[] = [
  { md: "04-01", title: "Main September intake — applications open at most universities" },
  { md: "07-01", title: "Main September intake — most application deadlines close" },
  { md: "08-01", title: "Recommended deadline to start the residence permit application" },
  { md: "11-01", title: "February intake — applications open" },
  { md: "12-15", title: "February intake — most application deadlines close" },
];

/** Official events for a given year, generated so the calendar is always current. */
export function officialEvents(year: number): ScheduleEvent[] {
  const make = (md: string, title: string, i: number): ScheduleEvent => ({
    id: `official-${year}-${md}-${i}`,
    kind: "official",
    title,
    date: `${year}-${md}`,
    createdBy: "system",
    createdAt: `${year}-01-01T00:00:00.000Z`,
  });
  return [
    ...FIXED_HOLIDAYS.map((h, i) => make(h.md, h.title, i)),
    ...APPLICATION_DATES.map((h, i) => make(h.md, h.title, 100 + i)),
  ];
}

/* ── Local store ──────────────────────────────────────────────────────────── */

const key = (userId: string) => `afaqway.schedule.${userId}`;

export function readEvents(userId: string): ScheduleEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as ScheduleEvent[]) : [];
  } catch { return []; }
}

export function writeEvents(userId: string, events: ScheduleEvent[]): void {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(key(userId), JSON.stringify(events)); } catch { /* storage full or blocked */ }
}

export const newId = () => `evt-${Math.random().toString(36).slice(2, 10)}`;

/* ── Date helpers ─────────────────────────────────────────────────────────── */

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The 6×7 grid for a month, Monday first, including the leading and trailing days. */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

/** The student's next scheduled event, formatted for the mini calendar in the
    right panel. Reads the same store the Schedule module writes to, so the two
    never disagree. */
export function nextScheduleEvent(userId: string): { title: string; at: string } | null {
  const now = Date.now();
  const upcoming = readEvents(userId)
    .filter((e) => e.kind !== "note" && !e.completed)
    .map((e) => ({ e, at: new Date(`${e.date}T${e.time ?? "09:00"}:00`).getTime() }))
    .filter((x) => x.at >= now - 3_600_000)
    .sort((a, b) => a.at - b.at)[0];
  if (!upcoming) return null;
  const d = new Date(upcoming.at);
  return {
    title: upcoming.e.title.slice(0, 42),
    at: `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}${upcoming.e.time ? ` · ${upcoming.e.time}` : ""}`,
  };
}
