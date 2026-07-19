"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { fetchAdminRole, type AdminRole } from "@/lib/admin";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import PaymentReviews from "@/components/admin/PaymentReviews";
import AdminManagement from "@/components/admin/AdminManagement";
import PaymentMethodsAdmin from "@/components/admin/PaymentMethodsAdmin";
import UserManagement from "@/components/admin/UserManagement";

type Page = { id: string; label: string; superOnly?: boolean };
const PAGES: Page[] = [
  { id: "dashboard", label: "Dashboard", superOnly: true },
  { id: "admins", label: "Admin Management", superOnly: true },
  { id: "reviews", label: "Payment Reviews", superOnly: true },
  { id: "methods", label: "Payment Methods", superOnly: true },
  { id: "users", label: "Users Management" },
  { id: "full", label: "Full Service Users" },
  { id: "self", label: "Self Service Users" },
];

const svg = (d: React.ReactNode) => <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>{d}</svg>;
const PAGE_ICONS: Record<string, React.ReactNode> = {
  dashboard: svg(<><rect x="3" y="3" width="6" height="7" rx="1.5" /><rect x="11" y="3" width="6" height="4" rx="1.5" /><rect x="11" y="10" width="6" height="7" rx="1.5" /><rect x="3" y="13" width="6" height="4" rx="1.5" /></>),
  admins: svg(<><circle cx="7" cy="7" r="3" /><path d="M2 17c0-2.8 2.2-5 5-5s5 2.2 5 5" /><path d="M14 4a3 3 0 0 1 0 6M14 12c2.2 0 4 1.8 4 4" /></>),
  reviews: svg(<><rect x="4" y="3" width="12" height="14" rx="2" /><path d="M7 8h6M7 11h6M7 14h3" /></>),
  methods: svg(<><rect x="3" y="5" width="14" height="10" rx="2" /><path d="M3 9h14" /></>),
  users: svg(<><circle cx="10" cy="7" r="3" /><path d="M4 16c0-3 2.7-5 6-5s6 2 6 5" /></>),
  full: svg(<><path d="M3 7l3 2.5L10 4l4 5.5L17 7l-1 8H4L3 7z" /></>),
  self: svg(<><path d="M10 3l6.5 3.2v6.6L10 16l-6.5-3.2V6.2L10 3z" /><path d="M3.5 6.5 10 9.7l6.5-3.2M10 9.7V16.5" /></>),
};

async function logout(router: ReturnType<typeof useRouter>) {
  await supabase.auth.signOut();
  router.replace("/signup");
}

function PasscodeGate({ onPass, onLogout }: { onPass: () => void; onLogout: () => void }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  async function submit(code: string) {
    setChecking(true); setErr("");
    const { data, error } = await supabase.functions.invoke("admin-gate", { body: { code } });
    setChecking(false);
    if (!error && (data as { ok?: boolean })?.ok) onPass();
    else { setErr("Wrong passcode. Try again."); setDigits(["", "", "", ""]); refs[0].current?.focus(); }
  }
  function setDigit(i: number, raw: string) {
    const v = raw.replace(/\D/g, "").slice(-1);
    const next = [...digits]; next[i] = v; setDigits(next);
    if (v && i < 3) refs[i + 1].current?.focus();
    if (next.every((d) => d !== "")) void submit(next.join(""));
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "var(--paper)", position: "relative", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, backdropFilter: "blur(3px)", background: "radial-gradient(var(--indigo-tint), transparent 60%)", opacity: 0.6 }} />
      <div style={{ position: "relative", width: "100%", maxWidth: 380, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.18)", padding: 32, textAlign: "center" }}>
        <span style={{ width: 52, height: 52, borderRadius: 999, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9" width="12" height="8" rx="2" /><path d="M7 9V6a3 3 0 0 1 6 0v3" /></svg>
        </span>
        <h1 style={{ font: "700 20px/26px var(--font-sans)", color: "var(--ink)", margin: "16px 0 4px" }}>Super-admin access</h1>
        <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", margin: "0 0 22px" }}>Enter your 4-digit passcode to continue.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          {digits.map((d, i) => (
            <input key={i} ref={refs[i]} value={d} inputMode="numeric" maxLength={1} autoFocus={i === 0}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !digits[i] && i > 0) refs[i - 1].current?.focus(); }}
              style={{ width: 56, height: 64, textAlign: "center", font: "700 26px/1 var(--font-sans)", color: "var(--ink)", borderRadius: 12, border: "1px solid var(--line)", background: "var(--subtle)", outlineColor: "var(--indigo-600)" }} />
          ))}
        </div>
        <div style={{ height: 20, marginTop: 12, font: "500 13px/20px var(--font-sans)", color: err ? "var(--red)" : "var(--ink-faint)" }}>{checking ? "Checking…" : err}</div>
        <button type="button" onClick={onLogout} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink-faint)" }}>Log out</button>
      </div>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div>
      <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: "0 0 4px" }}>{title}</h1>
      <p style={{ font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)", margin: "0 0 24px" }}>This page is part of the admin workspace and is coming next.</p>
      <div style={{ border: "1px dashed var(--line)", borderRadius: 12, padding: 40, textAlign: "center", color: "var(--ink-faint)", font: "500 14px/21px var(--font-sans)" }}>Coming soon</div>
    </div>
  );
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.36);
    o.onended = () => ctx.close();
  } catch { /* audio blocked until first interaction */ }
}

type Report = { id: string; type: string; title: string; body: string | null; target_page: string | null; read: boolean; created_at: string };

function ReportBox({ version, onGo, onChanged }: { version: number; onGo: (p: string) => void; onChanged: () => void }) {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_reports").select("id, type, title, body, target_page, read, created_at").order("created_at", { ascending: false }).limit(100);
    setRows((data ?? []) as Report[]); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load, version]);
  async function mark(id: string) { await supabase.from("admin_reports").update({ read: true }).eq("id", id); onChanged(); void load(); }
  async function markAll() { await supabase.from("admin_reports").update({ read: true }).eq("read", false); onChanged(); void load(); }
  async function check(r: Report) { await mark(r.id); if (r.target_page) onGo(r.target_page); }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Reports</h1>
        <button type="button" onClick={markAll} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)" }}>Mark all read</button>
      </div>
      {loading ? <p style={{ color: "var(--ink-faint)", font: "400 14px var(--font-sans)" }}>Loading…</p> : rows.length === 0 ? (
        <div style={{ border: "1px dashed var(--line)", borderRadius: 12, padding: 28, textAlign: "center", color: "var(--ink-soft)", font: "400 14px/21px var(--font-sans)" }}>No reports yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid var(--line)", borderRadius: 12, background: r.read ? "var(--card)" : "var(--indigo-tint)", padding: 14 }}>
              {!r.read && <span aria-hidden style={{ flex: "none", width: 8, height: 8, borderRadius: 999, background: "var(--indigo-600)", marginTop: 6 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className={r.type === "ban" ? "pill pill-red" : "pill pill-indigo"}>{r.type.replace("_", " ")}</span>
                  <span style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>{r.title}</span>
                </div>
                {r.body && <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4 }}>{r.body}</div>}
                <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 4 }}>{new Date(r.created_at).toLocaleString()}</div>
              </div>
              {r.target_page && (
                <button type="button" onClick={() => check(r)} title="Go to the related page" style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 9, border: "none", background: "var(--indigo-600)", color: "#fff", cursor: "pointer", font: "600 12.5px/1 var(--font-sans)" }}>
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 10.5 8.5 14.5 15.5 6" /></svg>Check
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatWireframe() {
  const [emailOn, setEmailOn] = useState(false);
  const [pinOn, setPinOn] = useState(false);
  const [filter, setFilter] = useState<"full" | "self">("full");
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  async function send() {
    if (!msg.trim()) return;
    if (!emailOn) { setStatus("Posted to chat (wireframe — live messaging is next)."); setMsg(""); return; }
    setSending(true); setStatus("");
    const { data, error } = await supabase.functions.invoke("send-update", { body: { plan: filter === "full" ? "full_service" : "self_service", subject: "Update from AfaqWay", message: msg } });
    setSending(false);
    if (error) setStatus("Email failed: " + error.message);
    else { setStatus(`Emailed ${(data as { sent?: number })?.sent ?? 0} ${filter === "full" ? "Full Service" : "Self Service"} user(s).`); setMsg(""); }
  }
  const opt = (on: boolean): CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 9, cursor: "pointer", font: "600 12px/1 var(--font-sans)", border: on ? "1px solid var(--indigo-line)" : "1px solid var(--line)", background: on ? "var(--indigo-tint)" : "var(--card)", color: on ? "var(--indigo-text)" : "var(--ink-soft)" });
  return (
    <div>
      <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: "0 0 4px" }}>Messages</h1>
      <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", margin: "0 0 18px" }}>Send updates to students. Turning on <b>Email</b> also mails it (updates@afaqway.com); <b>Pin</b> keeps it as the last update at the top of their chat. Wireframe — live messaging + email are wired next.</p>
      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr) 260px", gap: 0, height: 560, border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "var(--card)" }}>

        {/* LEFT: search + filter + conversations */}
        <div style={{ borderRight: "1px solid var(--line-soft)", padding: 12, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <input className="af" placeholder="Search conversations" />
          <div style={{ display: "inline-flex", background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 9, padding: 3 }}>
            {(["full", "self"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{ flex: 1, height: 30, borderRadius: 7, border: "none", cursor: "pointer", font: "600 11.5px/1 var(--font-sans)", background: filter === f ? "var(--card)" : "transparent", color: filter === f ? "var(--ink)" : "var(--ink-soft)" }}>{f === "full" ? "Full Service" : "Self Service"}</button>
            ))}
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: 10, borderRadius: 10, background: i === 1 ? "var(--indigo-tint)" : "transparent", cursor: "pointer" }}>
              <span style={{ width: 34, height: 34, borderRadius: 999, background: "var(--subtle)", flex: "none" }} />
              <div style={{ flex: 1 }}><div style={{ height: 9, width: "60%", background: "var(--subtle)", borderRadius: 999 }} /><div style={{ height: 8, width: "85%", background: "var(--subtle)", borderRadius: 999, marginTop: 6 }} /></div>
            </div>
          ))}
        </div>

        {/* CENTER: thread + message bar with options */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
            <div style={{ alignSelf: "flex-start", maxWidth: "72%", background: "var(--subtle)", borderRadius: 12, padding: "10px 14px", font: "400 13px/19px var(--font-sans)", color: "var(--ink)" }}>Hi, I uploaded my passport page.</div>
            <div style={{ alignSelf: "flex-end", maxWidth: "72%", background: "var(--indigo-tint)", borderRadius: 12, padding: "10px 14px", font: "400 13px/19px var(--font-sans)", color: "var(--ink)" }}>Great, we&apos;re reviewing it now.</div>
            <div style={{ alignSelf: "flex-start", maxWidth: "72%", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
              <div style={{ font: "600 12px/16px var(--font-sans)", color: "var(--ink)", marginBottom: 8 }}>Which intake do you prefer?</div>
              {["Autumn 2027", "Autumn 2028"].map((a, i) => <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 12px", marginBottom: 6, font: "500 12.5px/18px var(--font-sans)", color: "var(--ink)", cursor: "pointer" }}>{i + 1}. {a}</div>)}
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line-soft)", padding: 12 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <button type="button" onClick={() => setEmailOn((v) => !v)} style={opt(emailOn)}><span style={{ width: 7, height: 7, borderRadius: 999, background: emailOn ? "var(--green)" : "var(--ink-faint)" }} />Email</button>
              <button type="button" onClick={() => setPinOn((v) => !v)} style={opt(pinOn)}><span style={{ width: 7, height: 7, borderRadius: 999, background: pinOn ? "var(--indigo-600)" : "var(--ink-faint)" }} />Pin as last update</button>
              <button type="button" style={opt(false)}>Upload file</button>
              <button type="button" style={opt(false)}>Interactive question</button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="af" placeholder={emailOn ? `Write an update to email all ${filter === "full" ? "Full" : "Self"} Service users…` : "Write an update…"} value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} style={{ flex: 1 }} />
              <button type="button" disabled={sending || !msg.trim()} onClick={send} style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 14px/1 var(--font-sans)", cursor: sending || !msg.trim() ? "not-allowed" : "pointer", opacity: sending || !msg.trim() ? 0.5 : 1 }}>{sending ? "Sending…" : emailOn ? "Send & email" : "Send"}</button>
            </div>
            {status && <div style={{ font: "500 12.5px/18px var(--font-sans)", color: status.startsWith("Email failed") ? "var(--red)" : "var(--green)", marginTop: 8 }}>{status}</div>}
          </div>
        </div>

        {/* RIGHT: last important updates (pinned / emailed) */}
        <div style={{ borderLeft: "1px solid var(--line-soft)", padding: 12, overflowY: "auto" }}>
          <div style={{ font: "600 11px/15px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>Last updates</div>
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 8, background: "var(--card)" }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}><span className="pill pill-indigo">Pinned</span><span className="pill pill-green">Emailed</span></div>
              <div style={{ height: 8, width: "90%", background: "var(--subtle)", borderRadius: 999 }} /><div style={{ height: 8, width: "70%", background: "var(--subtle)", borderRadius: 999, marginTop: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "gate" | "ready">("loading");
  const [role, setRole] = useState<AdminRole>(null);
  const [email, setEmail] = useState("");
  const [page, setPage] = useState("reviews");
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [reportVersion, setReportVersion] = useState(0);

  const refreshUnread = useCallback(async () => {
    const { count } = await supabase.from("admin_reports").select("id", { count: "exact", head: true }).eq("read", false);
    setUnread(count ?? 0);
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    void refreshUnread();
    if (typeof Notification !== "undefined" && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    const ch = supabase.channel("admin-reports")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_reports" }, (payload) => {
        const rep = payload.new as { title?: string; body?: string };
        playBeep();
        setUnread((u) => u + 1);
        setReportVersion((v) => v + 1);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") { try { new Notification(rep.title ?? "New report", { body: rep.body ?? "" }); } catch { /* ignore */ } }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [status, refreshUnread]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/signup"); return; }
      const { role } = await fetchAdminRole(user.email);
      if (cancelled) return;
      if (!role) { router.replace("/dashboard"); return; }
      setRole(role); setEmail(user.email ?? "");
      setPage(role === "superadmin" ? "reviews" : "users");
      if (role === "superadmin" && (typeof window === "undefined" || sessionStorage.getItem("af_admin_gate") !== "ok")) setStatus("gate");
      else setStatus("ready");
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (status === "loading") {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--paper)", color: "var(--ink-faint)", font: "400 15px var(--font-sans)" }}>Loading…</div>;
  }
  if (status === "gate") {
    return <PasscodeGate onPass={() => { sessionStorage.setItem("af_admin_gate", "ok"); setStatus("ready"); }} onLogout={() => logout(router)} />;
  }

  const isSuper = role === "superadmin";
  const pages = PAGES.filter((p) => isSuper || !p.superOnly);
  const navBtn = (on: boolean): CSSProperties => ({ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start", textAlign: "left", padding: collapsed ? "11px 0" : "10px 14px", borderRadius: 10, border: "none", borderLeft: `2px solid ${on ? "var(--indigo-600)" : "transparent"}`, background: on ? "var(--indigo-tint)" : "transparent", color: on ? "var(--indigo-text)" : "var(--ink)", cursor: "pointer", font: "600 13.5px/20px var(--font-sans)", width: "100%" });

  return (
    <div style={{ minHeight: "100vh", position: "relative", display: "flex", background: "url(/hero-ambient.webp) center/cover fixed no-repeat" }}>
      {/* Sidebar */}
      <aside style={{ zIndex: 1, width: collapsed ? 68 : 248, flex: "none", background: "rgba(255,255,255,.82)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh", transition: "width 160ms cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ padding: collapsed ? "18px 0 12px" : "18px 16px 12px", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 8, borderBottom: "1px solid var(--line-soft)" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <LogoMark size={26} />
              <div>
                <div style={{ font: "700 16px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</div>
                <div style={{ font: "600 9.5px/14px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--indigo-600)", marginTop: 3 }}>{isSuper ? "Super admin" : "Admin"}</div>
              </div>
            </div>
          )}
          <button type="button" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--subtle)", color: "var(--ink-soft)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{collapsed ? <path d="M7 5l5 5-5 5" /> : <path d="M13 5l-5 5 5 5" />}</svg>
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 2 }}>
          {pages.map((p) => (
            <button key={p.id} type="button" onClick={() => setPage(p.id)} title={collapsed ? p.label : undefined} style={navBtn(p.id === page)}>
              {PAGE_ICONS[p.id]}{!collapsed && p.label}
            </button>
          ))}
        </nav>

        {/* Report + Chat boxes */}
        <div style={{ padding: 10, borderTop: "1px solid var(--line-soft)", display: "flex", flexDirection: "column", gap: 2 }}>
          <button type="button" onClick={() => setPage("reports")} title={collapsed ? "Reports" : undefined} style={navBtn(page === "reports")}>
            <span style={{ position: "relative", display: "flex" }}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a4 4 0 0 0-4 4v3l-1.5 3h11L14 10V7a4 4 0 0 0-4-4z" /><path d="M8.5 16a1.5 1.5 0 0 0 3 0" /></svg>
              {unread > 0 && <span style={{ position: "absolute", top: -6, right: -8, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--red)", color: "#fff", font: "700 9.5px/16px var(--font-sans)", textAlign: "center" }}>{unread > 9 ? "9+" : unread}</span>}
            </span>
            {!collapsed && "Reports"}
          </button>
          <button type="button" onClick={() => setPage("chat")} title={collapsed ? "Messages" : undefined} style={navBtn(page === "chat")}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1z" /></svg>
            {!collapsed && "Messages"}
          </button>
        </div>

        <div style={{ padding: 10, borderTop: "1px solid var(--line-soft)" }}>
          {!collapsed && <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)", padding: "0 14px 8px", wordBreak: "break-all" }}>{email}</div>}
          <button type="button" onClick={() => logout(router)} title={collapsed ? "Log out" : undefined} style={{ ...navBtn(false), color: "var(--red)" }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M13 14v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2M9 10h8m0 0-3-3m3 3-3 3" /></svg>
            {!collapsed && "Log out"}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0, padding: "30px 34px", overflowY: "auto" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {page === "reviews" ? <PaymentReviews />
            : page === "admins" ? <AdminManagement />
            : page === "methods" ? <PaymentMethodsAdmin />
            : page === "users" ? <UserManagement />
            : page === "reports" ? <ReportBox version={reportVersion} onGo={(p) => { setPage(p); void refreshUnread(); }} onChanged={refreshUnread} />
            : page === "chat" ? <ChatWireframe />
            : <Placeholder title={PAGES.find((p) => p.id === page)?.label ?? page} />}
        </div>
      </main>
    </div>
  );
}
