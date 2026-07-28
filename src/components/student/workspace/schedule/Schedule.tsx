"use client";

import { useCallback, useMemo, useState } from "react";
import { Pill } from "@/components/ds";
import {
  Bell, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, GraduationCap,
  NotebookPen, Pin, Plus,
} from "lucide-react";
import { useEffect } from "react";
import {
  KIND_META, iso, monthGrid, officialEvents,
  type EventKind, type ScheduleEvent,
} from "@/lib/schedule";
import {
  deleteEvent as dbDelete, fetchEvents as dbFetch, saveEvent as dbSave,
  subscribeSchedule, type FullEvent,
} from "@/lib/scheduleDb";
import { JourneySnapshotCard } from "../RightPanel";
import type { WsProfile } from "../Modules";
import { EventDetailsModal, EventFormModal } from "./EventModal";

/* Schedule — the student's planning hub. The calendar owns the centre column;
   the right panel reuses the platform's card language, ending with the shared
   Journey Snapshot component. */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/* Short labels: these sit in one row above the calendar, so the icon carries
   the meaning and the word only names the kind. */
const QUICK: { kind: Exclude<EventKind, "official">; label: string; icon: React.ReactNode }[] = [
  { kind: "appointment", label: "Appointment", icon: <CalendarPlus size={15} /> },
  { kind: "deadline", label: "Deadline", icon: <CalendarDays size={15} /> },
  { kind: "interview", label: "Interview", icon: <GraduationCap size={15} /> },
  { kind: "note", label: "Note", icon: <NotebookPen size={15} /> },
  { kind: "reminder", label: "Reminder", icon: <Bell size={15} /> },
];

export default function Schedule({ profile, onNav, role = "student" }: {
  profile: WsProfile; onNav: (id: string) => void; role?: "student" | "advisor";
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(iso(today));
  /* Events live in the database, so the same calendar appears on every device
     and an advisor works on the one the student sees. */
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [form, setForm] = useState<{ kind: Exclude<EventKind, "official">; existing?: ScheduleEvent } | null>(null);
  const [details, setDetails] = useState<ScheduleEvent | null>(null);
  const [dayList, setDayList] = useState<string | null>(null);

  // Stored events are read once on mount; official dates are generated per year.
  const reload = useCallback(async () => { setEvents(await dbFetch(profile.userId)); }, [profile.userId]);
  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => subscribeSchedule(profile.userId, () => { void reload(); }), [profile.userId, reload]);

  /* Writes go straight to the database; the realtime subscription brings the
     result back, so the screen and the store can never disagree. */
  const persist = useCallback(async (next: ScheduleEvent[]) => {
    setEvents(next);
    const before = new Map(events.map((e) => [e.id, e]));
    for (const e of next) {
      const prev = before.get(e.id);
      if (!prev || JSON.stringify(prev) !== JSON.stringify(e)) {
        await dbSave({ ...(e as FullEvent), userId: profile.userId, date: e.date, createdBy: role === "advisor" ? "advisor" : "student" });
      }
    }
    for (const e of events) if (!next.some((n) => n.id === e.id)) await dbDelete(e.id);
    await reload();
  }, [profile.userId, events, reload, role]);

  const all = useMemo(
    () => [...officialEvents(cursor.getFullYear()), ...officialEvents(cursor.getFullYear() + 1), ...events],
    [cursor, events],
  );
  const byDay = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    all.forEach((e) => { const list = map.get(e.date) ?? []; list.push(e); map.set(e.date, list); });
    return map;
  }, [all]);

  const grid = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const notes = useMemo(
    () => events.filter((e) => e.kind === "note").sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt)),
    [events],
  );
  const universities = profile.study?.university && profile.study.university !== "—" ? [profile.study.university] : [];

  const save = (e: ScheduleEvent) => {
    persist(events.some((x) => x.id === e.id) ? events.map((x) => (x.id === e.id ? e : x)) : [...events, e]);
    setForm(null); setDetails(null);
  };
  const remove = (id: string) => { persist(events.filter((e) => e.id !== id)); setDetails(null); };
  const toggleDone = (e: ScheduleEvent) => {
    const next = { ...e, completed: !e.completed, updatedAt: new Date().toISOString() };
    persist(events.map((x) => (x.id === e.id ? next : x)));
    setDetails(next);
  };

  return (
    <div className="sw-withpanel">
      {/* ── Calendar ── */}
      {/* A fixed frame: the actions and the month header hold their place and
          only the grid below them scrolls. */}
      <div className="sch-main">
        {/* Quick actions sit with the calendar they add to, filling the row. */}
        <div className="sch-quick" role="group" aria-label="Add to calendar">
          {QUICK.map((q) => (
            <button key={q.kind} type="button" className="sch-quick-btn" title={`Add ${q.label.toLowerCase()}`} onClick={() => setForm({ kind: q.kind })}>
              <span className="sch-quick-ico" style={{ color: KIND_META[q.kind].color, background: KIND_META[q.kind].tint }}>{q.icon}</span>
              <span className="sch-quick-label">{q.label}</span>
            </button>
          ))}
        </div>

        <section className="sch-cal">
          <header className="sch-cal-head">
            <h2 className="sch-month">{monthLabel}</h2>
            <div className="sch-cal-nav">
              <button type="button" className="rp-iconbtn" aria-label="Previous month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft size={15} /></button>
              <button type="button" className="chat-chip" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(iso(today)); }}>Today</button>
              <button type="button" className="rp-iconbtn" aria-label="Next month" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight size={15} /></button>
              <span className="sch-seg" role="group" aria-label="View">
                <button type="button" className="sch-seg-btn active">Month</button>
                <button type="button" className="sch-seg-btn" disabled title="Week view is coming soon">Week</button>
              </span>
            </div>
          </header>

          <div className="sch-weekdays">{DAYS.map((d) => <span key={d}>{d}</span>)}</div>

          {/* The only part that scrolls. Everything above it stays visible. */}
          <div className="sch-cal-body">
          <div className="sch-grid">
            {grid.map((d) => {
              const key = iso(d);
              const list = byDay.get(key) ?? [];
              const out = d.getMonth() !== cursor.getMonth();
              const isToday = key === iso(today);
              return (
                <button
                  key={key} type="button"
                  className={`sch-day${out ? " out" : ""}${isToday ? " today" : ""}${selected === key ? " selected" : ""}`}
                  onClick={() => { setSelected(key); if (list.length) setDayList(key); }}
                >
                  <span className="sch-daynum">{d.getDate()}</span>
                  <span className="sch-events">
                    {list.slice(0, 2).map((e) => (
                      <span key={e.id} className="sch-chip" onClick={(ev) => { ev.stopPropagation(); setDetails(e); }}>
                        <span className="sch-dot" style={{ background: KIND_META[e.kind].color }} />
                        <span className="sch-chip-title">{e.title}</span>
                      </span>
                    ))}
                    {list.length > 2 && <span className="sch-more" onClick={(ev) => { ev.stopPropagation(); setDayList(key); }}>+{list.length - 2} more</span>}
                  </span>
                </button>
              );
            })}
          </div>
          </div>
        </section>
      </div>

      {/* ── Right panel ── */}
      <aside className="rp-panel">
        {/* Notes take the height the Quick add card used to occupy. */}
        <section className="rp-card sch-notes">
          <header className="rp-head">
            <span className="rp-head-ico"><NotebookPen size={15} /></span>
            <h3 className="rp-head-title">Pinned notes</h3>
            <button type="button" className="chat-act" onClick={() => setForm({ kind: "note" })} aria-label="Add note" title="Add note"><Plus size={15} /></button>
          </header>
          <div className="sch-notes-list">
            {notes.length === 0 ? (
              <div className="chat-empty"><div style={{ font: "700 13px/18px var(--font-sans)", color: "var(--ink)" }}>No notes yet</div>
                <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)" }}>Keep track of what matters in your journey.</div></div>
            ) : notes.map((n) => (
              <button key={n.id} type="button" className="sch-note" onClick={() => setDetails(n)}>
                <div className="sch-note-top">
                  <span className="sch-note-title">{n.title}</span>
                  {n.pinned && <Pill tone="indigo" style={{ padding: "2px 8px", fontSize: 9 }}><Pin size={9} />Pinned</Pill>}
                </div>
                <span className="sch-note-date">{new Date(n.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                {n.description && <span className="sch-note-preview">{n.description}</span>}
              </button>
            ))}
          </div>
        </section>

        {/* Reused, not redesigned. */}
        <JourneySnapshotCard onNav={onNav} />
      </aside>

      {/* ── Modals ── */}
      {form && (
        <EventFormModal
          kind={form.kind} date={selected} existing={form.existing} universities={universities}
          onClose={() => setForm(null)} onSave={save}
        />
      )}
      {details && (
        <EventDetailsModal
          event={details} role={role}
          onClose={() => setDetails(null)}
          onEdit={() => { setForm({ kind: details.kind as Exclude<EventKind, "official">, existing: details }); setDetails(null); }}
          onDelete={() => remove(details.id)}
          onToggleComplete={() => toggleDone(details)}
        />
      )}
      {dayList && (
        <div className="spm-overlay" onClick={() => setDayList(null)} role="dialog" aria-modal="true" aria-label="Events">
          <div className="sch-modal" onClick={(e) => e.stopPropagation()}>
            <header className="sch-modal-head">
              <span className="sch-modal-ico"><CalendarDays size={18} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="sch-modal-title">{new Date(dayList).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</div>
                <div className="sch-modal-sub">{(byDay.get(dayList) ?? []).length} event(s) on this day</div>
              </div>
            </header>
            <div className="sch-modal-body">
              {(byDay.get(dayList) ?? []).map((e) => (
                <button key={e.id} type="button" className="sch-daylist-item" onClick={() => { setDetails(e); setDayList(null); }}>
                  <span className="sch-dot" style={{ background: KIND_META[e.kind].color }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="sch-note-title">{e.title}</span>
                    <span className="sch-note-date">{e.time ? `${e.time} · ` : "All day · "}{KIND_META[e.kind].label}</span>
                  </span>
                </button>
              ))}
            </div>
            <footer className="sch-modal-foot">
              <button type="button" className="chat-chip" onClick={() => setDayList(null)}>Close</button>
              <button type="button" className="chat-send" onClick={() => { setSelected(dayList); setDayList(null); setForm({ kind: "reminder" }); }}><Plus size={15} />Add event</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
