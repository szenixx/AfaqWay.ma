"use client";

/* FRAMES 10–14 — the right utility panel:
   toolbar · calendar · today's event · two actions.

   One continuous white column, not a stack of cards. Only the calendar is
   given real weight; everything else stays compact underneath it. */

import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Bell, Settings as SettingsIcon,
} from "lucide-react";
import { UserAvatar } from "@/components/ds";
import { iso, monthGrid } from "@/lib/schedule";
import { EVENT, STUDENT } from "./demo";
import type { WsProfile } from "../Modules";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

/* ── FRAME 11 · Toolbar ─────────────────────────────────────────────────── */

function Toolbar({ profile, unread, onNav }: {
  profile: WsProfile; unread: number; onNav: (id: string) => void;
}) {
  return (
    <header className="dx-tools">
      <button type="button" className="dx-ico sm" onClick={() => onNav("support")} aria-label="Help">
        <CircleHelp size={18} />
      </button>
      <button type="button" className="dx-ico sm" onClick={() => onNav("overview")} aria-label={`Notifications, ${unread} unread`}>
        <Bell size={18} />
        {unread > 0 && <span className="dx-dot" aria-hidden />}
      </button>
      <button type="button" className="dx-ico sm" onClick={() => onNav("settings")} aria-label="Settings">
        <SettingsIcon size={18} />
      </button>

      <button type="button" className="dx-me" onClick={() => onNav("profile")}>
        <UserAvatar
          size={32}
          user={{
            id: profile.userId, name: profile.fullName ?? STUDENT.fullName, avatarUrl: profile.avatarUrl,
            gender: profile.gender, avatarSeed: profile.avatarSeed,
            avatarStyle: profile.avatarStyle, verified: profile.verified,
          }}
        />
        <span className="dx-me-id">
          <span className="dx-me-name">{profile.fullName ?? STUDENT.fullName}</span>
          <span className="dx-me-mail">{profile.email ?? STUDENT.email}</span>
        </span>
      </button>
    </header>
  );
}

/* ── FRAME 12 · Calendar ────────────────────────────────────────────────── */

function Calendar({ selected, onSelect }: { selected: Date; onSelect: (d: Date) => void }) {
  const [cursor, setCursor] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  /* monthGrid is Monday-first; this panel reads Sunday-first, so the grid is
     shifted by one day rather than reimplemented. */
  const grid = useMemo(() => {
    const m = monthGrid(cursor.getFullYear(), cursor.getMonth());
    const start = new Date(m[0]); start.setDate(start.getDate() - 1);
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  const selIso = iso(selected);
  const shift = (by: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + by, 1));

  return (
    <div className="dx-cal">
      <header className="dx-cal-head">
        <div className="dx-cal-when">
          <h3 className="dx-cal-title">{selected.toLocaleDateString("en-GB", { month: "long", day: "numeric" })}</h3>
          <span className="dx-cal-day-name">{selected.toLocaleDateString("en-GB", { weekday: "long" })}</span>
        </div>
        <div className="dx-cal-nav">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={15} /></button>
          <button type="button" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={15} /></button>
        </div>
      </header>

      <div className="dx-cal-week" aria-hidden>{WEEK.map((d, i) => <span key={i}>{d}</span>)}</div>

      <div className="dx-cal-grid">
        {grid.map((d) => {
          const k = iso(d);
          const out = d.getMonth() !== cursor.getMonth();
          return (
            <button
              key={k} type="button"
              className={`dx-cal-cell${out ? " out" : ""}${k === selIso ? " sel" : ""}`}
              onClick={() => onSelect(d)}
              aria-label={d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              aria-pressed={k === selIso}
            >{d.getDate()}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ── FRAMES 13–14 · Event and actions ───────────────────────────────────── */

function EventBlock({ onNav }: { onNav: (id: string) => void }) {
  return (
    <div className="dx-event">
      <span className="dx-event-kicker">{EVENT.kicker}</span>
      <h3 className="dx-event-title">{EVENT.title}</h3>
      <p className="dx-event-detail">{EVENT.detail}</p>

      <div className="dx-event-meta">
        <span><Clock3 size={12} />{EVENT.time}</span>
        <span>{EVENT.duration}</span>
        <span className="dx-people" aria-label={`${EVENT.people.length} participants`}>
          {EVENT.people.map((p, i) => <i key={i} aria-hidden>{p}</i>)}
        </span>
      </div>

      {/* FRAME 14 — near-equal weight, secondary left, primary right. */}
      <div className="dx-event-acts">
        <button type="button" className="dx-btn outline" onClick={() => onNav("schedule")}>Reschedule</button>
        <button type="button" className="dx-btn primary" onClick={() => onNav("schedule")}>Start meeting</button>
      </div>
    </div>
  );
}

export function UtilityPanel({ profile, unread, onNav }: {
  profile: WsProfile; unread: number; onNav: (id: string) => void;
}) {
  const [selected, setSelected] = useState(() => new Date());
  return (
    <aside className="dx-panel">
      <Toolbar profile={profile} unread={unread} onNav={onNav} />
      <Calendar selected={selected} onSelect={setSelected} />
      <EventBlock onNav={onNav} />
    </aside>
  );
}
