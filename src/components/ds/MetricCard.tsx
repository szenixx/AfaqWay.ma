"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EllipsisVertical, TrendingDown, TrendingUp } from "lucide-react";

/* The platform's statistics card. One component, one layout: only the icon,
   tone, title, subtitle and dynamic values change. Used by every admin module
   that shows a metric. Visuals live in ds.css (.mc-*). */

export type MetricTone = "blue" | "green" | "amber" | "red" | "purple" | "indigo";

export type MetricCardProps = {
  title: string;
  subtitle: string;
  /** Dynamic value — never hardcode it at the call site. */
  value: number | string;
  icon: ReactNode;
  tone: MetricTone;
  /** Trend badge, e.g. { value: "12%", dir: "up" }. Omitted when unknown. */
  badge?: { value: string; dir: "up" | "down" | "flat" };
  /** Optional control in the bottom-right (e.g. the year selector). */
  control?: ReactNode;
  /** Items for the three-dot menu. */
  menu?: { label: string; onSelect: () => void }[];
  loading?: boolean;
};

export function MetricCard({ title, subtitle, value, icon, tone, badge, control, menu, loading }: MetricCardProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <article className={`mc mc-${tone}`}>
      {/* Oversized watermark of the same icon, behind everything. */}
      <span className="mc-watermark" aria-hidden>{icon}</span>

      <header className="mc-head">
        <span className="mc-ico">{icon}</span>
        {menu && menu.length > 0 && (
          <div className="mc-menuwrap" ref={root}>
            <button type="button" className="mc-menubtn" aria-label={`${title} options`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
              <EllipsisVertical size={16} />
            </button>
            {open && (
              <div className="mc-menu">
                {menu.map((m) => (
                  <button key={m.label} type="button" className="mc-menu-item" onClick={() => { m.onSelect(); setOpen(false); }}>{m.label}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="mc-body">
        <div className="mc-value">{loading ? "—" : value}</div>
        <div className="mc-title">{title}</div>
        <p className="mc-sub">{subtitle}</p>

        <div className="mc-foot">
          {badge && (
            <span className="mc-badge">
              {badge.dir === "down" ? <TrendingDown size={13} /> : badge.dir === "up" ? <TrendingUp size={13} /> : null}
              {badge.value}
            </span>
          )}
          {control && <span className="mc-control">{control}</span>}
        </div>
      </div>
    </article>
  );
}

/** Percentage change between the current and previous period, formatted for the
    badge. Returns undefined when there is no previous data to compare against. */
export function trendBadge(current: number, previous: number): { value: string; dir: "up" | "down" | "flat" } | undefined {
  if (!previous && !current) return undefined;
  if (!previous) return { value: `+${current}`, dir: "up" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { value: `${pct > 0 ? "+" : ""}${pct}%`, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}
