"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, ChevronLeft, ChevronRight, Cog, Globe, Lock, Pin, Plus, Repeat,
  Trash2, User, UserCog, X,
} from "lucide-react";
import { Input, TextArea, Select, Checkbox, Loader } from "@/components/ds";
import { JrButton } from "@/components/student/workspace/journey/parts";
import {
  canStudentEdit, deleteEvent, expandRecurring, fetchEvents, isOccurrence, moveEvent,
  saveEvent, scheduleReady, sourceId, subscribeSchedule,
  type EventOwner, type FullEvent, type RepeatRule,
} from "@/lib/scheduleDb";

/* One schedule, used by the student and by an administrator.

   The same component serves both: `role` decides only what may be edited, never
   the layout. Events are stored per user, so an advisor opening a student's
   schedule is looking at exactly what the student sees, live. */

type Role = "student" | "advisor";

const KINDS: { value: string; label: string; colour: string }[] = [
  { value: "deadline",    label: "Deadline",            colour: "#B23B27" },
  { value: "interview",   label: "University interview", colour: "#2E3BC7" },
  { value: "embassy",     label: "Embassy appointment", colour: "#8A5A0C" },
  { value: "visa",        label: "Visa appointment",    colour: "#7048E8" },
  { value: "travel",      label: "Travel",              colour: "#0B7285" },
  { value: "meeting",     label: "Meeting",             colour: "#256B49" },
  { value: "appointment", label: "Appointment",         colour: "#2E3BC7" },
  { value: "reminder",    label: "Reminder",            colour: "#A2570B" },
  { value: "personal",    label: "Personal note",       colour: "#5A6B85" },
  { value: "note",        label: "Note",                colour: "#8695AB" },
];
const KIND_COLOUR = new Map(KINDS.map((k) => [k.value, k.colour]));

const REPEATS: { value: RepeatRule; label: string }[] = [
  { value: "none", label: "Does not repeat" },
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "monthly", label: "Every month" },
  { value: "yearly", label: "Every year" },
];

/* Who put the event on the calendar. Shown on both sides so a student can see
   at a glance what is theirs and what was placed there for them. */
const OWNER_ICON: Record<EventOwner, typeof User> = {
  student: User, advisor: UserCog, platform: Cog, country: Globe, system: Cog,
};
const OWNER_LABEL: Record<EventOwner, string> = {
  student: "You", advisor: "Advisor", platform: "Platform", country: "Country", system: "System",
};

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday-first grid covering the whole month. */
function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

const emptyDraft = (date: string): Partial<FullEvent> => ({
  kind: "appointment", title: "", description: "", date, time: "",
  repeatRule: "none", completed: false, pinned: false, checklist: [],
});

export function ScheduleManager({ userId, role = "student", compact }: {
  userId: string;
  role?: Role;
  /** Hides the month header when the caller supplies its own. */
  compact?: boolean;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [events, setEvents] = useState<FullEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(true);
  const [draft, setDraft] = useState<Partial<FullEvent> | null>(null);
  const [busy, setBusy] = useState(false);
  const dragId = useRef<string | null>(null);

  const load = useCallback(async () => {
    const installed = await scheduleReady();
    setReady(installed);
    setEvents(installed ? await fetchEvents(userId) : []);
    setLoading(false);
  }, [userId]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => subscribeSchedule(userId, () => { void load(); }), [userId, load]);

  const grid = useMemo(() => monthGrid(cursor.year, cursor.month), [cursor]);

  // Recurring events are expanded across the visible window only.
  const visible = useMemo(
    () => expandRecurring(events, iso(grid[0]), iso(grid[grid.length - 1])),
    [events, grid],
  );
  const byDate = useMemo(() => {
    const map = new Map<string, FullEvent[]>();
    for (const e of visible) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const list of map.values()) list.sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
    return map;
  }, [visible]);

  const step = (by: number) => setCursor((c) => {
    const d = new Date(c.year, c.month + by, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  /* An advisor may change anything; a student only what they created. */
  const mayEdit = (owner: EventOwner | undefined) => role === "advisor" || canStudentEdit(owner);

  const save = async () => {
    if (!draft?.date || !(draft.title ?? "").trim()) return;
    setBusy(true);
    await saveEvent({
      ...draft, userId, date: draft.date,
      // The database re-asserts this for students; setting it here keeps the
      // admin's choice of owner (advisor, platform, country, system).
      owner: (role === "advisor" ? draft.owner ?? "advisor" : "student") as EventOwner,
    } as FullEvent);
    setDraft(null);
    await load();
    setBusy(false);
  };

  const remove = async (id: string) => {
    setBusy(true);
    await deleteEvent(sourceId(id));
    setDraft(null);
    await load();
    setBusy(false);
  };

  /* Drag and drop: dropping a day moves the event to it. A generated
     occurrence moves its source, which is the only row that exists. */
  const onDrop = async (date: string) => {
    const id = dragId.current;
    dragId.current = null;
    if (!id) return;
    await moveEvent(sourceId(id), date);
    await load();
  };

  if (loading) return <Loader size={40} block label="Loading the schedule" />;

  if (!ready) {
    return (
      <p className="stp-hint">
        <CalendarDays size={14} />
        The schedule table is not installed yet. Run supabase/migrations/journey/10_schedule.sql.
      </p>
    );
  }

  const upcoming = visible
    .filter((e) => e.date >= iso(today) && !e.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="scm">
      {!compact && (
        <header className="scm-head">
          <div className="scm-nav">
            <button type="button" className="dv-tool" onClick={() => step(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
            <span className="scm-month">{MONTHS[cursor.month]} {cursor.year}</span>
            <button type="button" className="dv-tool" onClick={() => step(1)} aria-label="Next month"><ChevronRight size={16} /></button>
          </div>
          <JrButton tone="primary" icon={<Plus size={14} />} onClick={() => setDraft(emptyDraft(iso(today)))}>
            New event
          </JrButton>
        </header>
      )}

      <div className="scm-weekdays">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>

      <div className="scm-grid">
        {grid.map((day) => {
          const key = iso(day);
          const inMonth = day.getMonth() === cursor.month;
          const isToday = key === iso(today);
          const list = byDate.get(key) ?? [];
          return (
            <div
              key={key}
              className={`scm-day${inMonth ? "" : " out"}${isToday ? " today" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(key)}
              onDoubleClick={() => setDraft(emptyDraft(key))}
            >
              <span className="scm-daynum">{day.getDate()}</span>
              {list.map((e) => {
                const Owner = OWNER_ICON[e.owner] ?? User;
                const editable = mayEdit(e.owner);
                return (
                    <button
                      key={e.id} type="button" className={`scm-chip${editable ? "" : " locked"}`} draggable={editable}
                      onDragStart={() => { if (editable) dragId.current = e.id; }}
                      onClick={() => setDraft({ ...e, id: isOccurrence(e.id) ? sourceId(e.id) : e.id })}
                      style={{ borderLeftColor: e.colour || KIND_COLOUR.get(e.kind) || "var(--indigo-600)" }}
                      title={`${e.title} · ${OWNER_LABEL[e.owner] ?? "You"}`}
                    >
                      <Owner size={10} />
                      {e.time && <em>{e.time}</em>}
                      <span>{e.title}</span>
                      {e.pinned && <Pin size={10} />}
                      {e.repeatRule && e.repeatRule !== "none" && <Repeat size={10} />}
                      {!editable && <Lock size={10} />}
                    </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <section className="scm-upcoming">
        <h4 className="lrn-sub">Next up</h4>
        {upcoming.length === 0
          ? <p className="stp-hint stp-hint-grey"><CalendarDays size={14} />Nothing scheduled yet.</p>
          : (
            <ul className="scm-list">
              {upcoming.map((e) => (
                <li key={e.id}>
                  <span className="scm-dot" style={{ background: e.colour || KIND_COLOUR.get(e.kind) || "var(--indigo-600)" }} />
                  <span className="scm-list-main">
                    <b>{e.title}</b>
                    <em>{new Date(e.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}{e.time ? ` · ${e.time}` : ""}</em>
                  </span>
                  <JrButton onClick={() => setDraft({ ...e, id: isOccurrence(e.id) ? sourceId(e.id) : e.id })}>Open</JrButton>
                </li>
              ))}
            </ul>
          )}
      </section>

      {draft && (
        <div className="scm-editor" role="dialog" aria-label="Schedule event">
          <div className="scm-editor-head">
            <b>{draft.id ? (mayEdit(draft.owner) ? "Edit event" : "Event details") : "New event"}</b>
            <button type="button" className="dv-tool" onClick={() => setDraft(null)} aria-label="Close"><X size={15} /></button>
          </div>

          {!mayEdit(draft.owner) && (
            <p className="stp-hint stp-hint-grey">
              <Lock size={14} />
              This event was added by your {OWNER_LABEL[draft.owner ?? "student"].toLowerCase()}, so it is read-only for you.
            </p>
          )}

          <Input
            label="Title" value={draft.title ?? ""} disabled={!mayEdit(draft.owner)}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Embassy appointment"
          />
          <div className="sch-row2">
            <Select
              label="Type" value={draft.kind ?? "appointment"}
              onChange={(v) => setDraft({ ...draft, kind: v as FullEvent["kind"], colour: KIND_COLOUR.get(v) })}
              options={KINDS.map((k) => ({ value: k.value, label: k.label }))}
            />
            <Select
              label="Repeats" value={draft.repeatRule ?? "none"}
              onChange={(v) => setDraft({ ...draft, repeatRule: v as RepeatRule })}
              options={REPEATS}
            />
          </div>
          <div className="sch-row2">
            <Input label="Date" type="date" value={draft.date ?? ""} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            <Input label="Time" type="time" value={draft.time ?? ""} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
          </div>
          {role === "advisor" && (
            <Select
              label="Owner" value={draft.owner ?? "advisor"}
              onChange={(v) => setDraft({ ...draft, owner: v as EventOwner })}
              options={[
                { value: "advisor", label: "Advisor" }, { value: "platform", label: "Platform" },
                { value: "country", label: "Country" }, { value: "system", label: "System" },
                { value: "student", label: "Student" },
              ]}
            />
          )}
          {draft.repeatRule && draft.repeatRule !== "none" && (
            <Input label="Repeat until" type="date" value={draft.repeatUntil ?? ""} onChange={(e) => setDraft({ ...draft, repeatUntil: e.target.value })} />
          )}
          <Input label="Location" disabled={!mayEdit(draft.owner)} value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="Vilnius, Migration Department" />
          <TextArea rows={2} disabled={!mayEdit(draft.owner)} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Anything worth remembering" />

          <div className="scm-editor-row">
            <Checkbox checked={Boolean(draft.pinned)} onChange={(v) => setDraft({ ...draft, pinned: v })} label="Pin to the top" />
            <Checkbox checked={Boolean(draft.completed)} onChange={(v) => setDraft({ ...draft, completed: v })} label="Done" />
          </div>

          <div className="scm-editor-acts">
            {draft.id && mayEdit(draft.owner) && (
              <JrButton tone="danger" icon={<Trash2 size={14} />} disabled={busy} onClick={() => remove(draft.id!)}>Delete</JrButton>
            )}
            <JrButton tone="quiet" onClick={() => setDraft(null)}>{mayEdit(draft.owner) ? "Cancel" : "Close"}</JrButton>
            {mayEdit(draft.owner) && (
              <JrButton tone="primary" disabled={busy || !(draft.title ?? "").trim()} onClick={save}>
                {busy ? "Saving…" : "Save event"}
              </JrButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleManager;
