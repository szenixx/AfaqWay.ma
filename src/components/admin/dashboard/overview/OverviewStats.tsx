"use client";

/* The six platform KPIs.

   One HeroUI Card each, all on the same neutral surface — the accent lives in
   the icon tile and the change chip, never in the card background, so the row
   reads as one instrument panel rather than six coloured tiles. */

import { Card, Chip, Skeleton, Tooltip } from "@heroui/react";
import { CircleCheckBig, FileText, Globe, Plane, UserPlus, Users } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "accent" | "success" | "warning" | "purple" | "danger" | "teal";

function Kpi({ label, value, tone, icon, change, hint, loading }: {
  label: string; value: number; tone: Tone; icon: ReactNode;
  change?: number | null; hint: string; loading: boolean;
}) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Card className={`ao-kpi ao-t-${tone}`} variant="default">
          <div className="ao-kpi-top">
            <span className="ao-kpi-label">{label}</span>
            <span className="ao-kpi-ico" aria-hidden>{icon}</span>
          </div>
          <div className="ao-kpi-bottom">
            {loading
              ? <Skeleton className="h-7 w-14 rounded-md" />
              : <span className="ao-kpi-value">{value.toLocaleString("en-GB")}</span>}
            {/* A null change means there is no prior week to compare against —
                shown as "new", never as a fabricated 0%. */}
            {!loading && change !== undefined && (
              <Chip
                className="ao-kpi-chip"
                color={change === null ? "default" : change >= 0 ? "success" : "danger"}
                size="sm" variant="soft"
              >
                {change === null ? "new" : `${change >= 0 ? "+" : ""}${change}%`}
              </Chip>
            )}
          </div>
        </Card>
      </Tooltip.Trigger>
      <Tooltip.Content>{hint}</Tooltip.Content>
    </Tooltip>
  );
}

export function OverviewStats({ d }: { d: {
  loading: boolean; totalStudents: number; activeStudents: number; newToday: number;
  countries: { label: string }[]; applications: number; arrived: number;
  totalDelta: number | null; activeDelta: number | null;
} }) {
  return (
    <section className="ao-kpis" aria-label="Platform summary">
      <Kpi label="Total Students" value={d.totalStudents} tone="accent" loading={d.loading}
        icon={<Users size={15} />} change={d.totalDelta} hint="All registered accounts. Change is this week vs last." />
      <Kpi label="Active Students" value={d.activeStudents} tone="success" loading={d.loading}
        icon={<CircleCheckBig size={15} />} change={d.activeDelta} hint="Students on an active plan." />
      <Kpi label="New Today" value={d.newToday} tone="warning" loading={d.loading}
        icon={<UserPlus size={15} />} hint="Registered since midnight." />
      <Kpi label="Countries" value={d.countries.length} tone="purple" loading={d.loading}
        icon={<Globe size={15} />} hint="Destinations with at least one active student." />
      <Kpi label="Applications" value={d.applications} tone="danger" loading={d.loading}
        icon={<FileText size={15} />} hint="Students who have cleared at least one journey stage." />
      <Kpi label="Arrived" value={d.arrived} tone="teal" loading={d.loading}
        icon={<Plane size={15} />} hint="Students who have cleared four or more stages." />
    </section>
  );
}
