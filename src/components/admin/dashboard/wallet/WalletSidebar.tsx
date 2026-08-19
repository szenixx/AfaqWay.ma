"use client";

/* The wallet's right column: what needs doing, and what the numbers say.

   Three stacked cards, none of them a second dashboard. Every action here
   already exists in the platform — there is no stored balance to top up and no
   card on file to manage, so nothing of that kind is invented. */

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Button, Card, Chip, Skeleton } from "@heroui/react";
import { PAY_METHODS } from "@/lib/plans";
import { ArrowRight, CircleCheckBig } from "lucide-react";
import type { Payment } from "@/components/admin/dashboard/kit";
import { initials, methodName, money } from "./parts";

/* ── Needs attention ──────────────────────────────────────────────────────
   The live receipt queue. Same rows the Payment Reviews page acts on, so an
   admin can see the backlog without leaving the wallet. */

export function NeedsAttention({ rows, names, loading, onReview }: {
  rows: Payment[]; names: Record<string, string>; loading: boolean;
  onReview: (id?: string) => void;
}) {
  return (
    <Card className="wa-card wa-side-card" variant="default">
      <Card.Header className="wa-card-head">
        <div>
          <Card.Title>Needs Attention</Card.Title>
          <Card.Description>Receipts awaiting verification</Card.Description>
        </div>
        {!loading && rows.length > 0 && (
          <Chip color="warning" size="sm" variant="soft">{rows.length}</Chip>
        )}
      </Card.Header>

      <Card.Content className="wa-side-body">
        {loading ? (
          <div className="wa-rows-skel">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-10 w-full rounded-lg" key={i} />)}
          </div>
        ) : rows.length === 0 ? (
          /* Clear queue is good news, so it reads as good news rather than as
             an empty box. */
          <div className="wa-empty wa-empty-ok">
            <CircleCheckBig size={18} />
            <p>Every receipt has been reviewed.</p>
          </div>
        ) : (
          <ul className="wa-queue">
            {rows.slice(0, 4).map((p) => (
              <li key={p.id}>
                <button className="wa-queue-row" onClick={() => onReview(p.id)} type="button">
                  <span className="wa-queue-ini" aria-hidden>{initials(names[p.user_id])}</span>
                  <span className="wa-queue-id">
                    <span className="wa-queue-name">{names[p.user_id] ?? "Unknown student"}</span>
                    <span className="wa-queue-meta">{money(p.amount)} · {methodName(p.method)}</span>
                  </span>
                  <Chip color="warning" size="sm" variant="soft">Verify</Chip>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>

      {!loading && rows.length > 0 && (
        <Card.Footer>
          <Button className="w-full" onPress={() => onReview()} size="sm" variant="secondary">
            Open payment reviews <ArrowRight size={14} />
          </Button>
        </Card.Footer>
      )}
    </Card>
  );
}

/* ── Payment methods ──────────────────────────────────────────────────────
   Not cards on file — this platform takes receipts, not stored instruments.
   What exists is the mix students actually pay with, which is the useful
   operational read.

   A donut rather than bars: the question here is share of a whole, and each
   slice wears the method's own brand colour, which PAY_METHODS already
   defines. HeroUI has no multi-segment chart, so this is recharts, the same
   choice the Overview's charts make. */

export function PaymentMethods({ dist, loading }: {
  dist: { label: string; value: number }[]; loading: boolean;
}) {
  /* Two rules hold this card together.

     The roster is PAY_METHODS, not the payments table: every method the
     platform supports is listed whether or not anyone has used it yet, so
     adding one to src/lib/plans.ts makes it appear here with no edit to this
     card.

     The counts are approved receipts only — `methodDist` is built from the
     approved slice in useWalletData, so a pending or rejected receipt never
     reaches this ring. A method's share is money that actually cleared. */
  const counts = new Map(dist.map((m) => [m.label, m.value]));
  const rows = PAY_METHODS
    .map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color ?? "#8695AB",
      available: m.available,
      value: counts.get(m.id) ?? 0,
    }))
    /* Used first and by weight, then the ones still waiting to be used, with
       methods that are not switched on yet at the back. */
    .sort((a, b) => b.value - a.value
      || Number(b.available) - Number(a.available)
      || a.name.localeCompare(b.name));

  const total = rows.reduce((s, m) => s + m.value, 0);
  /* recharts needs something to draw. With no receipts yet the ring is a
     single neutral band rather than an empty box. */
  const slices = total > 0 ? rows.filter((m) => m.value > 0) : [];

  return (
    <Card className="wa-card wa-side-card" variant="default">
      <Card.Header className="wa-card-head">
        <div>
          <Card.Title>Payment Methods</Card.Title>
          <Card.Description>
            {loading ? "Loading…" : `${rows.length} supported · share of approved receipts`}
          </Card.Description>
        </div>
      </Card.Header>

      <Card.Content className="wa-side-body">
        {loading ? (
          <div className="wa-rows-skel">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-8 w-full rounded-lg" key={i} />)}
          </div>
        ) : (
          <div className="wa-donut-wrap">
            <div className="wa-donut" aria-hidden>
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    cx="50%" cy="50%"
                    data={slices.length ? slices : [{ id: "empty", value: 1 }]}
                    dataKey="value"
                    innerRadius="64%"
                    outerRadius="100%"
                    paddingAngle={slices.length > 1 ? 2 : 0}
                    stroke="none"
                  >
                    {slices.length
                      ? slices.map((m) => <Cell fill={m.color} key={m.id} />)
                      : <Cell fill="#EFF0F5" key="empty" />}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="wa-donut-mid">
                <span className="wa-donut-num">{total}</span>
                <span className="wa-donut-cap">approved</span>
              </div>
            </div>

            {/* The chart is decorative; this list is the accessible reading, and
                the only place an unused method can be seen at all. */}
            <ul className="wa-legend">
              {rows.map((m) => (
                <li className={m.value === 0 ? "is-idle" : undefined} key={m.id}>
                  <span className="wa-legend-dot" style={{ background: m.color }} aria-hidden />
                  <span className="wa-legend-name">{m.name}</span>
                  <span className="wa-legend-pct">
                    {!m.available ? "Off" : total ? `${Math.round((m.value / total) * 100)}%` : "0%"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
