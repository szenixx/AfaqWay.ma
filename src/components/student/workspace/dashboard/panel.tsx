"use client";

/* The right utility panel: calendar · community · an open slot.

   The header (profile, settings, notifications) and the event block are gone
   — the shell's own top bar already carries identity and notifications, and
   the event card duplicated the Schedule module. One continuous white column,
   with the calendar carrying the weight. */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActiveCommunity } from "@/components/community/ActiveCommunity";
import { iso, monthGrid } from "@/lib/schedule";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

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

export function UtilityPanel() {
  const [selected, setSelected] = useState(() => new Date());

  return (
    <aside className="dx-panel">
      <Calendar selected={selected} onSelect={setSelected} />

      {/* Live presence, global: every country, every plan, students and
          advisors alike. Reusable component, real roster — see
          src/components/community/ActiveCommunity.tsx. */}
      <ActiveCommunity className="dx-community" />

      {/* Held open on purpose — the shape of the panel is settled before what
          goes here is decided. */}
      <section className="dx-panel-slot" aria-hidden />
    </aside>
  );
}
