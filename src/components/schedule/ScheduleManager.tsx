"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseDate, parseTime, type DateValue } from "@internationalized/date";
import type { TimeValue } from "react-aria-components";
import {
  CalendarDays, ChevronLeft, ChevronRight, Cog, Globe, Lock, Pin, Plus, Repeat,
  Trash2, User, UserCog,
} from "lucide-react";
import {
  Button, Checkbox, DateField, Input, Label, ListBox, Select, Skeleton, Switch,
  TextArea, TextField, TimeField, Tooltip,
} from "@heroui/react";
import { AdminDialog } from "@/components/admin/AdminDialog";
import { DEFAULT_TIMING, TIMING_LABEL, type ReminderTiming } from "@/lib/schedule";
import {
  canStudentEdit, deleteEvent, expandRecurring, fetchEvents, isOccurrence, moveEvent,
  saveEvent, scheduleReady, sourceId, subscribeSchedule,
  type EventOwner, type FullEvent, type RepeatRule,
} from "@/lib/scheduleDb";

/* One schedule, used by the student and by an administrator.

   The same component serves both: `role` decides only what may be edited, never
   the layout. Events are stored per user, so an advisor opening a student's
   schedule is looking at exactly what the student sees, live.

   The only caller today is the admin's User Details drawer (role="advisor") —
   the student's own Schedule page is a separate implementation — so this
   converts fully to HeroUI without touching anything student-facing. The
   month grid itself has no HeroUI equivalent and is kept exactly as it was;
   only the chrome around it — the editor, the nav buttons — is HeroUI.

   Add New Event opens as its own mini-module stacked above whichever profile
   or schedule surface it was opened from, holding every field the schedule
   system understands: what, when it starts and ends, where or how, and
   whether it should remind the owner beforehand. */

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

const OWNERS: { value: EventOwner; label: string }[] = [
  { value: "advisor", label: "Advisor" }, { value: "platform", label: "Platform" },
  { value: "country", label: "Country" }, { value: "system", label: "System" },
  { value: "student", label: "Student" },
];

/* "unspecified" is a UI-only sentinel — React Aria selection keys are
   unreliable with an empty-string id. The persisted event still stores ""
   (no mode set at all), translated at the write site below. */
const MODES = [
  { value: "unspecified", label: "Not specified" },
  { value: "online", label: "Online" },
  { value: "in_person", label: "In person" },
  { value: "phone", label: "Phone call" },
];

const REMINDER_TIMING = (Object.keys(TIMING_LABEL) as ReminderTiming[]).map((value) => ({ value, label: TIMING_LABEL[value] }));

/** Who put the event on the calendar. Shown on both sides so a student can see
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

/* DateField/TimeField exchange @internationalized/date values; the schedule
   stores plain ISO strings ("2026-08-30", "14:30"), so every field converts
   at its own boundary and nothing else in the module has to know these types
   exist. */
const pad2 = (n: number) => String(n).padStart(2, "0");
const toCalendarDate = (iso?: string): DateValue | null => {
  if (!iso) return null;
  try { return parseDate(iso.slice(0, 10)); } catch { return null; }
};
const fromCalendarDate = (d: DateValue | null): string => (d ? `${d.year}-${pad2(d.month)}-${pad2(d.day)}` : "");
const toTimeValue = (hhmm?: string): TimeValue | null => {
  if (!hhmm) return null;
  try { return parseTime(hhmm); } catch { return null; }
};
const fromTimeValue = (t: TimeValue | null): string => (t ? `${pad2(t.hour)}:${pad2(t.minute)}` : "");

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

  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

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
            <Tooltip>
              <Tooltip.Trigger><Button aria-label="Previous month" isIconOnly onPress={() => step(-1)} size="sm" variant="tertiary"><ChevronLeft size={16} /></Button></Tooltip.Trigger>
              <Tooltip.Content>Previous month</Tooltip.Content>
            </Tooltip>
            <span className="scm-month">{MONTHS[cursor.month]} {cursor.year}</span>
            <Tooltip>
              <Tooltip.Trigger><Button aria-label="Next month" isIconOnly onPress={() => step(1)} size="sm" variant="tertiary"><ChevronRight size={16} /></Button></Tooltip.Trigger>
              <Tooltip.Content>Next month</Tooltip.Content>
            </Tooltip>
          </div>
          <Button onPress={() => setDraft(emptyDraft(iso(today)))} size="sm" variant="primary"><Plus size={14} /> Add New Event</Button>
        </header>
      )}

      <div className="scm-weekdays">{WEEKDAYS.map((d) => <span key={d}>{d}</span>)}</div>

      {/* The month grid, drag-and-drop and event chips are bespoke — HeroUI has
          no calendar-with-events primitive — so this stays exactly as it was. */}
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
                  <Button onPress={() => setDraft({ ...e, id: isOccurrence(e.id) ? sourceId(e.id) : e.id })} size="sm" variant="tertiary">Open</Button>
                </li>
              ))}
            </ul>
          )}
      </section>

      {/* The Add / Edit Event mini-module. It opens above whatever screen
          asked for it — the profile drawer's Schedule tab included — and
          that screen stays mounted and visible behind it. */}
      {draft && (
        <AdminDialog
          description={draft.id ? undefined : "Every field the schedule understands, in one place."}
          footer={(
            <>
              {draft.id && mayEdit(draft.owner) && (
                <Button isDisabled={busy} onPress={() => remove(draft.id!)} size="sm" style={{ marginRight: "auto" }} variant="danger-soft"><Trash2 size={14} /> Delete</Button>
              )}
              <Button onPress={() => setDraft(null)} size="sm" variant="tertiary">{mayEdit(draft.owner) ? "Cancel" : "Close"}</Button>
              {mayEdit(draft.owner) && (
                <Button isDisabled={busy || !(draft.title ?? "").trim()} onPress={save} size="sm" variant="primary">{busy ? "Saving…" : "Save event"}</Button>
              )}
            </>
          )}
          icon={<CalendarDays className="size-5" />}
          onClose={() => setDraft(null)}
          size="lg"
          title={draft.id ? (mayEdit(draft.owner) ? "Edit event" : "Event details") : "Add New Event"}
        >
          <div className="afq-form">
            {!mayEdit(draft.owner) && (
              <p className="afq-mini-sub">
                <Lock size={14} />
                This event was added by your {OWNER_LABEL[draft.owner ?? "student"].toLowerCase()}, so it is read-only for you.
              </p>
            )}

            <TextField fullWidth isDisabled={!mayEdit(draft.owner)} onChange={(v) => setDraft({ ...draft, title: v })} value={draft.title ?? ""}>
              <Label>Event title</Label>
              <Input placeholder="Embassy appointment" variant="secondary" />
            </TextField>

            <div className="afq-form-row">
              <TextField fullWidth>
                <Label>Event type</Label>
                <Select
                  onSelectionChange={(k) => setDraft({ ...draft, kind: String(k) as FullEvent["kind"], colour: KIND_COLOUR.get(String(k)) })}
                  selectedKey={draft.kind ?? "appointment"}
                >
                  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                  <Select.Popover><ListBox>{KINDS.map((k) => <ListBox.Item id={k.value} key={k.value} textValue={k.label}>{k.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                </Select>
              </TextField>
              <TextField fullWidth>
                <Label>Repeats</Label>
                <Select onSelectionChange={(k) => setDraft({ ...draft, repeatRule: String(k) as RepeatRule })} selectedKey={draft.repeatRule ?? "none"}>
                  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                  <Select.Popover><ListBox>{REPEATS.map((r) => <ListBox.Item id={r.value} key={r.value} textValue={r.label}>{r.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                </Select>
              </TextField>
            </div>

            <DateField fullWidth onChange={(v) => setDraft({ ...draft, date: fromCalendarDate(v) })} value={toCalendarDate(draft.date)}>
              <Label>Date</Label>
              <DateField.Group variant="secondary">
                <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
              </DateField.Group>
            </DateField>

            <div className="afq-form-row">
              <TimeField fullWidth onChange={(v) => setDraft({ ...draft, time: fromTimeValue(v) })} value={toTimeValue(draft.time)}>
                <Label>Start time</Label>
                <TimeField.Group variant="secondary">
                  <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                </TimeField.Group>
              </TimeField>
              <TimeField fullWidth onChange={(v) => setDraft({ ...draft, endTime: fromTimeValue(v) })} value={toTimeValue(draft.endTime)}>
                <Label>End time</Label>
                <TimeField.Group variant="secondary">
                  <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
                </TimeField.Group>
              </TimeField>
            </div>

            {role === "advisor" && (
              <TextField fullWidth>
                <Label>Owner</Label>
                <Select onSelectionChange={(k) => setDraft({ ...draft, owner: String(k) as EventOwner })} selectedKey={draft.owner ?? "advisor"}>
                  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                  <Select.Popover><ListBox>{OWNERS.map((o) => <ListBox.Item id={o.value} key={o.value} textValue={o.label}>{o.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                </Select>
              </TextField>
            )}

            {draft.repeatRule && draft.repeatRule !== "none" && (
              <DateField fullWidth onChange={(v) => setDraft({ ...draft, repeatUntil: fromCalendarDate(v) })} value={toCalendarDate(draft.repeatUntil)}>
                <Label>Repeat until</Label>
                <DateField.Group variant="secondary">
                  <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                </DateField.Group>
              </DateField>
            )}

            <div className="afq-form-row">
              <TextField fullWidth isDisabled={!mayEdit(draft.owner)} onChange={(v) => setDraft({ ...draft, location: v })} value={draft.location ?? ""}>
                <Label>Location</Label>
                <Input placeholder="Vilnius, Migration Department" variant="secondary" />
              </TextField>
              <TextField fullWidth>
                <Label>Meeting mode</Label>
                <Select onSelectionChange={(k) => setDraft({ ...draft, mode: k === "unspecified" ? "" : String(k) })} selectedKey={draft.mode || "unspecified"}>
                  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                  <Select.Popover><ListBox>{MODES.map((m) => <ListBox.Item id={m.value} key={m.value} textValue={m.label}>{m.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                </Select>
              </TextField>
            </div>

            {draft.kind === "interview" && (
              <TextField fullWidth onChange={(v) => setDraft({ ...draft, university: v })} value={draft.university ?? ""}>
                <Label>University / organisation</Label>
                <Input placeholder="Vilnius University" variant="secondary" />
              </TextField>
            )}

            <TextField fullWidth isDisabled={!mayEdit(draft.owner)} onChange={(v) => setDraft({ ...draft, description: v })} value={draft.description ?? ""}>
              <Label>Description</Label>
              <TextArea placeholder="Anything worth remembering" rows={3} variant="secondary" />
            </TextField>

            <div className="afq-mini-card">
              <Switch
                isSelected={Boolean(draft.reminder?.enabled)}
                onChange={(v) => setDraft({ ...draft, reminder: v ? { enabled: true, timing: draft.reminder?.timing ?? DEFAULT_TIMING } : undefined })}
              >
                <Switch.Content><Switch.Control><Switch.Thumb /></Switch.Control>Remind before this event</Switch.Content>
              </Switch>
              {draft.reminder?.enabled && (
                <TextField fullWidth>
                  <Label>Remind</Label>
                  <Select
                    onSelectionChange={(k) => setDraft({ ...draft, reminder: { enabled: true, timing: String(k) as ReminderTiming } })}
                    selectedKey={draft.reminder?.timing ?? DEFAULT_TIMING}
                  >
                    <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                    <Select.Popover><ListBox>{REMINDER_TIMING.map((t) => <ListBox.Item id={t.value} key={t.value} textValue={t.label}>{t.label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover>
                  </Select>
                </TextField>
              )}
            </div>

            <div className="afq-form-row">
              <Checkbox isSelected={Boolean(draft.pinned)} onChange={(v) => setDraft({ ...draft, pinned: v })}>
                <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Pin to the top</Checkbox.Content>
              </Checkbox>
              <Checkbox isSelected={Boolean(draft.completed)} onChange={(v) => setDraft({ ...draft, completed: v })}>
                <Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>Done</Checkbox.Content>
              </Checkbox>
            </div>
          </div>
        </AdminDialog>
      )}
    </div>
  );
}

export default ScheduleManager;
