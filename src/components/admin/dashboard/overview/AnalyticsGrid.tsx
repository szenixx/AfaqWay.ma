"use client";

/* The analytics row: registrations chart (≈51%), journey funnel (≈26%) and
   destinations (≈23%). HeroUI has no chart component, so the bar chart is
   hand-drawn — but it lives inside a HeroUI Card and uses the same tokens, so
   it belongs to the same system. */

import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card, Chip, ProgressCircle, Separator, Skeleton } from "@heroui/react";
import { countryByCode } from "@/components/profile-setup/countries";

/* ── Student Activity ─────────────────────────────────────────────────────
   A stacked area chart. HeroUI has no chart primitive, so this is recharts —
   but it sits inside a HeroUI Card and draws from the same scoped tokens, so
   it belongs to the page rather than arriving with its own look.

   The two bands are neutral — activated accounts and signups that have not
   activated yet. No plan, no country: the same chart holds however the
   platform grows, and the two together are the day's total. */

type Day = { label: string; date: string; activated: number; signups: number; value: number };

const SERIES = [
  { key: "signups", label: "Signups", color: "#8A93C9" },
  { key: "activated", label: "Activated", color: "#3B41C9" },
] as const;

function ChartTip({ active, payload, label }: {
  active?: boolean; payload?: { dataKey: string; value: number; payload: Day }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="ao-rtip">
      <span className="ao-rtip-head">{label} · {row.date}</span>
      {SERIES.map((s) => (
        <span key={s.key} className="ao-rtip-row">
          <i style={{ background: s.color }} aria-hidden />
          {s.label}
          <b>{row[s.key]}</b>
        </span>
      ))}
      <span className="ao-rtip-total">Total <b>{row.value}</b></span>
    </div>
  );
}

export function StudentActivityCard({ weekly, range, trend, loading }: {
  weekly: Day[]; range: string; trend: number | null; loading: boolean;
}) {
  const total = weekly.reduce((a, w) => a + w.value, 0);
  const up = (trend ?? 0) >= 0;

  return (
    <Card className="ao-card ao-activity" variant="default">
      <Card.Header className="ao-card-head">
        <div>
          <Card.Title>Student Activity</Card.Title>
          <Card.Description>New registrations this week</Card.Description>
        </div>
        <Chip color="accent" size="sm" variant="soft">{total} total</Chip>
      </Card.Header>

      <Card.Content className="ao-chart">
        {loading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={weekly} margin={{ left: 4, right: 8, top: 6, bottom: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient key={s.key} id={`ao-g-${s.key}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.42} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.04} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="#EFF0F5" strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false} dataKey="label" tickLine={false} tickMargin={8}
                tick={{ fill: "#5A6B85", fontSize: 10.5 }}
              />
              <Tooltip content={<ChartTip />} cursor={{ stroke: "#C9CCE2", strokeDasharray: "3 3" }} />
              {SERIES.map((s) => (
                <Area
                  key={s.key} dataKey={s.key} fill={`url(#ao-g-${s.key})`}
                  stackId="a" stroke={s.color} strokeWidth={2} type="natural"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card.Content>

      <Card.Footer className="ao-chart-foot">
        <span className="ao-trend">
          {trend === null ? "First week of data" : (
            <>
              {up ? "Trending up" : "Trending down"} by {Math.abs(trend)}% this week
              {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            </>
          )}
        </span>
        <span className="ao-chart-range">{range}</span>
      </Card.Footer>
    </Card>
  );
}

/* Colour carries the stage's role, using HeroUI's own semantic variants:
   neutral to start, accent through the working middle, gold for the milestone,
   green once they have landed. */
const FUNNEL_COLOR = ["default", "accent", "accent", "accent", "warning", "success"] as const;

export function StudentJourneyCard({ funnel, loading }: {
  funnel: { label: string; value: number }[]; loading: boolean;
}) {
  /* Each stage reads as a share of everyone who has an account — so the ring
     answers "what fraction got this far", which a bar length never quite did. */
  const base = Math.max(1, funnel[0]?.value ?? 1);
  return (
    <Card className="ao-card ao-journey" variant="default">
      <Card.Header className="ao-card-head">
        <div>
          <Card.Title>Student Journey</Card.Title>
          <Card.Description>Stage distribution</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="ao-funnel">
        {funnel.map((f, i) => (
          <div key={f.label} className={`ao-dialcell ao-dc-${FUNNEL_COLOR[i] ?? "accent"}`}>
            <div className="ao-dialcell-ring">
              <ProgressCircle
                aria-label={`${f.label}: ${f.value} of ${base} students`}
                className="ao-mini-ring"
                color={FUNNEL_COLOR[i] ?? "accent"}
                value={loading ? 0 : (f.value / base) * 100}
              />
              {/* The count sits in its own circle, so the ring reads as the
                  share and the badge reads as the number. */}
              <span className="ao-dialcell-num">
                {loading ? <Skeleton className="size-5 rounded-full" /> : f.value}
              </span>
            </div>
            <span className="ao-dialcell-label">{f.label}</span>
          </div>
        ))}
      </Card.Content>
    </Card>
  );
}

/* ── Destinations ─────────────────────────────────────────────────────────
   A single destination fills the ring completely — there is nothing to divide.
   Two or more split it into arcs, and the legend below carries the country's
   real flag beside its name. */

function Donut({ slices, total }: {
  slices: { code: string; label: string; value: number; color: string }[]; total: number;
}) {
  const SIZE = 132, R = 52, W = 15, C = 2 * Math.PI * R, mid = SIZE / 2;
  /* Each arc starts where the previous ones ended. Expressed as a sum of the
     preceding lengths rather than a mutated accumulator, so the render stays
     pure and repeatable. */
  const lengths = slices.map((s) => (total ? (s.value / total) * C : 0));
  const arcs = slices.map((s, i) => ({
    ...s,
    len: lengths[i],
    offset: lengths.slice(0, i).reduce((a, b) => a + b, 0),
  }));

  return (
    <svg className="ao-donut" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden>
      <circle cx={mid} cy={mid} fill="none" r={R} stroke="#EEEFF5" strokeWidth={W} />
      {arcs.map((a) => (
        <circle
          key={a.code} cx={mid} cy={mid} fill="none" r={R}
          stroke={a.color} strokeDasharray={`${a.len} ${C - a.len}`}
          strokeDashoffset={-a.offset} strokeLinecap={arcs.length > 1 ? "butt" : "round"}
          strokeWidth={W} transform={`rotate(-90 ${mid} ${mid})`}
        />
      ))}
    </svg>
  );
}

/** The country's real flag, drawn from its own stripe colours. */
function Flag({ code }: { code: string }) {
  const stripes = countryByCode(code)?.stripes ?? ["#DCE2EA"];
  return (
    <span className="ao-flag" aria-hidden>
      {stripes.map((c, i) => <i key={i} style={{ background: c }} />)}
    </span>
  );
}

const SLICE_COLORS = ["#3B41C9", "#6B4BA8", "#0F8A7E", "#B0790B", "#B23B27"];

export function DestinationsCard({ countries, loading }: {
  countries: { code: string; label: string; value: number }[]; loading: boolean;
}) {
  const total = countries.reduce((a, c) => a + c.value, 0);
  const slices = countries.map((c, i) => ({ ...c, color: SLICE_COLORS[i % SLICE_COLORS.length] }));

  return (
    <Card className="ao-card ao-dest" variant="default">
      <Card.Header className="ao-card-head">
        <div>
          <Card.Title>Destinations</Card.Title>
          <Card.Description>Active students by country</Card.Description>
        </div>
      </Card.Header>
      <Card.Content className="ao-dest-body">
        <div className="ao-dial">
          <Donut slices={slices} total={total} />
          <div className="ao-dial-mid">
            {loading ? <Skeleton className="h-6 w-8 rounded" /> : <span className="ao-dial-num">{total}</span>}
            <span className="ao-dial-cap">total</span>
          </div>
        </div>

        <Separator className="ao-dest-sep" />

        <ul className="ao-dest-list">
          {slices.length === 0 && !loading && <li className="ao-empty">No active destinations yet.</li>}
          {slices.slice(0, 4).map((c) => (
            <li key={c.code}>
              <span className="ao-swatch" style={{ background: c.color }} aria-hidden />
              <Flag code={c.code} />
              <span className="ao-dest-name">{c.label}</span>
              <span className="ao-dest-val">{c.value}</span>
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}
