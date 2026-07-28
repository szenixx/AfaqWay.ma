"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AlignLeft, Bell, CalendarDays, CircleCheck, Clock, FolderOpen, GraduationCap,
  Landmark, Link2, MapPin, NotebookPen, Pin, Trash2, Type, X,
} from "lucide-react";
import { Input, TextArea, Select, Toggle, Checkbox, Pill } from "@/components/ds";
import {
  DEFAULT_TIMING, KIND_META, TIMING_LABEL, newId, reminderTemplate,
  type EventKind, type ReminderTiming, type ScheduleEvent,
} from "@/lib/schedule";

/* Mini action modals — one shell, one form per event type. Every control comes
   from the global design system; nothing here defines a new component style. */

const TIMINGS = (Object.keys(TIMING_LABEL) as ReminderTiming[]).map((v) => ({ value: v, label: TIMING_LABEL[v] }));

const WhatsAppIcon = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.2 1.26-1.96 1.42-.52.11-1.2.2-3.5-.75-2.94-1.22-4.83-4.2-4.98-4.4-.14-.19-1.19-1.58-1.19-3.02s.76-2.14 1.03-2.44c.27-.3.58-.37.78-.37l.56.01c.18 0 .42-.07.66.5.24.59.83 2.03.9 2.18.07.15.12.32.02.51-.1.19-.15.31-.29.48l-.44.51c-.14.15-.29.31-.13.6.16.3.72 1.18 1.54 1.91 1.06.94 1.95 1.23 2.25 1.37.3.15.47.13.65-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.66-.15.27.1 1.7.8 1.99.95.29.15.48.22.55.34.07.13.07.73-.17 1.4Z" />
  </svg>
);

/* ── Shell ────────────────────────────────────────────────────────────────── */

export function ModalShell({ icon, title, subtitle, onClose, footer, children }: {
  icon: ReactNode; title: string; subtitle: string; onClose: () => void; footer: ReactNode; children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="spm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="sch-modal" onClick={(e) => e.stopPropagation()}>
        <header className="sch-modal-head">
          <span className="sch-modal-ico">{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="sch-modal-title">{title}</div>
            <div className="sch-modal-sub">{subtitle}</div>
          </div>
          <button type="button" className="chat-act" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>
        <div className="sch-modal-body">{children}</div>
        <footer className="sch-modal-foot">{footer}</footer>
      </div>
    </div>
  );
}

/* The WhatsApp reminder block, identical in every modal. */
function ReminderBlock({ on, setOn, timing, setTiming, defaultOn }: {
  on: boolean; setOn: (v: boolean) => void; timing: ReminderTiming; setTiming: (v: ReminderTiming) => void; defaultOn?: boolean;
}) {
  return (
    <div className="sch-block">
      <div className="sch-toggle-row">
        <span className="sch-toggle-ico"><WhatsAppIcon size={16} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="sch-toggle-title">WhatsApp reminder</div>
          <div className="sch-toggle-sub">
            {defaultOn ? "Sends a WhatsApp reminder 24 hours before, once the integration is connected." : "Send a WhatsApp reminder for this event."}
          </div>
        </div>
        <Toggle checked={on} onChange={setOn} ariaLabel="WhatsApp reminder" />
      </div>
      {on && (
        <>
          <Select label="Reminder timing" icon={<Bell size={15} />} value={timing} onChange={(v) => setTiming(v as ReminderTiming)} options={TIMINGS} containerStyle={{ marginTop: 12 }} />
          <div className="ex-callout amber" style={{ marginTop: 12 }}>
            <span className="ex-callout-ico"><WhatsAppIcon size={15} /></span>
            <div>
              <div className="ex-callout-title">Prepared, not yet sending</div>
              <p className="ex-callout-body">WhatsApp reminders activate automatically once the WhatsApp integration is connected.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Creation / edit modal ────────────────────────────────────────────────── */

const HEAD: Record<Exclude<EventKind, "official">, { icon: ReactNode; title: string; subtitle: string; cta: string }> = {
  note: { icon: <NotebookPen size={18} />, title: "Add note", subtitle: "Save personal notes for your study journey.", cta: "Save note" },
  reminder: { icon: <Bell size={18} />, title: "Add reminder", subtitle: "Never miss an important task.", cta: "Create reminder" },
  deadline: { icon: <CalendarDays size={18} />, title: "Add deadline", subtitle: "Track an important submission deadline.", cta: "Save deadline" },
  interview: { icon: <GraduationCap size={18} />, title: "Schedule interview", subtitle: "Prepare an upcoming university interview.", cta: "Schedule interview" },
  appointment: { icon: <CalendarDays size={18} />, title: "Add appointment", subtitle: "Book a meeting with your advisor.", cta: "Save appointment" },
};

const NOTE_CATEGORIES = ["General", "University", "Documents", "TRP / Visa", "Finance", "Personal"].map((v) => ({ value: v, label: v }));
const DEADLINE_RELATED = ["University", "Documents", "Visa", "Finance", "Personal"].map((v) => ({ value: v, label: v }));
const INTERVIEW_MODES = [{ value: "Online", label: "Online" }, { value: "In person", label: "In person" }, { value: "Phone", label: "Phone" }];
const CHECKLIST = ["Passport", "Camera tested", "Internet ready", "Required documents", "Questions prepared"];

export function EventFormModal({ kind, date, existing, universities, onClose, onSave }: {
  kind: Exclude<EventKind, "official">;
  date: string;
  existing?: ScheduleEvent;
  universities: string[];
  onClose: () => void;
  onSave: (e: ScheduleEvent) => void;
}) {
  const meta = HEAD[kind];
  const [title, setTitle] = useState(existing?.title ?? (kind === "interview" ? "University admission interview" : ""));
  const [description, setDescription] = useState(existing?.description ?? "");
  const [when, setWhen] = useState(existing?.date ?? date);
  const [time, setTime] = useState(existing?.time ?? "");
  const [category, setCategory] = useState(existing?.category ?? (kind === "note" ? "General" : kind === "deadline" ? "University" : ""));
  const [pinned, setPinned] = useState(existing?.pinned ?? true);
  const [university, setUniversity] = useState(existing?.university ?? universities[0] ?? "");
  const [mode, setMode] = useState(existing?.mode ?? "Online");
  const [location, setLocation] = useState(existing?.location ?? "");
  const [checklist, setChecklist] = useState(existing?.checklist ?? CHECKLIST.map((label) => ({ label, done: false })));
  // Defaults per the module spec: reminders and interviews on, notes and deadlines off.
  const defaultOn = kind === "reminder" || kind === "interview";
  const [remOn, setRemOn] = useState(existing?.reminder?.enabled ?? defaultOn);
  const [timing, setTiming] = useState<ReminderTiming>(existing?.reminder?.timing ?? DEFAULT_TIMING);
  const [error, setError] = useState("");

  const needsTime = kind === "reminder" || kind === "interview" || kind === "appointment";
  const valid = title.trim().length > 1 && !!when && (!needsTime || !!time);

  function save() {
    if (!valid) { setError("Fill in the required fields."); return; }
    onSave({
      id: existing?.id ?? newId(),
      kind,
      title: title.trim(),
      description: description.trim() || undefined,
      date: when,
      time: time || undefined,
      createdBy: existing?.createdBy ?? "student",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: existing ? new Date().toISOString() : undefined,
      completed: existing?.completed,
      pinned: kind === "note" ? pinned : undefined,
      category: category || undefined,
      university: kind === "interview" ? university : undefined,
      mode: kind === "interview" ? mode : undefined,
      location: kind === "interview" ? location.trim() || undefined : undefined,
      checklist: kind === "interview" ? checklist : undefined,
      reminder: { enabled: remOn, timing },
    });
  }

  return (
    <ModalShell
      icon={meta.icon} title={existing ? `Edit ${KIND_META[kind].label.toLowerCase()}` : meta.title} subtitle={meta.subtitle} onClose={onClose}
      footer={
        <>
          <button type="button" className="chat-chip" onClick={onClose}>Cancel</button>
          <button type="button" className="chat-send" onClick={save} disabled={!valid}>{meta.cta}</button>
        </>
      }
    >
      <Input label={`${meta.title.replace("Add ", "").replace("Schedule ", "")} title`} icon={kind === "reminder" ? <Bell size={15} /> : <Type size={15} />}
        value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder={kind === "deadline" ? "e.g. Passport submission" : "Give it a clear name"} error={error || undefined} />

      {kind === "note" && (
        <Select label="Category" icon={<FolderOpen size={15} />} value={category} onChange={setCategory} options={NOTE_CATEGORIES} containerStyle={{ marginBottom: 12 }} />
      )}
      {kind === "deadline" && (
        <Select label="Related to" icon={<Link2 size={15} />} value={category} onChange={setCategory} options={DEADLINE_RELATED} containerStyle={{ marginBottom: 12 }} />
      )}
      {kind === "interview" && (
        <>
          <Select label="University" icon={<Landmark size={15} />} value={university} onChange={setUniversity}
            options={(universities.length ? universities : ["Not selected yet"]).map((u) => ({ value: u, label: u }))} containerStyle={{ marginBottom: 12 }} />
          <Select label="Interview type" icon={<GraduationCap size={15} />} value={mode} onChange={setMode} options={INTERVIEW_MODES} containerStyle={{ marginBottom: 12 }} />
          <Input label="Platform / location" icon={<MapPin size={15} />} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Zoom, Google Meet, university campus…" />
        </>
      )}

      <div className="sch-row2">
        <Input label={kind === "deadline" ? "Deadline date" : "Date"} icon={<CalendarDays size={15} />} type="date" value={when} onChange={(e) => setWhen(e.target.value)} />
        <Input label={needsTime ? "Time" : "Time (optional)"} icon={<Clock size={15} />} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      <TextArea label={kind === "note" ? "Note content" : kind === "interview" ? "Notes" : "Description"} icon={<AlignLeft size={15} />}
        value={description} onChange={(e) => setDescription(e.target.value)} rows={kind === "note" ? 5 : 3}
        placeholder={kind === "interview" ? "Preparation notes, required documents, meeting link…" : "Optional"}
        hint={`${description.length} characters`} />

      {kind === "note" && (
        <div className="sch-block">
          <div className="sch-toggle-row">
            <span className="sch-toggle-ico"><Pin size={16} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sch-toggle-title">Pin note</div>
              <div className="sch-toggle-sub">Keep this note pinned at the top.</div>
            </div>
            <Toggle checked={pinned} onChange={setPinned} ariaLabel="Pin note" />
          </div>
        </div>
      )}

      {kind === "interview" && (
        <div className="sch-block">
          <div className="sch-toggle-title" style={{ marginBottom: 8 }}>Preparation checklist</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {checklist.map((c, i) => (
              <Checkbox key={c.label} checked={c.done} label={c.label}
                onChange={(v) => setChecklist(checklist.map((x, j) => (j === i ? { ...x, done: v } : x)))} />
            ))}
          </div>
        </div>
      )}

      <ReminderBlock on={remOn} setOn={setRemOn} timing={timing} setTiming={setTiming} defaultOn={defaultOn} />
    </ModalShell>
  );
}

/* ── Details modal ────────────────────────────────────────────────────────── */

export function EventDetailsModal({ event, role, onClose, onEdit, onDelete, onToggleComplete }: {
  event: ScheduleEvent; role: "student" | "advisor";
  onClose: () => void; onEdit: () => void; onDelete: () => void; onToggleComplete: () => void;
}) {
  const meta = KIND_META[event.kind];
  /* A student may only touch what they created; official dates and an advisor's
     entries stay read-only. The database enforces the same rule, so this is the
     visible half of it, not the whole of it. */
  const editable = role === "advisor" ? event.createdBy !== "system" : event.createdBy === "student";
  const plan = event.reminder?.enabled ? reminderTemplate(event) : null;
  /* Deleting is irreversible, so the button asks first and only the second
     press removes anything. */
  const [confirming, setConfirming] = useState(false);

  return (
    <ModalShell
      icon={<CalendarDays size={18} />} title={event.title} subtitle={`${meta.label} · ${new Date(event.date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}${event.time ? ` · ${event.time}` : ""}`}
      onClose={onClose}
      footer={
        confirming ? (
          <>
            <span className="sch-confirm-text">Delete this {meta.label.toLowerCase()}?</span>
            <button type="button" className="chat-chip" onClick={() => setConfirming(false)}>Keep it</button>
            <button type="button" className="chat-send danger" onClick={onDelete}>
              <Trash2 size={15} />Delete
            </button>
          </>
        ) : (
          <>
            {/* Read-only entries say so, rather than showing controls that
                would be refused. */}
            {!editable && <span className="sch-confirm-text">{event.kind === "official" ? "An official date, shown to everyone." : "Added by your advisor."}</span>}
            <button type="button" className="chat-chip" onClick={onClose}>Close</button>
            {editable && <button type="button" className="chat-chip" onClick={() => setConfirming(true)} style={{ color: "var(--red)", borderColor: "var(--red-line)" }}><Trash2 size={15} />Delete</button>}
            {editable && <button type="button" className="chat-chip" onClick={onEdit}>Edit</button>}
            {/* Completing is an edit, so it follows the same ownership rule:
                only whoever created the entry may change its state. */}
            {editable && (
              <button type="button" className="chat-send" onClick={onToggleComplete}>
                <CircleCheck size={15} />{event.completed ? "Mark as open" : "Mark completed"}
              </button>
            )}
          </>
        )
      }
    >
      <div className="sch-detail">
        <Pill style={{ color: meta.color, background: meta.tint, borderColor: meta.color }}>{meta.label}</Pill>
        {event.completed && <Pill tone="green">Completed</Pill>}
        {event.pinned && <Pill tone="indigo">Pinned</Pill>}
      </div>
      {event.description && <p className="sch-detail-body">{event.description}</p>}
      <div className="sch-detail-rows">
        {([
          ["Date", new Date(event.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })],
          ["Time", event.time ?? "All day"],
          ["Created by", event.createdBy === "system" ? "AfaqWay (official date)" : event.createdBy === "advisor" ? "Your advisor" : "You"],
          ["Status", event.completed ? "Completed" : "Open"],
          ...(event.category ? [["Category", event.category] as const] : []),
          ...(event.university ? [["University", event.university] as const] : []),
          ...(event.mode ? [["Type", event.mode] as const] : []),
          ...(event.location ? [["Location", event.location] as const] : []),
        ] as const).map(([k, v]) => (
          <div key={k} className="sch-detail-row"><span>{k}</span><b>{v}</b></div>
        ))}
      </div>
      {event.checklist && event.checklist.length > 0 && (
        <div className="sch-block">
          <div className="sch-toggle-title" style={{ marginBottom: 8 }}>Preparation checklist</div>
          {event.checklist.map((c) => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, font: "400 12.5px/20px var(--font-sans)", color: c.done ? "var(--ink-faint)" : "var(--ink)" }}>
              <CircleCheck size={14} color={c.done ? "var(--green)" : "var(--line)"} />{c.label}
            </div>
          ))}
        </div>
      )}
      {plan && (
        <div className="ex-callout amber" style={{ marginTop: 14 }}>
          <span className="ex-callout-ico"><WhatsAppIcon size={15} /></span>
          <div>
            <div className="ex-callout-title">WhatsApp reminder prepared</div>
            <p className="ex-callout-body">&ldquo;{plan}&rdquo; — {TIMING_LABEL[event.reminder?.timing ?? DEFAULT_TIMING].toLowerCase()}. It sends once the WhatsApp integration is connected.</p>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

export { WhatsAppIcon };
