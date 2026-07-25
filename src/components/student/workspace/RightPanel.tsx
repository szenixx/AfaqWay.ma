"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight, Calendar, ChevronLeft, ChevronRight, CircleCheck, Clock3,
  Coins, FileText, Landmark, Languages, Route, TriangleAlert,
} from "lucide-react";
import { UniversityBrand } from "@/components/ds";
import { JOURNEY, JOURNEY_PCT, REQUIRED_DOCS } from "./data";
import type { WsProfile } from "./Modules";

/* Reusable right panel for the workspace (Journey and Documents today, any
   module later). Four cards, one component each, all built from the global
   card / button / badge / progress language. No data is invented: everything
   comes from the student's profile and the journey + document sources. */

/* ── Shared building blocks ───────────────────────────────────────────────── */

function Card({ children, title, icon, action }: { children: ReactNode; title: string; icon: ReactNode; action?: ReactNode }) {
  return (
    <section className="rp-card">
      <header className="rp-head">
        <span className="rp-head-ico">{icon}</span>
        <h3 className="rp-head-title">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function TextButton({ children, onClick, href }: { children: ReactNode; onClick?: () => void; href?: string }) {
  const inner = <>{children}<ArrowRight size={13} /></>;
  return href
    ? <a className="rp-textbtn" href={href}>{inner}</a>
    : <button type="button" className="rp-textbtn" onClick={onClick}>{inner}</button>;
}

export function ProgressBar({ pct, tone = "primary" }: { pct: number; tone?: "primary" | "green" }) {
  return (
    <div className="rp-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span className={`rp-progress-fill${tone === "green" ? " green" : ""}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

/* Tiny sparkline for the document statistics. */
function Trend({ tone, up }: { tone: "green" | "amber" | "red"; up: boolean }) {
  const color = tone === "green" ? "var(--green)" : tone === "amber" ? "var(--amber)" : "var(--red)";
  const d = up ? "M1 13 L9 9 L17 10 L25 3" : "M1 3 L9 8 L17 6 L25 13";
  return (
    <svg className="rp-trend" width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden>
      <path d={d} stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Card 1 — University information ──────────────────────────────────────── */

export function UniversityCard({ profile, onNav }: { profile: WsProfile; onNav: (id: string) => void }) {
  const st = profile.study;

  return (
    <Card
      title="University" icon={<Landmark size={15} />}
      action={<TextButton onClick={() => onNav("profile")}>View profile</TextButton>}
    >
      <div className="rp-uni">
        {/* The student's own university, resolved from their programme data. */}
        <UniversityBrand name={st?.university} size={42} />
        <div style={{ minWidth: 0 }}>
          <div className="rp-uni-name">{st?.university && st.university !== "—" ? st.university : "No university yet"}</div>
          <div className="rp-uni-country">{st?.country ?? "Lithuania"}</div>
        </div>
      </div>

      <div className="rp-divider" />

      <div className="rp-label">Program</div>
      <div className="rp-program">{st?.program && st.program !== "—" ? st.program : "Not selected yet"}</div>

      <div className="rp-duo">
        <div className="rp-block">
          <span className="rp-block-ico amber"><Coins size={14} /></span>
          <span className="rp-block-label">Tuition fees</span>
          <span className="rp-block-value">{st?.tuition && st.tuition !== "—" ? st.tuition : "—"}</span>
        </div>
        <div className="rp-block">
          <span className="rp-block-ico"><Languages size={14} /></span>
          <span className="rp-block-label">Study language</span>
          <span className="rp-block-value">{st?.language ?? "English"}</span>
        </div>
      </div>
    </Card>
  );
}

/* ── Card 2 — Mini calendar ───────────────────────────────────────────────── */

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const startOfWeek = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  x.setHours(0, 0, 0, 0);
  return x;
};

export function MiniCalendarCard({ event, onNav }: { event?: { title: string; at: string } | null; onNav?: (id: string) => void }) {
  const today = useMemo(() => new Date(), []);
  const [offset, setOffset] = useState(0); // weeks from the current one

  const week = useMemo(() => {
    const base = startOfWeek(today);
    base.setDate(base.getDate() + offset * 7);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i); return d; });
  }, [today, offset]);

  const monthLabel = week[3].toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  return (
    <Card
      title="Mini calendar" icon={<Calendar size={15} />}
      action={<TextButton onClick={() => onNav?.("schedule")}>Schedule</TextButton>}
    >
      <div className="rp-month">
        <span className="rp-month-label">{monthLabel}</span>
        <span className="rp-month-nav">
          <button type="button" className="rp-iconbtn" onClick={() => setOffset((v) => v - 1)} aria-label="Previous week"><ChevronLeft size={15} /></button>
          <button type="button" className="rp-iconbtn" onClick={() => setOffset((v) => v + 1)} aria-label="Next week"><ChevronRight size={15} /></button>
        </span>
      </div>

      <div className="rp-week">
        {week.map((d, i) => (
          <div key={i} className={`rp-day${isToday(d) ? " today" : ""}`}>
            <span className="rp-day-name">{DAY_NAMES[i]}</span>
            <span className="rp-day-num">{d.getDate()}</span>
          </div>
        ))}
      </div>

      <div className="rp-event">
        <span className="rp-event-ico"><Calendar size={14} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="rp-event-head"><span className="rp-dot" aria-hidden />Upcoming event</div>
          <div className="rp-event-title">{event?.title ?? "No event scheduled"}</div>
          <div className="rp-event-time">{event?.at ?? "Your advisor will confirm the next one"}</div>
        </div>
      </div>
    </Card>
  );
}

/* ── Card 3 — Journey snapshot ────────────────────────────────────────────── */

export function JourneySnapshotCard({ onNav }: { onNav: (id: string) => void }) {
  const activeIdx = Math.max(0, JOURNEY.findIndex((s) => s.status === "active"));
  const stage = JOURNEY[activeIdx];
  const nextStep = stage.tasks.find((t) => !t.done)?.label ?? JOURNEY[activeIdx + 1]?.title ?? "All steps complete";

  return (
    <Card
      title="Journey snapshot" icon={<Route size={15} />}
      action={<TextButton onClick={() => onNav("journey")}>View journey</TextButton>}
    >
      <div className="rp-label">Current stage</div>
      <div className="rp-stage"><span className="rp-dot green" aria-hidden />{stage.title}</div>

      <div className="rp-progress-row">
        <span className="rp-label">Progress</span>
        <span className="rp-pct">{JOURNEY_PCT}%</span>
      </div>
      <ProgressBar pct={JOURNEY_PCT} />

      <div className="rp-next">
        <span className="rp-next-ico"><ArrowRight size={14} /></span>
        <div style={{ minWidth: 0 }}>
          <div className="rp-label">Next step</div>
          <div className="rp-next-title">{nextStep}</div>
        </div>
      </div>
    </Card>
  );
}

/* ── Card 4 — Documents overview ──────────────────────────────────────────── */

export function DocumentsOverviewCard({ onNav }: { onNav: (id: string) => void }) {
  const verified = REQUIRED_DOCS.filter((d) => d.status === "approved").length;
  const pending = REQUIRED_DOCS.filter((d) => d.status === "under_review" || d.status === "pending").length;
  const missing = REQUIRED_DOCS.filter((d) => d.status === "needs_changes").length;
  const completion = Math.round((verified / REQUIRED_DOCS.length) * 100);

  const stats: { label: string; value: number; tone: "green" | "amber" | "red"; up: boolean; icon: ReactNode }[] = [
    { label: "Verified", value: verified, tone: "green", up: true, icon: <CircleCheck size={13} /> },
    { label: "Pending", value: pending, tone: "amber", up: true, icon: <Clock3 size={13} /> },
    { label: "Missing", value: missing, tone: "red", up: false, icon: <TriangleAlert size={13} /> },
  ];

  return (
    <Card
      title="Documents overview" icon={<FileText size={15} />}
      action={<TextButton onClick={() => onNav("documents")}>View documents</TextButton>}
    >
      <div className="rp-stats">
        {stats.map((s) => (
          <div key={s.label} className="rp-stat">
            <span className={`rp-stat-num ${s.tone}`}>{s.value}</span>
            <Trend tone={s.tone} up={s.up} />
            <span className="rp-stat-label">{s.icon}{s.label}</span>
          </div>
        ))}
      </div>

      <div className="rp-progress-row">
        <span className="rp-label">Completion</span>
        <span className="rp-pct">{completion}%</span>
      </div>
      <ProgressBar pct={completion} tone="green" />

      <p className="rp-helper">Keep uploading your required documents to complete your application.</p>
    </Card>
  );
}

/* ── The panel ────────────────────────────────────────────────────────────── */

export default function RightPanel({ profile, onNav, event, hide }: {
  profile: WsProfile;
  onNav: (id: string) => void;
  event?: { title: string; at: string } | null;
  /** The module already on screen hides its own summary card. */
  hide?: "journey" | "documents";
}) {
  return (
    <aside className="rp-panel">
      <UniversityCard profile={profile} onNav={onNav} />
      <MiniCalendarCard event={event} onNav={onNav} />
      {hide !== "journey" && <JourneySnapshotCard onNav={onNav} />}
      {hide !== "documents" && <DocumentsOverviewCard onNav={onNav} />}
    </aside>
  );
}
