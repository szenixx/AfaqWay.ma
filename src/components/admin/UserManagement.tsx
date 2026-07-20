"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { planById } from "@/lib/plans";

type U = { id: string; user_number: number | null; full_name: string | null; email: string | null; city: string | null; plan: string | null; banned: boolean; whatsapp_country_code: string | null; whatsapp_number: string | null; destination_country: string | null };

const base = { height: 32, minWidth: 64, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 12px", borderRadius: 9, cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", textDecoration: "none", boxSizing: "border-box" } as const;
const btnGhost = { ...base, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" };
const btnBlue = { ...base, border: "1px solid var(--indigo-line)", background: "var(--indigo-tint)", color: "var(--indigo-text)" };
const btnRed = { ...base, border: "1px solid var(--red-line)", background: "var(--red-tint)", color: "var(--red)" };
const awu = (n: number | null) => "AWU-" + String(n ?? 0).padStart(3, "0");

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 140, border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-card)" }}>
      <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{icon}</span>
      <div>
        <div style={{ font: "700 22px/26px var(--font-sans)", color: "var(--ink)" }}>{value}</div>
        <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{label}</div>
      </div>
    </div>
  );
}
const sIcon = (d: React.ReactNode) => <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;

const planLabel = (p: string | null) => p === "full_service" ? "Full Service" : p === "self_service" ? "Self Service" : "—";

export default function UserManagement({ initialPlan, initialCountry, title, onOpenChat }: { initialPlan?: "self_service" | "full_service"; initialCountry?: string; title?: string; onOpenChat?: (userId: string) => void } = {}) {
  const planLock = initialPlan ?? null;
  const countryLock = initialCountry ?? null;
  const [rows, setRows] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<U | null>(null);
  const [track, setTrack] = useState<U | null>(null);
  const [countryFilter, setCountryFilter] = useState<"all" | string>(initialCountry ?? "all");
  const [confirm, setConfirm] = useState<{ title: string; body: string; tone: "orange" | "red"; onYes: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, user_number, full_name, email, city, plan, banned, whatsapp_country_code, whatsapp_number, destination_country").eq("plan_status", "active").order("plan_activated_at", { ascending: false });
    setRows((data ?? []) as U[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const stats = useMemo(() => {
    const byCountry: Record<string, number> = {};
    rows.forEach((r) => { const c = r.destination_country || "—"; byCountry[c] = (byCountry[c] ?? 0) + 1; });
    return { total: rows.length, countries: Object.keys(byCountry).filter((c) => c !== "—").length, banned: rows.filter((r) => r.banned).length, byCountry };
  }, [rows]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      (!planLock || r.plan === planLock)
      && (countryFilter === "all" || r.destination_country === countryFilter)
      && (!q || (r.full_name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q)));
  }, [rows, query, countryFilter, planLock]);

  async function patch(id: string, p: Record<string, unknown>) { await supabase.from("profiles").update(p).eq("id", id); void load(); }
  async function saveEdit() {
    if (!edit) return;
    await supabase.from("profiles").update({ full_name: edit.full_name, city: edit.city, whatsapp_number: edit.whatsapp_number }).eq("id", edit.id);
    setEdit(null); void load();
  }

  function exportExcel() {
    const head = ["Name", "ID", "Email", "Plan", "Amount paid", "City", "Chosen country"];
    const body = rows.map((r) => [
      r.full_name ?? "", awu(r.user_number), r.email ?? "", planLabel(r.plan),
      planById(r.plan) ? `${planById(r.plan)!.price} DH` : "", r.city ?? "",
      r.destination_country ? (countryByCode(r.destination_country)?.name ?? r.destination_country) : "",
    ]);
    const csv = [head, ...body].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `afaqway-paid-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{title ?? "Users management"}</h1>
        {!planLock && (
          <button type="button" onClick={exportExcel} disabled={rows.length === 0} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: rows.length ? "pointer" : "not-allowed", opacity: rows.length ? 1 : 0.5, font: "600 13px/1 var(--font-sans)", color: "var(--ink)" }}>
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15v2h12v-2" /></svg>
            Export Excel
          </button>
        )}
      </div>
      {!planLock && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <Stat label="Paid users" value={stats.total} icon={sIcon(<><circle cx="10" cy="7" r="3" /><path d="M4 16c0-3 2.7-5 6-5s6 2 6 5" /></>)} />
            <Stat label="Countries picked" value={stats.countries} icon={sIcon(<><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2 2.4 2 11.6 0 14M10 3c-2 2.4-2 11.6 0 14" /></>)} />
            <Stat label="Banned" value={stats.banned} icon={sIcon(<><circle cx="10" cy="10" r="7" /><path d="M5 5l10 10" /></>)} />
          </div>
          {Object.keys(stats.byCountry).length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {Object.entries(stats.byCountry).sort((a, b) => b[1] - a[1]).map(([c, n]) => (
                <span key={c} className="pill pill-grey">{c === "—" ? "No country" : (countryByCode(c)?.name ?? c)}: {n}</span>
              ))}
            </div>
          )}
        </>
      )}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        {!countryLock && (
          <select className="af" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} style={{ height: 40, maxWidth: 200 }}>
            <option value="all">All countries</option>
            {COUNTRIES.filter((c) => c.available).map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        )}
        <input className="af" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email" style={{ flex: "1 1 240px", maxWidth: 360 }} />
      </div>

      {loading ? <p style={{ color: "var(--ink-faint)", font: "400 14px var(--font-sans)" }}>Loading…</p> : list.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 12, padding: 28, textAlign: "center", color: "var(--ink-soft)", font: "400 14px/21px var(--font-sans)" }}>No paid users yet. They appear here once a payment is approved.</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ textAlign: "left", font: "600 11px/15px var(--font-sans)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
                {["ID", "Name", "Email", "Country", "Plan", "City", "Controls"].map((h) => <th key={h} style={{ padding: "12px 14px", borderBottom: "1px solid var(--line-soft)" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink)", opacity: u.banned ? 0.55 : 1 }}>
                  <td style={{ ...td, font: "600 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{awu(u.user_number)}</td>
                  <td style={td}>{u.full_name || "—"}{u.banned && <span className="pill pill-red" style={{ marginLeft: 6 }}>Banned</span>}</td>
                  <td style={td}>{u.email || "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{u.destination_country ? (countryByCode(u.destination_country)?.name ?? u.destination_country) : "—"}</td>
                  <td style={td}>
                    <select className="af" value={u.plan ?? ""} onChange={(e) => { const v = e.target.value; setConfirm({ title: "Change this user's plan?", body: "Only change a plan if the user has actually paid for it. Changing a plan the user hasn't paid for is not allowed.", tone: "orange", onYes: () => { void patch(u.id, { plan: v }); setConfirm(null); } }); }} style={{ height: 34, padding: "0 8px", minWidth: 130 }}>
                      <option value="self_service">Self Service</option>
                      <option value="full_service">Full Service</option>
                    </select>
                  </td>
                  <td style={td}>{u.city || "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => setTrack(u)} style={btnGhost}>Track</button>
                      <button type="button" onClick={() => setEdit(u)} style={btnBlue}>Edit</button>
                      {onOpenChat && <button type="button" onClick={() => onOpenChat(u.id)} style={btnBlue}>Chat</button>}
                      <a href={u.email ? `mailto:${u.email}` : undefined} style={btnGhost}>Email</a>
                      <button type="button" onClick={() => setConfirm({ title: u.banned ? "Unban this user?" : "Ban this user?", body: u.banned ? "They will regain access to their workspace." : "They will lose access to their workspace until you unban them.", tone: "red", onYes: () => { void patch(u.id, { banned: !u.banned }); setConfirm(null); } })} style={btnRed}>{u.banned ? "Unban" : "Ban"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {edit && (
        <Modal title="Edit user" onClose={() => setEdit(null)} onSave={saveEdit}>
          <label style={lbl}>Full name<input className="af" value={edit.full_name ?? ""} onChange={(e) => setEdit({ ...edit, full_name: e.target.value })} /></label>
          <label style={lbl}>City<input className="af" value={edit.city ?? ""} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></label>
          <label style={lbl}>WhatsApp number<input className="af" value={edit.whatsapp_number ?? ""} onChange={(e) => setEdit({ ...edit, whatsapp_number: e.target.value })} /></label>
        </Modal>
      )}
      {track && (
        <Modal title={`${track.full_name || "User"} · steps`} onClose={() => setTrack(null)}>
          <div style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink)" }}>
            <Row k="Profile ID" v={awu(track.user_number)} />
            <Row k="Email" v={track.email ?? "—"} />
            <Row k="Plan" v={planLabel(track.plan)} />
            <Row k="Destination" v={track.destination_country ?? "—"} />
            <Row k="City" v={track.city ?? "—"} />
            <Row k="WhatsApp" v={`${track.whatsapp_country_code ?? ""} ${track.whatsapp_number ?? ""}`.trim() || "—"} />
          </div>
          <div style={{ marginTop: 14, font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", background: "var(--subtle)", borderRadius: 10, padding: "10px 12px" }}>The full application roadmap tracker is coming next.</div>
        </Modal>
      )}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "var(--card)", border: `1px solid ${confirm.tone === "orange" ? "var(--amber-line)" : "var(--red-line)"}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", overflow: "hidden" }}>
            <div style={{ background: confirm.tone === "orange" ? "var(--amber-tint)" : "var(--red-tint)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={confirm.tone === "orange" ? "var(--amber)" : "var(--red)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 2 17h16L10 3z" /><path d="M10 8v4M10 14.5v.5" /></svg>
              <span style={{ font: "700 15px/20px var(--font-sans)", color: confirm.tone === "orange" ? "var(--amber)" : "var(--red)" }}>{confirm.title}</span>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{confirm.body}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setConfirm(null)} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "var(--ink)" }}>Cancel</button>
                <button type="button" onClick={confirm.onYes} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: confirm.tone === "orange" ? "var(--amber)" : "var(--red)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "#fff" }}>Yes, continue</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}><span style={{ color: "var(--ink-soft)" }}>{k}</span><span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span></div>;
}

function Modal({ title, children, onClose, onSave }: { title: string; children: React.ReactNode; onClose: () => void; onSave?: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", padding: 24 }}>
        <h2 style={{ font: "700 18px/24px var(--font-sans)", color: "var(--ink)", margin: "0 0 16px" }}>{title}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--ink)" }}>{onSave ? "Cancel" : "Close"}</button>
          {onSave && <button type="button" onClick={onSave} style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--indigo-600)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "#fff" }}>Save</button>}
        </div>
      </div>
    </div>
  );
}

const td = { padding: "12px 14px", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle" } as const;
const lbl = { display: "flex", flexDirection: "column", gap: 6, font: "500 13px/18px var(--font-sans)", color: "var(--ink)" } as const;
