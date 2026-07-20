"use client";

/* Floating-card dashboard kit: reusable cards + lightweight inline-SVG charts +
   live-data hooks. No Tailwind/Recharts in this repo, so charts are hand-rolled
   SVG and styling uses the project tokens. Scoped to /admin/dashboard. */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { supabase } from "@/lib/supabase/client";
import { countryByCode } from "@/components/profile-setup/countries";
import { planById } from "@/lib/plans";

const PALETTE = ["#2B4C9B", "#4F86C6", "#63B3A6", "#E0A458", "#C56B6B", "#8E7CC3", "#5AA9E6"];

// ── Base card ───────────────────────────────────────────────────────────────
export function DashCard({ title, subtitle, action, children, bodyScroll, style }: { title?: string; subtitle?: string; action?: ReactNode; children: ReactNode; bodyScroll?: boolean; style?: CSSProperties }) {
  return (
    <div className="dash-card" style={style}>
      {(title || action) && (
        <div className="dash-card-head">
          <div style={{ minWidth: 0 }}>
            {title && <div style={{ font: "700 14px/18px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>}
            {subtitle && <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{subtitle}</div>}
          </div>
          {action && <div style={{ flex: "none" }}>{action}</div>}
        </div>
      )}
      <div className="dash-card-body" style={{ overflowY: bodyScroll ? "auto" : "hidden" }}>{children}</div>
    </div>
  );
}

// ── Stat card (animated count) ────────────────────────────────────────────────
function useCountUp(value: number) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const from = ref.current, to = value, start = performance.now(), dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick); else ref.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return n;
}

export function StatCard({ label, value, prefix, suffix, delta, icon, loading }: { label: string; value: number; prefix?: string; suffix?: string; delta?: number; icon?: ReactNode; loading?: boolean }) {
  const n = useCountUp(loading ? 0 : value);
  return (
    <div className="dash-card dash-stat">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ font: "600 11px/15px var(--font-sans)", color: "var(--ink-soft)" }}>{label}</span>
        {icon && <span style={{ width: 28, height: 28, borderRadius: 9, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}>
        <span style={{ font: "700 clamp(20px, 2.4vh, 26px)/1.1 var(--font-sans)", color: "var(--ink)" }}>{loading ? "—" : `${prefix ?? ""}${Math.round(n).toLocaleString("en-US")}${suffix ?? ""}`}</span>
        {typeof delta === "number" && !loading && (
          <span style={{ font: "600 11px/1 var(--font-sans)", color: delta >= 0 ? "var(--green)" : "var(--red)" }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%</span>
        )}
      </div>
    </div>
  );
}

// ── Donut / distribution ─────────────────────────────────────────────────────
export function Donut({ data, size = 132 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg width={size} height={size} style={{ flex: "none" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={12} />
        {data.map((d, i) => {
          const frac = d.value / total, dash = frac * C, off = C * (1 - acc);
          acc += frac;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth={12} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={off} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt" />;
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" style={{ font: "700 18px var(--font-sans)", fill: "var(--ink)" }}>{total.toLocaleString("en-US")}</text>
        <text x={cx} y={cy + 15} textAnchor="middle" style={{ font: "400 10px var(--font-sans)", fill: "var(--ink-faint)" }}>total</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, font: "500 12px/16px var(--font-sans)", color: "var(--ink)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, flex: "none", background: PALETTE[i % PALETTE.length] }} />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
            <span style={{ color: "var(--ink-soft)" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bars (category or time series) ───────────────────────────────────────────
export function Bars({ data, height = "100%", color = "var(--indigo-600)" }: { data: { label: string; value: number }[]; height?: number | string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height, minHeight: 90, width: "100%" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0, height: "100%", justifyContent: "flex-end" }}>
          <div title={`${d.label}: ${d.value}`} style={{ width: "72%", maxWidth: 34, height: `${(d.value / max) * 100}%`, minHeight: 3, background: color, borderRadius: "6px 6px 3px 3px", transition: "height .5s cubic-bezier(.4,0,.2,1)" }} />
          <span style={{ font: "500 9.5px/12px var(--font-sans)", color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Progress row ─────────────────────────────────────────────────────────────
export function ProgressRow({ label, current, target, unit }: { label: string; current: number; target: number; unit?: string }) {
  const pct = Math.min(100, Math.round((current / (target || 1)) * 100));
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", font: "500 12px/16px var(--font-sans)", color: "var(--ink)", marginBottom: 5 }}>
        <span>{label}</span><span style={{ color: "var(--ink-soft)" }}>{unit ?? ""}{current.toLocaleString("en-US")} / {unit ?? ""}{target.toLocaleString("en-US")} · {pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "var(--subtle)", overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: "var(--indigo-600)", borderRadius: 999, transition: "width .6s" }} /></div>
    </div>
  );
}

// ── Simple table ─────────────────────────────────────────────────────────────
export function MiniTable<T>({ cols, rows, render }: { cols: string[]; rows: T[]; render: (r: T) => ReactNode[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr style={{ textAlign: "left" }}>{cols.map((c) => <th key={c} style={{ position: "sticky", top: 0, background: "var(--card)", padding: "6px 8px", font: "600 10px/14px var(--font-sans)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-faint)", borderBottom: "1px solid var(--line-soft)" }}>{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i} className="dash-row">{render(r).map((cell, j) => <td key={j} style={{ padding: "8px 8px", font: "400 12px/17px var(--font-sans)", color: "var(--ink)", borderBottom: "1px solid var(--line-soft)", whiteSpace: "nowrap" }}>{cell}</td>)}</tr>)}</tbody>
    </table>
  );
}

export function Pill({ text, tone }: { text: string; tone: "green" | "amber" | "red" | "indigo" | "grey" }) {
  return <span className={`pill pill-${tone}`}>{text}</span>;
}

// ── Live data hooks ──────────────────────────────────────────────────────────
type Student = { id: string; full_name: string | null; destination_country: string | null; plan: string | null; created_at: string; plan_status: string | null };
type Payment = { id: string; user_id: string; plan: string; amount: number; method: string; status: string; created_at: string };

export type OverviewData = ReturnType<typeof useOverviewData>;
export function useOverviewData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, destination_country, plan, created_at, plan_status").order("created_at", { ascending: false }).limit(500);
    setStudents((data ?? []) as Student[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  return useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const active = students.filter((s) => s.plan_status === "active");
    const byCountry: Record<string, number> = {};
    active.forEach((s) => { if (s.destination_country) byCountry[s.destination_country] = (byCountry[s.destination_country] ?? 0) + 1; });
    const countryDist = Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ label: countryByCode(c)?.name ?? c, value: v }));
    return {
      loading,
      totalStudents: students.length,
      activeStudents: active.length,
      newToday: students.filter((s) => new Date(s.created_at) >= today).length,
      countryDist: countryDist.length ? countryDist : [{ label: "No country data", value: 1 }],
      recent: students.slice(0, 12),
      // signal-shaped stubs for widgets without a dedicated source yet
      journey: [
        { label: "Account", value: students.length },
        { label: "Profile", value: Math.round(students.length * 0.72) },
        { label: "Docs", value: Math.round(students.length * 0.5) },
        { label: "Applied", value: Math.round(students.length * 0.32) },
        { label: "Admitted", value: Math.round(students.length * 0.18) },
        { label: "Arrived", value: Math.round(students.length * 0.08) },
      ],
      weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, i) => ({ label, value: students.filter((s) => new Date(s.created_at).getDay() === ((i + 1) % 7)).length })),
    };
  }, [students, loading]);
}

export type WalletData = ReturnType<typeof useWalletData>;
export function useWalletData() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [active, setActive] = useState<{ plan: string | null }[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [countryOf, setCountryOf] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data: pay } = await supabase.from("payments").select("id, user_id, plan, amount, method, status, created_at").order("created_at", { ascending: false }).limit(400);
      const rows = (pay ?? []) as Payment[];
      setPayments(rows);
      const { data: profs } = await supabase.from("profiles").select("id, full_name, plan, destination_country").eq("plan_status", "active");
      setActive((profs ?? []).map((p) => ({ plan: (p as { plan: string | null }).plan })));
      const nm: Record<string, string> = {};
      const co: Record<string, string> = {};
      (profs ?? []).forEach((p) => { const r = p as { id: string; full_name: string | null; destination_country: string | null }; nm[r.id] = r.full_name ?? "—"; if (r.destination_country) co[r.id] = r.destination_country; });
      setNames(nm); setCountryOf(co);
      setLoading(false);
    })();
  }, []);

  return useMemo(() => {
    const approved = payments.filter((p) => p.status === "approved");
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const byMethod: Record<string, number> = {};
    approved.forEach((p) => { byMethod[p.method] = (byMethod[p.method] ?? 0) + 1; });
    const byCountryRev: Record<string, number> = {};
    approved.forEach((p) => { const c = countryOf[p.user_id]; if (c) byCountryRev[c] = (byCountryRev[c] ?? 0) + (p.amount || 0); });
    const revenueByCountry = Object.entries(byCountryRev).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ label: countryByCode(c)?.name ?? c, value: v }));
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); return d; });
    return {
      loading, names,
      totalRevenue: approved.reduce((s, p) => s + (p.amount || 0), 0),
      monthRevenue: approved.filter((p) => new Date(p.created_at) >= monthStart).reduce((s, p) => s + (p.amount || 0), 0),
      pending: payments.filter((p) => p.status === "under_review").length,
      successful: approved.length,
      failed: payments.filter((p) => p.status === "rejected").length,
      subDist: [
        { label: "Self Service", value: active.filter((a) => a.plan === "self_service").length },
        { label: "Full Service", value: active.filter((a) => a.plan === "full_service").length },
      ],
      methodDist: Object.entries(byMethod).map(([m, v]) => ({ label: m, value: v })),
      revenueByCountry,
      revenueSeries: months.map((d) => ({ label: d.toLocaleString("en-US", { month: "short" }), value: approved.filter((p) => { const c = new Date(p.created_at); return c.getMonth() === d.getMonth() && c.getFullYear() === d.getFullYear(); }).reduce((s, p) => s + (p.amount || 0), 0) })),
      recent: payments.slice(0, 12),
      pendingRows: payments.filter((p) => p.status === "under_review").slice(0, 8),
    };
  }, [payments, active, names, countryOf, loading]);
}

export { PALETTE, planById };
