"use client";

import { DashCard, StatCard, Donut, Bars, MiniTable, ProgressRow, Pill, ACCENTS, useWalletData } from "@/components/admin/dashboard/kit";
import { methodById } from "@/lib/plans";

const i = (d: React.ReactNode) => <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const dh = (n: number) => `${Math.round(n).toLocaleString("en-US")} DH`;

export default function WalletGrid() {
  const d = useWalletData();
  return (
    <div className="dash-grid wa-grid">
      <div className="span4">
        <div className="dash-stats-row">
          <StatCard label="Total revenue" value={d.totalRevenue} suffix=" DH" loading={d.loading} accent={ACCENTS[0]} icon={i(<><path d="M10 3v14M6 6h5a2.5 2.5 0 0 1 0 5H6h6" /></>)} delta={14} />
          <StatCard label="This month" value={d.monthRevenue} suffix=" DH" loading={d.loading} accent={ACCENTS[1]} icon={i(<><rect x="3" y="5" width="14" height="12" rx="2" /><path d="M3 9h14M7 3v3M13 3v3" /></>)} delta={9} />
          <StatCard label="Pending" value={d.pending} loading={d.loading} accent={ACCENTS[3]} icon={i(<><circle cx="10" cy="10" r="7" /><path d="M10 6v4l3 2" /></>)} />
          <StatCard label="Successful" value={d.successful} loading={d.loading} accent={ACCENTS[5]} icon={i(<><circle cx="10" cy="10" r="7" /><path d="M7 10l2 2 4-4" /></>)} delta={6} />
          <StatCard label="Failed" value={d.failed} loading={d.loading} accent="#F03E3E" icon={i(<><circle cx="10" cy="10" r="7" /><path d="M7.5 7.5l5 5M12.5 7.5l-5 5" /></>)} />
          <StatCard label="Paying users" value={d.subDist.reduce((s, x) => s + x.value, 0)} loading={d.loading} accent={ACCENTS[4]} icon={i(<><circle cx="10" cy="7" r="3" /><path d="M4 16c0-3 2.7-5 6-5s6 2 6 5" /></>)} />
        </div>
      </div>

      {/* Top content row */}
      <DashCard style={{ gridColumn: "1 / 3", gridRow: 2 }} title="Revenue Analytics" subtitle="Approved revenue, last 6 months">
        <Bars data={d.revenueSeries} />
      </DashCard>
      <DashCard style={{ gridColumn: 3, gridRow: 2 }} title="Revenue by Country" subtitle="Per destination">
        <Donut data={d.revenueByCountry.length ? d.revenueByCountry : [{ label: "No data", value: 1 }]} />
      </DashCard>
      <DashCard style={{ gridColumn: 4, gridRow: 2 }} title="Payment Methods" subtitle="Approved by method">
        <Donut data={d.methodDist.length ? d.methodDist : [{ label: "No data", value: 1 }]} />
      </DashCard>

      {/* Recent Transactions — tall on the left */}
      <DashCard style={{ gridColumn: "1 / 3", gridRow: "3 / 5" }} title="Recent Transactions" subtitle="Latest payments" bodyScroll>
        <MiniTable
          cols={["Student", "Plan", "Amount", "Method", "Status"]}
          rows={d.recent}
          render={(p) => [
            d.names[p.user_id] ?? "—",
            p.plan === "full_service" ? "Full" : "Self",
            dh(p.amount || 0),
            methodById(p.method)?.name ?? p.method,
            <Pill key="s" tone={p.status === "approved" ? "green" : p.status === "rejected" ? "red" : p.status === "under_review" ? "amber" : "grey"} text={p.status === "under_review" ? "Review" : p.status.charAt(0).toUpperCase() + p.status.slice(1)} />,
          ]}
        />
      </DashCard>

      {/* BIG — Pending Payment Reviews (tall) */}
      <DashCard style={{ gridColumn: 3, gridRow: "3 / 5" }} title="Pending Payment Reviews" subtitle="Receipts awaiting verification" bodyScroll>
        {d.pendingRows.length === 0 ? <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-faint)", padding: "8px 0" }}>Nothing pending.</div> : d.pendingRows.map((p, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line-soft)" }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, flex: "none", background: "var(--amber-tint)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px/1 var(--font-sans)" }}>{(d.names[p.user_id] ?? "?").charAt(0).toUpperCase()}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.names[p.user_id] ?? "—"}</div><div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{dh(p.amount || 0)} · {methodById(p.method)?.name ?? p.method}</div></div>
            <Pill tone="amber" text="Verify" />
          </div>
        ))}
      </DashCard>

      {/* BIG — Revenue Goals + key figures (tall) */}
      <DashCard style={{ gridColumn: 4, gridRow: "3 / 5" }} title="Revenue Goals" subtitle="Progress & key figures" bodyScroll>
        <ProgressRow label="Monthly target" current={d.monthRevenue} target={Math.max(20000, d.monthRevenue * 1.4)} unit="" />
        <ProgressRow label="Quarterly target" current={d.totalRevenue} target={Math.max(60000, d.totalRevenue * 1.3)} unit="" />
        <ProgressRow label="Paying users" current={d.subDist.reduce((s, x) => s + x.value, 0)} target={Math.max(50, d.subDist.reduce((s, x) => s + x.value, 0) * 2)} />
        <div style={{ borderTop: "1px solid var(--line-soft)", marginTop: 8, paddingTop: 8 }}>
          {[["Average order value", dh(d.successful ? d.totalRevenue / d.successful : 0)], ["Success rate", `${d.successful + d.failed ? Math.round((d.successful / (d.successful + d.failed)) * 100) : 0}%`], ["Refund rate", "0%"], ["Full / Self users", `${d.subDist[1]?.value ?? 0} / ${d.subDist[0]?.value ?? 0}`]].map(([l, v], k) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line-soft)", font: "500 12.5px/17px var(--font-sans)", color: "var(--ink)" }}><span style={{ color: "var(--ink-soft)" }}>{l}</span><b>{v}</b></div>
          ))}
        </div>
      </DashCard>
    </div>
  );
}
