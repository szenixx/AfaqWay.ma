"use client";

/* The money, top of the page.

   The hero card carries the one figure the whole page is about — approved
   revenue — and the strongest brand treatment on the screen. Everything under
   it stays neutral so this reads first, exactly as the Overview's KPI row does
   it: the accent lives in the icon tile and the chip, never in the surface. */

import { Card, Chip, ProgressBar, Separator, Skeleton, Tooltip } from "@heroui/react";
import { CalendarDays, CircleCheckBig, CircleX, Clock3, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { money } from "./parts";

type Tone = "accent" | "success" | "warning" | "danger" | "purple";

/* ── Hero balance ─────────────────────────────────────────────────────────
   Not a bank balance: this platform holds no stored value. It is the total
   that has actually cleared review, with the figures that qualify it sitting
   beside it rather than in cards of their own. */

export function WalletBalance({ d }: { d: {
  loading: boolean; totalRevenue: number; monthRevenue: number;
  pending: number; successful: number; payingUsers: number;
  series: { label: string; value: number }[];
  topCountry: { label: string; value: number } | null;
  selfCount: number; fullCount: number;
} }) {
  /* Month over month, read off the revenue series the hook already builds.
     A first month has nothing to compare against, so it says so rather than
     showing a fabricated +100%. */
  const prev = d.series.at(-2)?.value ?? 0;
  const delta = prev > 0 ? Math.round(((d.monthRevenue - prev) / prev) * 100) : null;

  return (
    <Card className="wa-hero" variant="default">
      {/* The lockup: the platform's own mark, inlined so it takes the card's
          white at full strength instead of loading an asset over a gradient. */}
      <div className="wa-hero-brand">
        <svg className="wa-hero-glyph" viewBox="0 0 96 96" aria-hidden fill="none">
          <g stroke="#fff" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M29 28 48 45 67 28" />
            <path d="M29 54 48 71 67 54" />
          </g>
        </svg>
        <span className="wa-hero-brand-sep" aria-hidden />
        <span className="wa-hero-brand-name">AfaqWay</span>
      </div>

      <div className="wa-hero-row">
        <div className="wa-hero-main">
          <span className="wa-hero-ico" aria-hidden><Wallet size={17} /></span>
          <div className="wa-hero-id">
            <span className="wa-hero-label">Approved revenue</span>
            {d.loading
              ? <Skeleton className="h-9 w-52 rounded-lg" />
              : <span className="wa-hero-value">{money(d.totalRevenue)}</span>}
            <span className="wa-hero-note">Cleared payment review, all time</span>
          </div>
        </div>

        <div className="wa-hero-side">
          <HeroFigure label="This month" value={money(d.monthRevenue)} loading={d.loading} />
          <HeroFigure label="Awaiting review" value={String(d.pending)} loading={d.loading}
            chip={d.pending > 0 ? { text: "action", color: "warning" as const } : undefined} />
          <HeroFigure label="Paying students" value={String(d.payingUsers)} loading={d.loading} />
        </div>
      </div>

      {/* The qualifiers that do not deserve a figure of their own but do
          change how the number above should be read. */}
      <ul className="wa-hero-facts">
        <li>
          <span className="wa-hero-fact-k">Month over month</span>
          <span className="wa-hero-fact-v">
            {delta === null ? "First month on record"
              : `${delta >= 0 ? "+" : ""}${delta}% vs ${d.series.at(-2)?.label ?? "last month"}`}
          </span>
        </li>
        <li>
          <span className="wa-hero-fact-k">Top destination</span>
          <span className="wa-hero-fact-v">
            {d.topCountry ? `${d.topCountry.label} · ${money(d.topCountry.value)}` : "No approved revenue yet"}
          </span>
        </li>
        <li>
          <span className="wa-hero-fact-k">Plan mix</span>
          <span className="wa-hero-fact-v">
            {d.selfCount + d.fullCount === 0
              ? "No active plans"
              : `${d.selfCount} Self · ${d.fullCount} Full`}
          </span>
        </li>
      </ul>
    </Card>
  );
}

function HeroFigure({ label, value, loading, chip }: {
  label: string; value: string; loading: boolean;
  chip?: { text: string; color: "warning" | "success" };
}) {
  return (
    <div className="wa-hero-fig">
      <span className="wa-hero-fig-label">
        {label}
        {chip && <Chip className="wa-chip-xs" color={chip.color} size="sm" variant="soft">{chip.text}</Chip>}
      </span>
      {loading
        ? <Skeleton className="h-5 w-16 rounded-md" />
        : <span className="wa-hero-fig-value">{value}</span>}
    </div>
  );
}


/* ── Revenue goals ────────────────────────────────────────────────────────
   Beside the money rather than tucked into the sidebar: a target only means
   something next to the figure it is measuring. Its own white card, because
   the brand fill belongs to the revenue alone.

   The targets are derived from real revenue rather than typed in, exactly as
   the card that used to hold them did, so they move as the platform does. */

export function RevenueGoals({ monthRevenue, totalRevenue, payingUsers, successful, failed, loading }: {
  monthRevenue: number; totalRevenue: number; payingUsers: number;
  successful: number; failed: number; loading: boolean;
}) {
  const goals = [
    { label: "Monthly target", current: monthRevenue, target: Math.max(20000, monthRevenue * 1.4), money: true },
    { label: "Quarterly target", current: totalRevenue, target: Math.max(60000, totalRevenue * 1.3), money: true },
    { label: "Paying students", current: payingUsers, target: Math.max(50, payingUsers * 2), money: false },
  ];
  const decided = successful + failed;

  return (
    <Card className="wa-goals-card" variant="default">
      <div className="wa-goals-head">
        <span className="wa-goals-title">Revenue Goals</span>
        <span className="wa-goals-sub">Progress and key figures</span>
      </div>

      {loading ? (
        <div className="wa-rows-skel">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-6 w-full rounded-md" key={i} />)}
        </div>
      ) : (
        <>
          <ul className="wa-goals">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <li key={g.label}>
                  <div className="wa-goal-top">
                    <span className="wa-goal-name">{g.label}</span>
                    <span className="wa-goal-val">
                      {g.money ? money(g.current) : g.current}
                      <i> / {g.money ? money(g.target) : Math.round(g.target)}</i>
                    </span>
                  </div>
                  <ProgressBar aria-label={g.label} className="wa-bar" value={pct}>
                    <ProgressBar.Track><ProgressBar.Fill /></ProgressBar.Track>
                  </ProgressBar>
                </li>
              );
            })}
          </ul>

          <Separator className="wa-sep" />

          <dl className="wa-figures">
            <div>
              <dt>Average receipt</dt>
              <dd>{money(successful ? totalRevenue / successful : 0)}</dd>
            </div>
            <div>
              <dt>Approval rate</dt>
              {/* Out of decided receipts only: a pending one has not failed. */}
              <dd>{decided ? `${Math.round((successful / decided) * 100)}%` : "—"}</dd>
            </div>
          </dl>
        </>
      )}
    </Card>
  );
}

/* ── KPI row ──────────────────────────────────────────────────────────────
   Counts, not currency: how the receipts themselves are doing. Same card
   shape as the Overview's KPIs so the two pages read as one product. */

function Kpi({ label, value, tone, icon, hint, loading, suffix }: {
  label: string; value: string; tone: Tone; icon: ReactNode;
  hint: string; loading: boolean; suffix?: string;
}) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <Card className={`wa-kpi wa-t-${tone}`} variant="default">
          <div className="wa-kpi-top">
            <span className="wa-kpi-label">{label}</span>
            <span className="wa-kpi-ico" aria-hidden>{icon}</span>
          </div>
          <div className="wa-kpi-bottom">
            {loading
              ? <Skeleton className="h-6 w-12 rounded-md" />
              : <span className="wa-kpi-value">{value}{suffix && <i>{suffix}</i>}</span>}
          </div>
        </Card>
      </Tooltip.Trigger>
      <Tooltip.Content>{hint}</Tooltip.Content>
    </Tooltip>
  );
}

export function WalletStats({ d }: { d: {
  loading: boolean; monthRevenue: number; successful: number;
  failed: number; pending: number; transactions: number;
} }) {
  /* Only shown once at least one receipt has been decided — a rate out of
     nothing is noise, not a number. */
  const decided = d.successful + d.failed;
  const rate = decided ? Math.round((d.successful / decided) * 100) : null;

  return (
    <section className="wa-kpis" aria-label="Payment summary">
      <Kpi label="This month" value={money(d.monthRevenue)} tone="accent" loading={d.loading}
        icon={<CalendarDays size={15} />} hint="Approved revenue since the first of the month." />
      <Kpi label="Completed" value={String(d.successful)} tone="success" loading={d.loading}
        icon={<CircleCheckBig size={15} />} hint="Receipts approved by an administrator." />
      <Kpi label="Pending" value={String(d.pending)} tone="warning" loading={d.loading}
        icon={<Clock3 size={15} />} hint="Receipts submitted and awaiting review." />
      <Kpi label="Failed" value={String(d.failed)} tone="danger" loading={d.loading}
        icon={<CircleX size={15} />} hint="Receipts rejected at review." />
      <Kpi label="Transactions" value={String(d.transactions)} tone="purple" loading={d.loading}
        icon={<Users size={15} />}
        suffix={rate === null ? undefined : ` · ${rate}%`}
        hint={rate === null
          ? "Every receipt on record."
          : `Every receipt on record. ${rate}% of decided receipts were approved.`} />
    </section>
  );
}
