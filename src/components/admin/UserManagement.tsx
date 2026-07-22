"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Ban, Download, TriangleAlert, Eye, Pencil, MessageCircle, Mail, GraduationCap, Search, Check, X, Users as UsersIcon, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { planById } from "@/lib/plans";
import { PROGRAMS } from "@/lib/programs/catalog";

type U = { id: string; user_number: number | null; full_name: string | null; email: string | null; city: string | null; plan: string | null; banned: boolean; whatsapp_country_code: string | null; whatsapp_number: string | null; destination_country: string | null };
type AdminProgram = { name: string; university: string; price: string; source: "catalog" | "custom" };

const awu = (n: number | null) => "AWU-" + String(n ?? 0).padStart(3, "0");

// Colored stat card (matches the /overview + /wallet dashboard icon style).
function Stat({ label, value, tone, tint, icon }: { label: string; value: number; tone: string; tint: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: "1 1 0", minWidth: 140, border: "1px solid var(--line)", borderTop: `3px solid ${tone}`, borderRadius: 18, background: "var(--card)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "var(--shadow-card)" }}>
      <span style={{ width: 38, height: 38, borderRadius: 14, background: tint, color: tone, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{icon}</span>
      <div>
        <div style={{ font: "700 22px/26px var(--font-sans)", color: tone }}>{value}</div>
        <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{label}</div>
      </div>
    </div>
  );
}

// Compact icon control button.
const ctrl = { width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink-soft)", cursor: "pointer", textDecoration: "none", flex: "none" } as const;
const ctrlBlue = { ...ctrl, border: "1px solid var(--indigo-line)", background: "var(--indigo-tint)", color: "var(--indigo-text)" };
const ctrlRed = { ...ctrl, border: "1px solid var(--red-line)", background: "var(--red-tint)", color: "var(--red)" };

const planLabel = (p: string | null) => p === "full_service" ? "Full Service" : p === "self_service" ? "Self Service" : "—";

export default function UserManagement({ initialPlan, initialCountry, title, onOpenChat }: { initialPlan?: "self_service" | "full_service"; initialCountry?: string; title?: string; onOpenChat?: (userId: string) => void } = {}) {
  const planLock = initialPlan ?? null;
  const countryLock = initialCountry ?? null;
  const [rows, setRows] = useState<U[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [edit, setEdit] = useState<U | null>(null);
  const [track, setTrack] = useState<U | null>(null);
  const [program, setProgram] = useState<U | null>(null);
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
          <button type="button" onClick={exportExcel} disabled={rows.length === 0} style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 38, padding: "0 14px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: rows.length ? "pointer" : "not-allowed", opacity: rows.length ? 1 : 0.5, font: "600 13px/1 var(--font-sans)", color: "var(--ink)" }}>
            <Download size={15} />
            Export Excel
          </button>
        )}
      </div>
      {!planLock && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <Stat label="Paid users" value={stats.total} tone="var(--indigo-600)" tint="var(--indigo-tint)" icon={<UsersIcon size={19} />} />
            <Stat label="Countries picked" value={stats.countries} tone="var(--green)" tint="var(--green-tint)" icon={<Globe size={19} />} />
            <Stat label="Banned" value={stats.banned} tone="var(--red)" tint="var(--red-tint)" icon={<Ban size={19} />} />
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
        <div style={{ border: "1px dashed var(--line)", borderRadius: 16, padding: 28, textAlign: "center", color: "var(--ink-soft)", font: "400 14px/21px var(--font-sans)" }}>No paid users yet. They appear here once a payment is approved.</div>
      ) : (
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 18, background: "var(--card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ textAlign: "left", font: "600 11px/15px var(--font-sans)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
                {["ID", "Name", "Email", "Country", "Plan", "City", "Controls"].map((h) => <th key={h} style={{ padding: "9px 12px", borderBottom: "1px solid var(--line-soft)" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink)", opacity: u.banned ? 0.55 : 1 }}>
                  <td style={{ ...td, font: "600 12px/16px var(--font-sans)", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>{awu(u.user_number)}</td>
                  <td style={td}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {u.full_name || "—"}
                      {u.banned && <span className="pill pill-red" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Ban size={11} />Banned</span>}
                    </span>
                  </td>
                  <td style={td}>{u.email || "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{u.destination_country ? (countryByCode(u.destination_country)?.name ?? u.destination_country) : "—"}</td>
                  <td style={td}>
                    <select className="af" value={u.plan ?? ""} onChange={(e) => { const v = e.target.value; setConfirm({ title: "Change this user's plan?", body: "Only change a plan if the user has actually paid for it. Changing a plan the user hasn't paid for is not allowed.", tone: "orange", onYes: () => { void patch(u.id, { plan: v }); setConfirm(null); } }); }} style={{ height: 32, padding: "0 8px", minWidth: 122 }}>
                      <option value="self_service">Self Service</option>
                      <option value="full_service">Full Service</option>
                    </select>
                  </td>
                  <td style={td}>{u.city || "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button type="button" title="Track" onClick={() => setTrack(u)} style={ctrl}><Eye size={16} /></button>
                      <button type="button" title="Edit details" onClick={() => setEdit(u)} style={ctrlBlue}><Pencil size={16} /></button>
                      <button type="button" title="Change program / major" onClick={() => setProgram(u)} style={ctrlBlue}><GraduationCap size={16} /></button>
                      {onOpenChat && <button type="button" title="Chat" onClick={() => onOpenChat(u.id)} style={ctrlBlue}><MessageCircle size={16} /></button>}
                      <a title="Email" href={u.email ? `mailto:${u.email}` : undefined} style={ctrl}><Mail size={16} /></a>
                      <button type="button" title={u.banned ? "Unban" : "Ban"} onClick={() => setConfirm({ title: u.banned ? "Unban this user?" : "Ban this user?", body: u.banned ? "They will regain access to their workspace." : "They will lose access to their workspace until you unban them.", tone: "red", onYes: () => { void patch(u.id, { banned: !u.banned }); setConfirm(null); } })} style={ctrlRed}><Ban size={16} /></button>
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
          <div style={{ marginTop: 14, font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", background: "var(--subtle)", borderRadius: 14, padding: "10px 12px" }}>The full application roadmap tracker is coming next.</div>
        </Modal>
      )}
      {program && <ProgramModal user={program} onClose={() => setProgram(null)} onSaved={() => { setProgram(null); }} />}
      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "var(--card)", border: `1px solid ${confirm.tone === "orange" ? "var(--amber-line)" : "var(--red-line)"}`, borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", overflow: "hidden" }}>
            <div style={{ background: confirm.tone === "orange" ? "var(--amber-tint)" : "var(--red-tint)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <TriangleAlert size={20} />
              <span style={{ font: "700 15px/20px var(--font-sans)", color: confirm.tone === "orange" ? "var(--amber)" : "var(--red)" }}>{confirm.title}</span>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{confirm.body}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setConfirm(null)} style={{ height: 40, padding: "0 16px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "var(--ink)" }}>Cancel</button>
                <button type="button" onClick={confirm.onYes} style={{ height: 40, padding: "0 16px", borderRadius: 14, border: "none", background: confirm.tone === "orange" ? "var(--amber)" : "var(--red)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "#fff" }}>Yes, continue</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Program change: browse the real programs dataset (like onboarding) OR add a
   custom program name + price. Saved onto the user's profile so it shows in their
   Settings/Profile. Sent as a change requested by the user's field request. */
function ProgramModal({ user, onClose, onSaved }: { user: { id: string; full_name: string | null }; onClose: () => void; onSaved: () => void }) {
  const [tab, setTab] = useState<"browse" | "custom">("browse");
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [customName, setCustomName] = useState("");
  const [customUni, setCustomUni] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PROGRAMS.filter((p) => !s || `${p.name} ${p.university} ${p.field}`.toLowerCase().includes(s)).slice(0, 40);
  }, [q]);

  const canSave = tab === "browse" ? picked !== null : (customName.trim().length > 1 && customPrice.trim().length > 0);

  async function save() {
    let data: AdminProgram | null = null;
    if (tab === "browse" && picked !== null) {
      const p = PROGRAMS.find((x) => x.id === picked);
      if (p) data = { name: p.name, university: p.university, price: p.tuition_eur ? `${p.tuition_eur} €/yr` : "—", source: "catalog" };
    } else if (tab === "custom") {
      data = { name: customName.trim(), university: customUni.trim(), price: customPrice.trim(), source: "custom" };
    }
    if (!data) return;
    setSaving(true);
    const { data: cur } = await supabase.from("profiles").select("country_flow_answers").eq("id", user.id).maybeSingle();
    const cfa = ((cur?.country_flow_answers as Record<string, unknown>) ?? {});
    cfa.admin_program = data;
    await supabase.from("profiles").update({ country_flow_answers: cfa }).eq("id", user.id);
    setSaving(false); setSaved(true);
    setTimeout(onSaved, 900);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 65, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 560, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", padding: 22, display: "flex", flexDirection: "column", maxHeight: "88vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <h2 style={{ font: "700 18px/24px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Change program</h2>
            <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{user.full_name || "User"} · pick from the data or add a custom one</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ ...ctrl, cursor: "pointer" }}><X size={16} /></button>
        </div>

        <div style={{ display: "flex", gap: 6, background: "var(--subtle)", borderRadius: 12, padding: 4, margin: "14px 0" }}>
          {(["browse", "custom"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{ flex: 1, height: 34, borderRadius: 9, border: "none", cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--indigo-600)" : "var(--ink-soft)", boxShadow: tab === t ? "var(--shadow-card)" : "none" }}>{t === "browse" ? "Browse programs" : "Add custom"}</button>
          ))}
        </div>

        {tab === "browse" ? (
          <>
            <div style={{ position: "relative", marginBottom: 10 }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }}><Search size={16} /></span>
              <input className="af" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search program, university or field" style={{ width: "100%", paddingLeft: 36 }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto", border: "1px solid var(--line-soft)", borderRadius: 12, minHeight: 180 }}>
              {results.map((p) => (
                <button key={p.id} type="button" onClick={() => setPicked(p.id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", border: "none", borderBottom: "1px solid var(--line-soft)", background: picked === p.id ? "var(--indigo-tint)" : "transparent", cursor: "pointer" }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><GraduationCap size={15} /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", font: "600 13px/17px var(--font-sans)", color: "var(--ink)" }}>{p.name}</span>
                    <span style={{ display: "block", font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.university} · {p.degree} · {p.tuition_eur ? `${p.tuition_eur} €/yr` : "—"}</span>
                  </span>
                  {picked === p.id && <Check size={16} color="var(--indigo-600)" />}
                </button>
              ))}
              {results.length === 0 && <div style={{ padding: 16, font: "400 13px var(--font-sans)", color: "var(--ink-faint)", textAlign: "center" }}>No matching programs.</div>}
            </div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={lbl}>Program name<input className="af" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. MSc Data Science" /></label>
            <label style={lbl}>University (optional)<input className="af" value={customUni} onChange={(e) => setCustomUni(e.target.value)} placeholder="e.g. Vilnius University" /></label>
            <label style={lbl}>Tuition price<input className="af" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="e.g. 4000 €/yr" /></label>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 16 }}>
          {saved && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "600 12.5px/1 var(--font-sans)", color: "var(--green)" }}><Check size={15} />Saved to the user</span>}
          <button type="button" onClick={onClose} style={{ height: 42, padding: "0 18px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--ink)" }}>Cancel</button>
          <button type="button" onClick={save} disabled={!canSave || saving} style={{ height: 42, padding: "0 18px", borderRadius: 14, border: "none", background: "var(--indigo-600)", cursor: canSave && !saving ? "pointer" : "not-allowed", opacity: canSave && !saving ? 1 : 0.5, font: "600 14px/1 var(--font-sans)", color: "#fff" }}>{saving ? "Saving…" : "Save program"}</button>
        </div>
      </div>
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
          <button type="button" onClick={onClose} style={{ height: 42, padding: "0 18px", borderRadius: 14, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "var(--ink)" }}>{onSave ? "Cancel" : "Close"}</button>
          {onSave && <button type="button" onClick={onSave} style={{ height: 42, padding: "0 18px", borderRadius: 14, border: "none", background: "var(--indigo-600)", cursor: "pointer", font: "600 14px/1 var(--font-sans)", color: "#fff" }}>Save</button>}
        </div>
      </div>
    </div>
  );
}

const td = { padding: "9px 12px", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle" } as const;
const lbl = { display: "flex", flexDirection: "column", gap: 6, font: "500 13px/18px var(--font-sans)", color: "var(--ink)" } as const;
