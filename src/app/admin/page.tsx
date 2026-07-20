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
import AdminChat from "@/components/admin/AdminChat";
import { Flag } from "@/components/ds";
import { countryByCode } from "@/components/profile-setup/countries";
import { notify, requestNotify } from "@/lib/notify";

type Page = { id: string; label: string; superOnly?: boolean };
const PAGES: Page[] = [
  { id: "dashboard", label: "Dashboard", superOnly: true },
  { id: "admins", label: "Admin Management", superOnly: true },
  { id: "reviews", label: "Payment Reviews", superOnly: true },
  { id: "methods", label: "Payment Methods", superOnly: true },
  { id: "users", label: "Users Management" },
];
// Per-country control groups (A2). Add a country = add one entry here.
const COUNTRY_GROUPS: { code: string; pages: Page[] }[] = [
  { code: "LT", pages: [{ id: "full", label: "Full Service Users" }, { id: "self", label: "Self Service Users" }] },
];
const ALL_SUB_PAGES = COUNTRY_GROUPS.flatMap((g) => g.pages);

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

type Report = { id: string; type: string; title: string; body: string | null; target_page: string | null; target_id: string | null; read: boolean; created_at: string };
type BanUser = { id: string; full_name: string | null; email: string | null; user_number: number | null; city: string | null; banned: boolean };

function ReportBox({ version, onGo, onChanged }: { version: number; onGo: (p: string, targetId?: string | null) => void; onChanged: () => void }) {
  const [rows, setRows] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [banPanel, setBanPanel] = useState<{ reportId: string; user: BanUser } | null>(null);
  const [banConfirming, setBanConfirming] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("admin_reports").select("id, type, title, body, target_page, target_id, read, created_at").order("created_at", { ascending: false }).limit(100);
    setRows((data ?? []) as Report[]); setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load, version]);
  async function mark(id: string) { await supabase.from("admin_reports").update({ read: true }).eq("id", id); onChanged(); void load(); }
  async function markAll() { await supabase.from("admin_reports").update({ read: true }).eq("read", false); onChanged(); void load(); }
  async function check(r: Report) {
    await mark(r.id);
    if (r.type === "ban" && r.target_id) {
      // A5: keep bans in-panel — show the user and let the admin unban here.
      const { data } = await supabase.from("profiles").select("id, full_name, email, user_number, city, banned").eq("id", r.target_id).maybeSingle();
      if (data) { setBanPanel({ reportId: r.id, user: data as BanUser }); return; }
    }
    if (r.target_page) onGo(r.target_page, r.target_id);
  }
  function closeBan() { setBanPanel(null); setBanConfirming(false); }
  async function unban() {
    if (!banPanel) return;
    await supabase.from("profiles").update({ banned: false }).eq("id", banPanel.user.id);
    closeBan(); onChanged(); void load();
  }

  return (
    <div style={{ width: "100%" }}>
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

      {banPanel && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 440, background: "var(--card)", border: "1px solid var(--red-line)", borderRadius: 16, boxShadow: "0 20px 60px rgba(23,35,58,.2)", overflow: "hidden" }}>
            <div style={{ background: "var(--red-tint)", padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <span className="pill pill-red">Banned user</span>
              <span style={{ font: "700 15px/20px var(--font-sans)", color: "var(--red)" }}>{banPanel.user.full_name || "User"}</span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink)" }}>
                <div style={rowSt}><span style={{ color: "var(--ink-soft)" }}>Profile ID</span><b>AWU-{String(banPanel.user.user_number ?? 0).padStart(3, "0")}</b></div>
                <div style={rowSt}><span style={{ color: "var(--ink-soft)" }}>Email</span><b>{banPanel.user.email || "—"}</b></div>
                <div style={rowSt}><span style={{ color: "var(--ink-soft)" }}>City</span><b>{banPanel.user.city || "—"}</b></div>
                <div style={rowSt}><span style={{ color: "var(--ink-soft)" }}>Status</span><b style={{ color: banPanel.user.banned ? "var(--red)" : "var(--green)" }}>{banPanel.user.banned ? "Banned" : "Active"}</b></div>
              </div>
              {banConfirming ? (
                <div style={{ marginTop: 18, background: "var(--amber-tint)", border: "1px solid var(--amber-line)", borderRadius: 12, padding: 14 }}>
                  <div style={{ font: "600 13.5px/20px var(--font-sans)", color: "var(--ink)" }}>Are you sure you want to unban this user?</div>
                  <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-soft)", marginTop: 2 }}>They will immediately regain access to their workspace and messaging.</div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                    <button type="button" onClick={() => setBanConfirming(false)} style={{ height: 38, padding: "0 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)" }}>No, keep banned</button>
                    <button type="button" onClick={unban} style={{ height: 38, padding: "0 14px", borderRadius: 10, border: "none", background: "var(--green)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "#fff" }}>Yes, unban</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                  <button type="button" onClick={closeBan} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "var(--ink)" }}>Close</button>
                  {banPanel.user.banned && <button type="button" onClick={() => setBanConfirming(true)} style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "var(--green)", cursor: "pointer", font: "600 13.5px/1 var(--font-sans)", color: "#fff" }}>Unban user</button>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const rowSt = { display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" } as const;

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "gate" | "ready">("loading");
  const [role, setRole] = useState<AdminRole>(null);
  const [email, setEmail] = useState("");
  const [page, setPage] = useState("reviews");
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [reportVersion, setReportVersion] = useState(0);
  const [chatUser, setChatUser] = useState<string | null>(null);
  const [highlightPayment, setHighlightPayment] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ LT: true });
  const [chatUnread, setChatUnread] = useState(false);
  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; if (page === "chat") setChatUnread(false); }, [page]);

  const refreshUnread = useCallback(async () => {
    const { count } = await supabase.from("admin_reports").select("id", { count: "exact", head: true }).eq("read", false);
    setUnread(count ?? 0);
  }, []);

  const goFromReport = useCallback((p: string, targetId?: string | null) => {
    if (p === "reviews" && targetId) setHighlightPayment(targetId);
    setPage(p);
    void refreshUnread();
  }, [refreshUnread]);
  const openChat = useCallback((userId: string) => { setChatUser(userId); setPage("chat"); }, []);

  useEffect(() => {
    if (status !== "ready") return;
    void refreshUnread();
    requestNotify();
    const ch = supabase.channel("admin-reports")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_reports" }, (payload) => {
        const rep = payload.new as { title?: string; body?: string };
        setUnread((u) => u + 1);
        setReportVersion((v) => v + 1);
        notify(rep.title ?? "New report", rep.body ?? "");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as { sender?: string };
        if (m.sender === "user" && pageRef.current !== "chat") setChatUnread(true);
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
  const cls = (on: boolean, extra = "") => `adm-item${on ? " active" : ""}${extra ? " " + extra : ""}`;
  const lbl = (t: string) => collapsed ? undefined : t;

  return (
    <div className="adm-root">
      <div className="adm-bg" aria-hidden><span><LogoMark size={800} /></span></div>
      <div className="adm-shell">
        <aside className="adm-sidebar" style={{ width: collapsed ? 76 : 258 }}>
          <span className="adm-sidebar-logo" aria-hidden><LogoMark size={150} /></span>
          {/* Workspace switcher */}
          <div className="adm-ws" style={{ justifyContent: collapsed ? "center" : "space-between" }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
                <span className="adm-ws-badge"><LogoMark size={22} /></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ font: "700 15px/18px var(--font-sans)", color: "var(--ink)" }}>AfaqWay</div>
                  <div style={{ font: "600 9.5px/14px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--indigo-600)", marginTop: 2 }}>{isSuper ? "Super admin" : "Admin"}</div>
                </div>
              </div>
            )}
            <button type="button" className="adm-collapse-btn" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{collapsed ? <path d="M7 5l5 5-5 5" /> : <path d="M13 5l-5 5 5 5" />}</svg>
            </button>
          </div>

          <nav className="adm-nav">
            {!collapsed && <div className="adm-group-label">Workspace</div>}
            {pages.map((p) => (
              <button key={p.id} type="button" onClick={() => p.id === "dashboard" ? router.push("/admin/dashboard/overview") : setPage(p.id)} title={lbl(p.label)} className={cls(p.id === page)}>
                <span className="adm-item-ico">{PAGE_ICONS[p.id]}</span>{!collapsed && p.label}
              </button>
            ))}
            {COUNTRY_GROUPS.map((g) => {
              const c = countryByCode(g.code);
              const open = openGroups[g.code];
              const active = g.pages.some((p) => p.id === page);
              return (
                <div key={g.code}>
                  <button type="button" onClick={() => { if (collapsed) { setCollapsed(false); setOpenGroups((o) => ({ ...o, [g.code]: true })); } else setOpenGroups((o) => ({ ...o, [g.code]: !o[g.code] })); }} title={lbl(`${c?.name} control`)} className={cls(active && !open)} style={{ justifyContent: collapsed ? "center" : "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                      {c ? <Flag stripes={c.stripes} size="sm" /> : null}{!collapsed && <span>{c?.name} control</span>}
                    </span>
                    {!collapsed && <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 140ms" }}><path d="M7 5l5 5-5 5" /></svg>}
                  </button>
                  {open && !collapsed && g.pages.map((p) => (
                    <button key={p.id} type="button" onClick={() => setPage(p.id)} className={cls(p.id === page, "sub")}>
                      <span className="adm-item-ico">{PAGE_ICONS[p.id]}</span>{p.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Footer group: Reports + Messages */}
          <div className="adm-foot">
            <button type="button" onClick={() => setPage("reports")} title={lbl("Reports")} className={cls(page === "reports")}>
              <span className="adm-item-ico" style={{ position: "relative" }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a4 4 0 0 0-4 4v3l-1.5 3h11L14 10V7a4 4 0 0 0-4-4z" /><path d="M8.5 16a1.5 1.5 0 0 0 3 0" /></svg>
                {unread > 0 && <span style={{ position: "absolute", top: -6, right: -8, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--red)", color: "#fff", font: "700 9.5px/16px var(--font-sans)", textAlign: "center" }}>{unread > 9 ? "9+" : unread}</span>}
              </span>
              {!collapsed && "Reports"}
            </button>
            <button type="button" onClick={() => setPage("chat")} title={lbl("Messages")} className={cls(page === "chat")}>
              <span className="adm-item-ico" style={{ position: "relative" }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8l-4 3V6a1 1 0 0 1 1-1z" /></svg>
                {chatUnread && <span style={{ position: "absolute", top: -3, right: -3, width: 9, height: 9, borderRadius: 999, background: "var(--red)", border: "2px solid #fff" }} />}
              </span>
              {!collapsed && "Messages"}
              {chatUnread && !collapsed && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: 999, background: "var(--red)" }} />}
            </button>
          </div>

          {/* Footer group: account + logout */}
          <div className="adm-foot">
            {!collapsed && <div style={{ font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)", padding: "2px 12px 4px", wordBreak: "break-all" }}>{email}</div>}
            <button type="button" onClick={() => logout(router)} title={lbl("Log out")} className={cls(false, "danger")}>
              <span className="adm-item-ico"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M13 14v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v2M9 10h8m0 0-3-3m3 3-3 3" /></svg></span>
              {!collapsed && "Log out"}
            </button>
          </div>
        </aside>

        <main className="adm-main">
          {page === "reviews" ? <PaymentReviews highlightId={highlightPayment} onHighlightDone={() => setHighlightPayment(null)} />
            : page === "admins" ? <AdminManagement />
            : page === "methods" ? <PaymentMethodsAdmin />
            : page === "users" ? <UserManagement onOpenChat={openChat} />
            : page === "full" ? <UserManagement initialPlan="full_service" initialCountry="LT" title="Full Service users — Lithuania" onOpenChat={openChat} />
            : page === "self" ? <UserManagement initialPlan="self_service" initialCountry="LT" title="Self Service users — Lithuania" onOpenChat={openChat} />
            : page === "reports" ? <ReportBox version={reportVersion} onGo={goFromReport} onChanged={refreshUnread} />
            : page === "chat" ? <AdminChat initialUserId={chatUser} />
            : <Placeholder title={[...PAGES, ...ALL_SUB_PAGES].find((p) => p.id === page)?.label ?? page} />}
        </main>
      </div>
    </div>
  );
}
