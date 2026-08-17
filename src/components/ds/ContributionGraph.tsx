"use client";

import { useMemo } from "react";
import type { ActivityDay } from "@/lib/activity";

/* ContributionGraph — a year of activity, one square per day.
 *
 * Columns are weeks, rows are weekdays, the way a wall calendar reads. The
 * colour scale is the platform's own indigo ramp, so the graph belongs to the
 * product rather than borrowing another one's green.
 *
 * Intensity is relative to the student's own busiest day, not an absolute
 * count. Someone who uploads two documents a week and someone mid-application
 * should both see a graph with contrast in it; a fixed scale would leave the
 * first one flat and unreadable.
 *
 * Every square carries its own title, so the exact numbers are available on
 * hover and to a screen reader — the colour is a summary, never the only copy
 * of the information. */

/* Five steps: empty, then four levels of the brand ramp. Empty is a surface
   tint rather than white, so an inactive day still reads as a day.
   Each step clears 1.28:1 against the one below it, measured — the first step
   in particular, because "one action" and "none" are the pair a reader most
   needs to tell apart. */
const LEVELS = ["var(--subtle)", "var(--primary-200)", "var(--primary-300)", "var(--primary-400)", "var(--indigo-600)"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABEL = ["Mon", "", "Wed", "", "Fri", "", ""];

/** Which of the five steps a day's count falls into. */
function level(count: number, best: number): number {
  if (count <= 0) return 0;
  if (best <= 1) return 4;
  const share = count / best;
  return share > 0.66 ? 4 : share > 0.33 ? 3 : share > 0.12 ? 2 : 1;
}

function tooltip(day: ActivityDay): string {
  const when = new Date(day.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
  if (day.count === 0) return `No activity on ${when}`;
  const parts = Object.entries(day.breakdown)
    .filter(([, n]) => n > 0)
    .map(([source, n]) => `${n} ${source}`);
  return `${day.count} ${day.count === 1 ? "action" : "actions"} on ${when} — ${parts.join(", ")}`;
}

export function ContributionGraph({ days, best, loading }: {
  days: ActivityDay[];
  /** The busiest day, which sets the top of the scale. */
  best: number;
  loading?: boolean;
}) {
  /* Weeks run Monday to Sunday. The first column is padded so every row is the
     same weekday all the way across. */
  const weeks = useMemo(() => {
    if (days.length === 0) return [];
    const out: (ActivityDay | null)[][] = [];
    let current: (ActivityDay | null)[] = [];

    const firstWeekday = (new Date(days[0].date).getDay() + 6) % 7;   // Mon = 0
    for (let i = 0; i < firstWeekday; i++) current.push(null);

    for (const day of days) {
      current.push(day);
      if (current.length === 7) { out.push(current); current = []; }
    }
    if (current.length) {
      while (current.length < 7) current.push(null);
      out.push(current);
    }
    return out;
  }, [days]);

  /* A month label sits above the first week that starts a new month. */
  const monthLabels = useMemo(() => weeks.map((week, i) => {
    const first = week.find(Boolean);
    if (!first) return null;
    const date = new Date(first.date);
    const previous = i > 0 ? weeks[i - 1].find(Boolean) : null;
    if (previous && new Date(previous.date).getMonth() === date.getMonth()) return null;
    return MONTHS[date.getMonth()];
  }), [weeks]);

  if (loading) {
    return <div className="cg-skeleton" aria-label="Loading activity" />;
  }

  return (
    <div className="cg">
      <div className="cg-scroll">
        <div className="cg-inner">
          <div className="cg-months" aria-hidden>
            {monthLabels.map((label, i) => <span key={i} className="cg-month">{label}</span>)}
          </div>

          <div className="cg-body">
            <div className="cg-days" aria-hidden>
              {DAY_LABEL.map((d, i) => <span key={i} className="cg-day-label">{d}</span>)}
            </div>

            {/* A table would imply the columns mean something on their own; they
                are a layout, so the grid is presentational and each cell speaks
                for itself through its title. */}
            <div className="cg-grid" role="img" aria-label="Daily activity over the past year">
              {weeks.map((week, wi) => (
                <div key={wi} className="cg-week">
                  {week.map((day, di) => day ? (
                    <span
                      key={day.date}
                      className="cg-cell"
                      style={{ background: LEVELS[level(day.count, best)] }}
                      title={tooltip(day)}
                    />
                  ) : <span key={`${wi}-${di}`} className="cg-cell empty" />)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cg-legend">
        <span className="cg-legend-text">Less</span>
        {LEVELS.map((c, i) => <span key={i} className="cg-cell" style={{ background: c }} />)}
        <span className="cg-legend-text">More</span>
      </div>
    </div>
  );
}
