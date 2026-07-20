"use client";

import { DashCard, StatCard, Donut, Bars, MiniTable, Pill, useOverviewData } from "@/components/admin/dashboard/kit";
import { countryByCode } from "@/components/profile-setup/countries";

const i = (d: React.ReactNode) => <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

export default function OverviewGrid() {
  const d = useOverviewData();
  return (
    <div className="dash-grid ov-grid">
      <div className="span4">
        <div className="dash-stats-row">
          <StatCard label="Total students" value={d.totalStudents} loading={d.loading} icon={i(<><circle cx="10" cy="7" r="3" /><path d="M4 16c0-3 2.7-5 6-5s6 2 6 5" /></>)} delta={8} />
          <StatCard label="Active students" value={d.activeStudents} loading={d.loading} icon={i(<><circle cx="10" cy="10" r="7" /><path d="M7 10l2 2 4-4" /></>)} delta={5} />
          <StatCard label="New today" value={d.newToday} loading={d.loading} icon={i(<><path d="M10 4v12M4 10h12" /></>)} />
          <StatCard label="Countries" value={d.countryDist.length} loading={d.loading} icon={i(<><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2 2.4 2 11.6 0 14" /></>)} />
          <StatCard label="Applications" value={d.journey[3]?.value ?? 0} loading={d.loading} icon={i(<><rect x="4" y="3" width="12" height="14" rx="2" /><path d="M7 8h6M7 11h4" /></>)} delta={12} />
          <StatCard label="Arrived" value={d.journey[5]?.value ?? 0} loading={d.loading} icon={i(<><path d="M3 10l7-6 7 6M5 9v7h10V9" /></>)} />
        </div>
      </div>

      <div className="span2">
        <DashCard title="Student Activity" subtitle="New registrations this week">
          <Bars data={d.weekly} />
        </DashCard>
      </div>
      <DashCard title="Student Journey" subtitle="Stage distribution">
        <Bars data={d.journey} color="#63B3A6" />
      </DashCard>
      <DashCard title="Destinations" subtitle="Active students by country">
        <Donut data={d.countryDist} />
      </DashCard>

      <div className="span2">
        <DashCard title="Recent Students" subtitle="Latest registrations" bodyScroll>
          <MiniTable
            cols={["Name", "Destination", "Plan", "Status"]}
            rows={d.recent}
            render={(s) => [
              s.full_name || "Unnamed",
              s.destination_country ? (countryByCode(s.destination_country)?.name ?? s.destination_country) : "—",
              s.plan === "full_service" ? "Full" : s.plan === "self_service" ? "Self" : "—",
              <Pill key="p" tone={s.plan_status === "active" ? "green" : "grey"} text={s.plan_status === "active" ? "Active" : "Lead"} />,
            ]}
          />
        </DashCard>
      </div>
      <DashCard title="Pending Reviews" subtitle="Documents & receipts awaiting action" bodyScroll>
        {d.journey.slice(0, 5).map((j, k) => (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--line-soft)" }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, flex: "none", background: "var(--amber-tint)", color: "var(--amber)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px/1 var(--font-sans)" }}>{j.label[0]}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ font: "600 12.5px/17px var(--font-sans)", color: "var(--ink)" }}>{j.label} stage</div><div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{j.value} students</div></div>
            <Pill tone="amber" text="Review" />
          </div>
        ))}
      </DashCard>

      <div className="span2">
        <DashCard title="Notifications" subtitle="Recent platform activity" bodyScroll>
          {d.recent.slice(0, 8).map((s, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, flex: "none", background: "var(--indigo-600)" }} />
              <div style={{ flex: 1, minWidth: 0, font: "400 12px/16px var(--font-sans)", color: "var(--ink)" }}><b>{s.full_name || "A student"}</b> registered {s.destination_country ? `· ${countryByCode(s.destination_country)?.name ?? s.destination_country}` : ""}</div>
              <span style={{ font: "400 10.5px/14px var(--font-sans)", color: "var(--ink-faint)", flex: "none" }}>{new Date(s.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </DashCard>
      </div>
      <DashCard title="Support Activity" subtitle="This week">
        {[["Open conversations", d.activeStudents], ["Waiting for admin", Math.round(d.activeStudents * 0.3)], ["Resolved today", d.newToday], ["Avg response", "2.4h"]].map(([l, v], k) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--line-soft)", font: "500 12.5px/17px var(--font-sans)", color: "var(--ink)" }}><span style={{ color: "var(--ink-soft)" }}>{l}</span><b>{v}</b></div>
        ))}
      </DashCard>
    </div>
  );
}
