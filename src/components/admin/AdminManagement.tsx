"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Admin = { id: string; email: string; role: string; name: string | null; phone: string | null; describe_role: string | null; banned: boolean; must_reset_pw: boolean; created_at: string };
type Form = { id?: string; name: string; email: string; phone: string; role: string; describe_role: string };
const EMPTY: Form = { name: "", email: "", phone: "", role: "admin", describe_role: "" };
const MASTER_EMAIL = "index.abde06@gmail.com"; // primary super-admin — no one can act on this console

const base = { height: 34, minWidth: 78, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 12px", borderRadius: 9, cursor: "pointer", font: "600 12.5px/1 var(--font-sans)", boxSizing: "border-box" } as const;
const btnPrimary = { ...base, border: "none", background: "var(--indigo-600)", color: "#fff" };
const btnGhost = { ...base, border: "1px solid var(--line)", background: "var(--card)", color: "var(--ink)" };
const btnRedGhost = { ...base, border: "1px solid var(--red-line)", background: "var(--red-tint)", color: "var(--red)" };

export default function AdminManagement() {
  const [rows, setRows] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirm, setConfirm] = useState<{ title: string; body: string; onYes: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admins").select("id, email, role, name, phone, describe_role, banned, must_reset_pw, created_at").order("created_at", { ascending: true });
    setRows((data ?? []) as Admin[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!form) return;
    if (!form.email.trim()) { setErr("Email is required."); return; }
    setSaving(true); setErr("");
    const { data: { user } } = await supabase.auth.getUser();
    const payload = { email: form.email.trim().toLowerCase(), name: form.name.trim() || null, phone: form.phone.trim() || null, role: form.role, describe_role: form.describe_role.trim() || null };
    const res = form.id
      ? await supabase.from("admins").update(payload).eq("id", form.id)
      : await supabase.from("admins").insert({ ...payload, added_by: user?.id });
    setSaving(false);
    if (res.error) { setErr(res.error.message); return; }
    setForm(null); void load();
  }
  async function patch(id: string, p: Record<string, unknown>) { await supabase.from("admins").update(p).eq("id", id); void load(); }
  async function removeNow(id: string) { await supabase.from("admins").delete().eq("id", id); void load(); }
  const openForm = (a: Admin) => setForm({ id: a.id, name: a.name ?? "", email: a.email, phone: a.phone ?? "", role: a.role, describe_role: a.describe_role ?? "" });
  const askBan = (a: Admin) => setConfirm({ title: a.banned ? "Unban this admin?" : "Ban this admin?", body: a.banned ? "They will regain access to the workspace." : "They will lose access to the workspace until you unban them.", onYes: () => { void patch(a.id, { banned: !a.banned }); setConfirm(null); } });
  const askForce = (a: Admin) => setConfirm({ title: a.must_reset_pw ? "Cancel forced reset?" : "Force password reset?", body: a.must_reset_pw ? "They will no longer be asked to reset their password." : "They will be asked to set a new password on their next login.", onYes: () => { void patch(a.id, { must_reset_pw: !a.must_reset_pw }); setConfirm(null); } });
  const askRemove = (a: Admin) => setConfirm({ title: "Remove this admin?", body: "They will immediately lose access to the workspace. This can't be undone.", onYes: () => { void removeNow(a.id); setConfirm(null); } });

  function renderTable(title: string, list: Admin[]) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", marginBottom: 8 }}>{title} <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>({list.length})</span></div>
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14, background: "var(--card)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ textAlign: "left", font: "600 11px/15px var(--font-sans)", letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-faint)" }}>
                {["Admin ID", "Full name", "Email", "Number", "Role", "Describe role", "Control"].map((h) => <th key={h} style={{ padding: "12px 14px", borderBottom: "1px solid var(--line-soft)" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? <tr><td colSpan={7} style={{ ...td, color: "var(--ink-faint)" }}>None yet.</td></tr> : list.map((a) => (
                <tr key={a.id} style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink)", opacity: a.banned ? 0.55 : 1 }}>
                  <td style={td}>{a.id.slice(0, 8)}</td>
                  <td style={td}>{a.name || "—"}</td>
                  <td style={td}>{a.email}</td>
                  <td style={td}>{a.phone || "—"}</td>
                  <td style={td}><span className={a.role === "superadmin" ? "pill pill-indigo" : "pill pill-grey"}>{a.role}</span>{a.must_reset_pw && <span className="pill pill-amber" style={{ marginLeft: 6 }}>reset pw</span>}</td>
                  <td style={{ ...td, maxWidth: 240 }}><span style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)" }}>{a.describe_role || "—"}</span></td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>
                    {a.email === MASTER_EMAIL ? <span style={{ color: "var(--ink-faint)" }}>—</span> : (
                      <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
                        <button type="button" onClick={() => openForm(a)} style={{ ...btnGhost, minWidth: 74, width: 74, border: "1px solid var(--indigo-line)", background: "var(--indigo-tint)", color: "var(--indigo-text)" }}>Edit</button>
                        <button type="button" onClick={() => askBan(a)} style={{ ...btnGhost, minWidth: 74, width: 74 }}>{a.banned ? "Unban" : "Ban"}</button>
                        <button type="button" onClick={() => askForce(a)} style={{ ...btnGhost, minWidth: 74, width: 74 }}>Reset</button>
                        <button type="button" onClick={() => askRemove(a)} style={{ ...btnRedGhost, minWidth: 74, width: 74 }}>Remove</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
        <div>
          <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Admin management</h1>
          <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", margin: "2px 0 0" }}>Add and manage the admins who drive student applications. A new admin gets access by signing up with the email you register here.</p>
        </div>
        <button type="button" onClick={() => setForm(EMPTY)} style={{ ...btnPrimary, height: 42, padding: "0 18px", font: "600 14px/1 var(--font-sans)" }}>+ Add admin</button>
      </div>

      {loading ? <p style={{ color: "var(--ink-faint)", font: "400 14px var(--font-sans)", marginTop: 20 }}>Loading…</p> : (
        <>
          {renderTable("Super admins", rows.filter((a) => a.role === "superadmin"))}
          {renderTable("Admins", rows.filter((a) => a.role !== "superadmin"))}
        </>
      )}

      {confirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "var(--card)", border: "1px solid var(--red-line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", overflow: "hidden" }}>
            <div style={{ background: "var(--red-tint)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--red)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3 2 17h16L10 3z" /><path d="M10 8v4M10 14.5v.5" /></svg>
              <span style={{ font: "700 15px/20px var(--font-sans)", color: "var(--red)" }}>{confirm.title}</span>
            </div>
            <div style={{ padding: 20 }}>
              <p style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink)", margin: 0 }}>{confirm.body}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setConfirm(null)} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "var(--ink)" }}>Cancel</button>
                <button type="button" onClick={confirm.onYes} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--red)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "#fff" }}>Yes, continue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {form && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 440, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", padding: 24 }}>
            <h2 style={{ font: "700 18px/24px var(--font-sans)", color: "var(--ink)", margin: "0 0 16px" }}>{form.id ? "Edit admin" : "Add admin"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={lbl}>Full name<input className="af" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></label>
              <label style={lbl}>Email (login)<input className="af" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@email.com" /></label>
              <label style={lbl}>Phone number<input className="af" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" /></label>
              <label style={lbl}>Role
                <select className="af" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="admin">Admin</option><option value="superadmin">Super admin</option></select>
              </label>
              <label style={lbl}>Describe role <span style={{ color: "var(--ink-faint)", fontWeight: 400 }}>(keywords)</span>
                <input className="af" value={form.describe_role} onChange={(e) => setForm({ ...form, describe_role: e.target.value })} placeholder="e.g. reviews documents, drives Full Service files" />
              </label>
            </div>
            {err && <div style={{ font: "500 13px/18px var(--font-sans)", color: "var(--red)", marginTop: 10 }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => { setForm(null); setErr(""); }} style={{ ...btnGhost, height: 42, padding: "0 18px", font: "600 14px/1 var(--font-sans)" }}>Cancel</button>
              <button type="button" disabled={saving} onClick={save} style={{ ...btnPrimary, height: 42, padding: "0 18px", font: "600 14px/1 var(--font-sans)" }}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const td = { padding: "12px 14px", borderBottom: "1px solid var(--line-soft)", verticalAlign: "middle" } as const;
const lbl = { display: "flex", flexDirection: "column", gap: 6, font: "500 13px/18px var(--font-sans)", color: "var(--ink)" } as const;
