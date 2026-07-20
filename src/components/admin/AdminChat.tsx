"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import { Flag } from "@/components/ds";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { notify, requestNotify } from "@/lib/notify";
import { fileUrl } from "@/lib/r2";
import { parseAsk } from "@/lib/chat";

type U = { id: string; full_name: string | null; email: string | null; user_number: number | null; plan: string | null };
type Msg = { id: string; user_id: string; sender: string; body: string; file_path: string | null; file_name: string | null; pinned: boolean; emailed: boolean; created_at: string; reply_to: string | null };

const awu = (n: number | null) => "AWU-" + String(n ?? 0).padStart(3, "0");

export default function AdminChat({ initialUserId }: { initialUserId?: string | null }) {
  const [country, setCountry] = useState<string | null>(initialUserId ? "LT" : null);
  const [users, setUsers] = useState<U[]>([]);
  const [sel, setSel] = useState<string | null>(initialUserId ?? null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "full" | "self">("all");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [emailOn, setEmailOn] = useState(false);
  const [pinOn, setPinOn] = useState(false);
  const [whatsappOn, setWhatsappOn] = useState(false);
  const [showQ, setShowQ] = useState(false);
  const [qText, setQText] = useState("");
  const [qOpts, setQOpts] = useState(["", ""]);
  const [sending, setSending] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; msg: Msg; kind: "msg" | "file" } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [infoProfile, setInfoProfile] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); };
  }, [menu]);

  useEffect(() => { if (initialUserId) { setCountry("LT"); setSel(initialUserId); } }, [initialUserId]);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, user_number, plan").eq("plan_status", "active").order("plan_activated_at", { ascending: false });
    setUsers((data ?? []) as U[]);
  }, []);
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const loadMsgs = useCallback(async (uid: string) => {
    const { data } = await supabase.from("messages").select("id, user_id, sender, body, file_path, file_name, pinned, emailed, created_at, reply_to").eq("user_id", uid).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
  }, []);
  const selRef = useRef<string | null>(sel);
  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { if (sel) void loadMsgs(sel); else setMsgs([]); }, [sel, loadMsgs]);

  // Sound + notification for any incoming student message (B3).
  useEffect(() => {
    requestNotify();
    const ch = supabase.channel("admin-msgs-incoming")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.user_id === selRef.current) void loadMsgs(m.user_id);
        if (m.sender === "user") { notify("New message from a student", m.body?.slice(0, 90) || "Sent a file"); void loadUsers(); }
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadMsgs, loadUsers]);

  const selUser = users.find((u) => u.id === sel) ?? null;
  const shown = users.filter((u) => (filter === "all" || (filter === "full" && u.plan === "full_service") || (filter === "self" && u.plan === "self_service")) && (!q.trim() || `${u.full_name ?? ""} ${u.email ?? ""} ${awu(u.user_number)}`.toLowerCase().includes(q.trim().toLowerCase())));
  const pinned = msgs.filter((m) => m.pinned);
  const files = msgs.filter((m) => m.file_path);

  async function viewFile(path: string | null) { if (!path) return; const url = await fileUrl(path, "update_files"); if (url) window.open(url, "_blank", "noopener"); }
  async function downloadFile(path: string | null, name: string | null) { if (!path) return; const url = await fileUrl(path, "update_files", name ?? undefined); if (url) { const a = document.createElement("a"); a.href = url; a.download = name ?? ""; document.body.appendChild(a); a.click(); a.remove(); } }
  async function togglePin(m: Msg) { await supabase.from("messages").update({ pinned: !m.pinned }).eq("id", m.id); if (sel) void loadMsgs(sel); }
  async function deleteMsg(m: Msg) { await supabase.from("messages").delete().eq("id", m.id); if (sel) void loadMsgs(sel); setMenu(null); }
  async function renameFile(m: Msg) {
    const name = window.prompt("Rename file", m.file_name ?? "");
    setMenu(null);
    if (name && name.trim()) { await supabase.from("messages").update({ file_name: name.trim() }).eq("id", m.id); if (sel) void loadMsgs(sel); }
  }
  async function openInfo() {
    setShowInfo(true); setInfoProfile(null);
    if (!sel) return;
    const { data } = await supabase.from("profiles").select("full_name, email, user_number, plan, plan_status, plan_activated_at, destination_country, city, date_of_birth, whatsapp_country_code, whatsapp_number, onboarding_completed_at").eq("id", sel).maybeSingle();
    setInfoProfile((data ?? null) as Record<string, unknown> | null);
  }
  // Task 2: download ONLY the pinned/important messages, as a roadmap conversation file.
  function downloadConversation() {
    if (!selUser) return;
    const important = msgs.filter((m) => m.pinned);
    const lines = important.map((m) => {
      const who = m.sender === "admin" ? "AfaqWay" : (selUser.full_name || "Student");
      const when = new Date(m.created_at).toLocaleString();
      const file = m.file_path ? `\n   [attachment: ${m.file_name || "file"}]` : "";
      return `[${when}] ${who}:\n   ${m.body || "(no text)"}${file}`;
    });
    const header = `AfaqWay — Roadmap conversation\nStudent: ${selUser.full_name || "—"} (${awu(selUser.user_number)})\nEmail: ${selUser.email || "—"}\nPinned / important messages: ${important.length}\n${"=".repeat(48)}\n\n`;
    const text = header + (lines.join("\n\n") || "No pinned messages in this conversation yet.");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `roadmap-${awu(selUser.user_number)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function send() {
    const hasQ = showQ && qText.trim();
    if ((!body.trim() && !file && !hasQ) || !sel || !selUser) return;
    setSending(true); setStatus("");
    try {
      let finalBody = body.trim();
      if (hasQ) finalBody = "ASK::" + JSON.stringify({ q: qText.trim(), opts: qOpts.filter((o) => o.trim()).map((o) => o.trim()) });
      let file_path: string | null = null, file_name: string | null = null, attachUrl: string | null = null;
      if (file) {
        setUploadingName(file.name);
        const path = `${sel}/${Date.now()}_${file.name.replace(/[^\w.\-]/g, "_")}`;
        const up = await supabase.storage.from("update_files").upload(path, file);
        if (up.error) throw up.error;
        file_path = path; file_name = file.name;
        if (emailOn) { const s = await supabase.storage.from("update_files").createSignedUrl(path, 60 * 60 * 24 * 7); attachUrl = s.data?.signedUrl ?? null; }
      }
      const { data: { user } } = await supabase.auth.getUser();
      const ins = await supabase.from("messages").insert({ user_id: sel, sender: "admin", body: finalBody, file_path, file_name, pinned: pinOn, emailed: emailOn, created_by: user?.id, reply_to: replyTo?.id ?? null });
      if (ins.error) throw ins.error;
      if (emailOn && selUser.email) {
        const { data: mail, error } = await supabase.functions.invoke("send-update", { body: { to_email: selUser.email, to_name: (selUser.full_name ?? "").split(" ")[0], message: finalBody, attachment_url: attachUrl, attachment_name: file_name } });
        const res = (mail ?? {}) as { ok?: boolean; error?: string };
        if (error) setStatus("Sent to chat. Email failed: " + error.message);
        else if (res.ok) setStatus("Sent and emailed");
        else setStatus("Sent to chat. Email failed: " + (res.error ?? "unknown error"));
      } else setStatus("Sent");
      setBody(""); setFile(null); setPinOn(false); setWhatsappOn(false); setShowQ(false); setQText(""); setQOpts(["", ""]); setReplyTo(null);
      void loadMsgs(sel);
    } catch (e) { setStatus("Failed: " + (e instanceof Error ? e.message : "error")); } finally { setSending(false); setUploadingName(null); }
  }

  // ── Country gate (A3) — centered, glass cards ──
  if (!country) {
    const glass: CSSProperties = { background: "rgba(255,255,255,.5)", backdropFilter: "blur(20px) saturate(1.5)", WebkitBackdropFilter: "blur(20px) saturate(1.5)", border: "1px solid rgba(255,255,255,.7)", boxShadow: "0 12px 36px rgba(23,35,58,.14)" };
    return (
      <div style={{ minHeight: "62vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20 }}>
        <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: "0 0 4px" }}>Messages</h1>
        <p style={{ font: "400 14px/21px var(--font-sans)", color: "var(--ink-soft)", margin: "0 0 24px" }}>Which country&apos;s students do you want to message?</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 720 }}>
          {COUNTRIES.map((c) => (
            <button key={c.code} type="button" disabled={!c.available} onClick={() => c.available && setCountry(c.code)}
              style={{ ...glass, width: 210, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "24px 18px", borderRadius: 18, cursor: c.available ? "pointer" : "not-allowed", opacity: c.available ? 1 : 0.5 }}>
              <Flag stripes={c.stripes} size="lg" />
              <span style={{ font: "600 15px/21px var(--font-sans)", color: "var(--ink)" }}>{c.name}</span>
              <span className={c.available ? "pill pill-green" : "pill pill-amber"}>{c.available ? "Available now" : "Coming soon"}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const opt = (on: boolean): CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 11px", borderRadius: 8, cursor: "pointer", font: "600 12px/1 var(--font-sans)", border: on ? "1px solid var(--indigo-line)" : "1px solid var(--line)", background: on ? "var(--indigo-tint)" : "var(--card)", color: on ? "var(--indigo-text)" : "var(--ink-soft)" });
  const actIco: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, cursor: "pointer", color: "var(--ink-soft)", flex: "none" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <h1 style={{ font: "700 24px/30px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Messages</h1>
        <span className="pill pill-grey">{countryByCode(country)?.name}</span>
        <button type="button" onClick={() => { setCountry(null); setSel(null); }} style={{ background: "none", border: "none", cursor: "pointer", font: "600 12px/1 var(--font-sans)", color: "var(--indigo-600)" }}>change</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0,1fr) 250px", height: "calc(100vh - 150px)", minHeight: 460, border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "var(--card)" }}>
        {/* LEFT: search + filter + users */}
        <div style={{ borderRight: "1px solid var(--line-soft)", padding: 12, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", minHeight: 0 }}>
          <input className="af" placeholder="Search name, ID or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <div style={{ display: "inline-flex", background: "var(--subtle)", border: "1px solid var(--line)", borderRadius: 9, padding: 3 }}>
            {(["all", "full", "self"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} style={{ flex: 1, height: 28, borderRadius: 7, border: "none", cursor: "pointer", font: "600 10.5px/1 var(--font-sans)", background: filter === f ? "var(--card)" : "transparent", color: filter === f ? "var(--ink)" : "var(--ink-soft)" }}>{f === "all" ? "All" : f === "full" ? "Full" : "Self"}</button>
            ))}
          </div>
          {shown.length === 0 ? <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-faint)", padding: 8 }}>No users.</div> : shown.map((u) => (
            <button key={u.id} type="button" onClick={() => setSel(u.id)} style={{ textAlign: "left", display: "flex", gap: 10, alignItems: "center", padding: 9, borderRadius: 10, border: "none", background: sel === u.id ? "var(--indigo-tint)" : "transparent", cursor: "pointer" }}>
              <span style={{ width: 34, height: 34, borderRadius: 999, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 13px/1 var(--font-sans)" }}>{(u.full_name || "U").charAt(0).toUpperCase()}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", font: "600 13px/18px var(--font-sans)", color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.full_name || "Unnamed"}</span>
                <span style={{ display: "block", font: "400 11px/15px var(--font-sans)", color: "var(--ink-faint)" }}>{awu(u.user_number)} · {u.plan === "full_service" ? "Full" : "Self"}</span>
              </span>
            </button>
          ))}
        </div>

        {/* CENTER: thread + composer */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
          {!selUser ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-faint)", font: "400 14px var(--font-sans)" }}>Select a conversation.</div>
          ) : (
            <>
              <button type="button" onClick={openInfo} title="View student information" style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "10px 14px", borderBottom: "1px solid var(--line-soft)", border: "none", background: "transparent", cursor: "pointer" }}>
                <span style={{ width: 30, height: 30, borderRadius: 999, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 12px/1 var(--font-sans)" }}>{(selUser.full_name || "U").charAt(0).toUpperCase()}</span>
                <span style={{ font: "600 14px/20px var(--font-sans)", color: "var(--ink)" }}>{selUser.full_name || "Unnamed"} <span style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-faint)" }}>· {selUser.email}</span></span>
                <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="var(--ink-faint)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}><circle cx="10" cy="10" r="7" /><path d="M10 9v4M10 6.5v.5" /></svg>
              </button>
              <div className="stu-chat-texture" style={{ flex: 1, minHeight: 0, padding: 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
                {msgs.length === 0 && <div style={{ color: "var(--ink-faint)", font: "400 13px var(--font-sans)", textAlign: "center", marginTop: 20 }}>No messages yet. Send the first update.</div>}
                {msgs.map((m) => {
                  const mine = m.sender === "admin";
                  const quoted = m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null;
                  const ask = parseAsk(m.body);
                  return (
                    <div key={m.id} style={{ display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "center", gap: 6, alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "90%" }}
                      onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m, kind: "msg" }); }}>
                      <div style={{ minWidth: 0, background: mine ? "var(--indigo-tint)" : "rgba(255,255,255,.94)", border: m.pinned ? "1px solid var(--indigo-line)" : "none", borderRadius: 16, padding: "9px 13px", boxShadow: "0 2px 8px rgba(23,35,58,.06)" }}>
                        {quoted && (
                          <div style={{ borderLeft: "3px solid var(--indigo-600)", background: "rgba(43,76,155,.06)", borderRadius: 6, padding: "4px 8px", marginBottom: 6 }}>
                            <span style={{ display: "block", font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>{quoted.sender === "admin" ? "You" : selUser?.full_name || "Student"}</span>
                            <span style={{ display: "block", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{parseAsk(quoted.body)?.q ?? quoted.body?.slice(0, 60) ?? quoted.file_name ?? "Attachment"}</span>
                          </div>
                        )}
                        {ask ? (
                          <div>
                            <div style={{ font: "600 13px/19px var(--font-sans)", color: "var(--ink)" }}>{ask.q}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 6 }}>
                              {ask.opts.map((o, i) => <div key={i} style={{ border: "1px solid var(--indigo-line)", borderRadius: 8, padding: "6px 10px", font: "500 12.5px/17px var(--font-sans)", color: "var(--indigo-text)", background: "var(--card)" }}>{i + 1}. {o}</div>)}
                            </div>
                            <div style={{ font: "400 10.5px/14px var(--font-sans)", color: "var(--ink-faint)", marginTop: 5 }}>Interactive question, the student taps an answer to reply.</div>
                          </div>
                        ) : m.body && <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{m.body}</div>}
                        {m.file_path && <button type="button" onClick={() => viewFile(m.file_path)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: m.body ? 6 : 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", font: "600 11.5px/1 var(--font-sans)", color: "var(--indigo-600)" }}><svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M8 10l4-4a2.8 2.8 0 0 1 4 4l-6 6a4 4 0 0 1-6-6l6-6" /></svg>{m.file_name || "file"}</button>}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, font: "400 10px/14px var(--font-sans)", color: "var(--ink-faint)" }}>
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                          {m.emailed && <span style={{ color: "var(--green)" }}>emailed</span>}
                          {mine && <button type="button" onClick={() => togglePin(m)} style={{ background: "none", border: "none", cursor: "pointer", color: m.pinned ? "var(--indigo-600)" : "var(--ink-faint)", font: "600 10px/1 var(--font-sans)", padding: 0 }}>{m.pinned ? "unpin" : "pin"}</button>}
                        </div>
                      </div>
                      {/* Actions OUTSIDE the bubble (Task 4 + 5) */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "none" }}>
                        <button type="button" onClick={() => setReplyTo(m)} title="Reply" style={actIco}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 4 10l5 4M4 10h7a5 5 0 0 1 5 5v1" /></svg></button>
                        {m.file_path && <button type="button" onClick={() => downloadFile(m.file_path, m.file_name)} title="Download" style={actIco}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15v2h12v-2" /></svg></button>}
                      </div>
                    </div>
                  );
                })}
                {uploadingName && (
                  <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "var(--indigo-tint)", borderRadius: 16, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span aria-hidden style={{ width: 14, height: 14, flex: "none", border: "2px solid var(--indigo-line)", borderTopColor: "var(--indigo-600)", borderRadius: "50%", animation: "afSpin .7s linear infinite" }} />
                    <span style={{ font: "500 12.5px/17px var(--font-sans)", color: "var(--indigo-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Uploading {uploadingName}…</span>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div style={{ borderTop: "1px solid var(--line-soft)", padding: 12, background: "var(--card)" }}>
                {file && <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}><span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--indigo-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Attached: {file.name}</span><button type="button" onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}>✕</button></div>}
                {showQ && (
                  <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input className="af" placeholder="Question" value={qText} onChange={(e) => setQText(e.target.value)} />
                    {qOpts.map((o, i) => <input key={i} className="af" placeholder={`Answer ${i + 1}`} value={o} onChange={(e) => setQOpts(qOpts.map((x, j) => j === i ? e.target.value : x))} />)}
                    {qOpts.length < 4 && <button type="button" onClick={() => setQOpts([...qOpts, ""])} style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", font: "600 12px/1 var(--font-sans)", color: "var(--indigo-600)" }}>+ Add answer</button>}
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  <button type="button" onClick={() => setEmailOn((v) => !v)} style={opt(emailOn)}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="14" height="10" rx="2" /><path d="M3.5 6 10 10.5 16.5 6" /></svg>Email</button>
                  <button type="button" onClick={() => setPinOn((v) => !v)} style={opt(pinOn)}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h6l-1 6 3 2v1H5v-1l3-2-1-6z" /><path d="M10 12v5" /></svg>Pin</button>
                  <button type="button" onClick={() => setWhatsappOn((v) => !v)} title="WhatsApp alert (coming soon)" style={opt(whatsappOn)}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3a7 7 0 0 0-6 10.5L3 17l3.7-1A7 7 0 1 0 10 3z" /><path d="M7.5 7.5c0 3 2 5 5 5 .6 0 1-.6.7-1.1l-1-1.2-1.4.6-1.6-1.6.6-1.4-1.2-1c-.5-.3-1.1.1-1.1.7z" /></svg>WhatsApp</button>
                  <button type="button" onClick={() => setShowQ((v) => !v)} style={opt(showQ)}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 7.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.7-.9 1.4v.3" /><path d="M10 15v.4" /></svg>Question</button>
                  <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>
                {whatsappOn && <div style={{ font: "500 11.5px/16px var(--font-sans)", color: "var(--amber)", marginBottom: 8 }}>WhatsApp alerts are coming soon, this message posts to the chat for now.</div>}
                {replyTo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--subtle)", borderLeft: "3px solid var(--indigo-600)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>Replying to {replyTo.sender === "admin" ? "yourself" : selUser?.full_name || "student"}</div>
                      <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.body?.slice(0, 70) || replyTo.file_name || "Attachment"}</div>
                    </div>
                    <button type="button" onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}>✕</button>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "4px 5px 4px 8px", boxShadow: "0 6px 18px rgba(23,35,58,.06)" }}>
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a file" title="Attach a file" style={{ flex: "none", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "none", background: "none", cursor: "pointer", color: "var(--ink-soft)" }}>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10l4-4a2.8 2.8 0 0 1 4 4l-6 6a4 4 0 0 1-6-6l6-6" /></svg>
                  </button>
                  <input placeholder="Write a message…" value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} style={{ flex: "1 1 auto", minWidth: 0, height: 38, border: "none", background: "transparent", outline: "none", font: "400 14px/1 var(--font-sans)", color: "var(--ink)" }} />
                  <button type="button" disabled={sending} onClick={send} style={{ height: 38, flex: "none", padding: "0 16px", borderRadius: 999, border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 13.5px/1 var(--font-sans)", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.5 : 1 }}>{sending ? "…" : emailOn ? "Send & email" : "Send"}</button>
                </div>
                {status && <div style={{ font: "500 12px/17px var(--font-sans)", color: status.startsWith("Failed") ? "var(--red)" : "var(--green)", marginTop: 6 }}>{status}</div>}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: two independently scrollable sections (Task 2) */}
        <div style={{ borderLeft: "1px solid var(--line-soft)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12 }}>
            <div style={{ font: "600 11px/15px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>Pinned updates</div>
            {!selUser ? <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)" }}>—</div> : pinned.length === 0 ? <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)" }}>Nothing pinned.</div> : pinned.map((m) => (
              <div key={m.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}><span className="pill pill-indigo">Pinned</span>{m.emailed && <span className="pill pill-green">Emailed</span>}</div>
                <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{parseAsk(m.body)?.q ?? m.body ?? m.file_name}</div>
              </div>
            ))}
          </div>

          {/* Documents section starts at the middle, own scroll */}
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 12, borderTop: "1px solid var(--line)" }}>
            <div style={{ font: "600 11px/15px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 10 }}>Documents</div>
            {!selUser ? <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)" }}>—</div> : files.length === 0 ? <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)" }}>No files shared yet.</div> : files.map((m) => (
              <div key={m.id} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m, kind: "file" }); }} style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", marginBottom: 8 }}>
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="var(--indigo-600)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}><path d="M6 3h5l3 3v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M11 3v3h3" /></svg>
                <span style={{ flex: 1, minWidth: 0, font: "500 12px/16px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.file_name || "file"}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.left - 150, y: r.bottom, msg: m, kind: "file" }); }} title="Options" style={{ flex: "none", background: "none", border: "none", cursor: "pointer", color: "var(--ink-faint)", padding: 2 }}><svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><circle cx="10" cy="4" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="10" cy="16" r="1.6" /></svg></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {menu && (
        <div style={{ position: "fixed", top: Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 190 : menu.y), left: Math.max(8, Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 170 : menu.x)), zIndex: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px rgba(23,35,58,.2)", padding: 6, minWidth: 158 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setReplyTo(menu.msg); setMenu(null); }} style={menuItem}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 4 10l5 4M4 10h7a5 5 0 0 1 5 5v1" /></svg>Reply</button>
          {menu.msg.file_path && <button type="button" onClick={() => { downloadFile(menu.msg.file_path, menu.msg.file_name); setMenu(null); }} style={menuItem}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15v2h12v-2" /></svg>Download</button>}
          {menu.kind === "file" && menu.msg.file_path && <button type="button" onClick={() => renameFile(menu.msg)} style={menuItem}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13.5V16h2.5l8-8L12 5.5l-8 8z" /><path d="M11.5 6 14 8.5" /></svg>Rename</button>}
          {menu.msg.sender === "admin" && <button type="button" onClick={() => deleteMsg(menu.msg)} style={{ ...menuItem, color: "var(--red)" }}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 6h10M8 6V4h4v2M6 6l1 10h6l1-10" /></svg>Delete</button>}
        </div>
      )}

      {showInfo && selUser && (
        <div onClick={() => setShowInfo(false)} style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgba(23,35,58,.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "0 24px 60px rgba(23,35,58,.25)", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--line-soft)" }}>
              <span style={{ width: 44, height: 44, borderRadius: 999, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center", font: "700 17px/1 var(--font-sans)" }}>{(selUser.full_name || "U").charAt(0).toUpperCase()}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "700 16px/21px var(--font-sans)", color: "var(--ink)" }}>{selUser.full_name || "Unnamed"}</div>
                <div style={{ font: "600 11.5px/16px var(--font-sans)", color: "var(--indigo-600)" }}>{awu(selUser.user_number)} · {selUser.plan === "full_service" ? "Full Service" : "Self Service"}</div>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              {[
                ["Email", (infoProfile?.email as string) ?? selUser.email ?? "—"],
                ["Country", countryByCode((infoProfile?.destination_country as string) ?? "")?.name ?? "—"],
                ["City", (infoProfile?.city as string) || "—"],
                ["WhatsApp", `${(infoProfile?.whatsapp_country_code as string) ?? ""} ${(infoProfile?.whatsapp_number as string) ?? ""}`.trim() || "—"],
                ["Status", (infoProfile?.plan_status as string) || "—"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)" }}>{k}</span>
                  <span style={{ font: "600 13px/19px var(--font-sans)", color: "var(--ink)", textAlign: "right", wordBreak: "break-word" }}>{v}</span>
                </div>
              ))}
              {trackOpen && (
                <div style={{ marginTop: 12, background: "var(--subtle)", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ font: "600 11px/15px var(--font-sans)", letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 6 }}>Application timeline</div>
                  {[
                    ["Onboarding completed", infoProfile?.onboarding_completed_at ? new Date(infoProfile.onboarding_completed_at as string).toLocaleDateString() : "—"],
                    ["Plan activated", infoProfile?.plan_activated_at ? new Date(infoProfile.plan_activated_at as string).toLocaleDateString() : "—"],
                    ["Messages", String(msgs.length)],
                    ["Pinned as important", String(pinned.length)],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", font: "400 12.5px/18px var(--font-sans)", color: "var(--ink)" }}><span style={{ color: "var(--ink-soft)" }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setTrackOpen((v) => !v)} style={{ flex: "1 1 auto", height: 40, padding: "0 12px", borderRadius: 10, border: "1px solid var(--line)", background: trackOpen ? "var(--indigo-tint)" : "var(--card)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: trackOpen ? "var(--indigo-text)" : "var(--ink)" }}>Track</button>
                <a href={selUser.email ? `mailto:${selUser.email}` : undefined} style={{ flex: "1 1 auto", textAlign: "center", height: 40, lineHeight: "40px", padding: "0 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", textDecoration: "none" }}>Email</a>
                <button type="button" onClick={downloadConversation} title="Download only the pinned (important) messages" style={{ flex: "1 1 100%", height: 40, padding: "0 12px", borderRadius: 10, border: "none", background: "var(--indigo-600)", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "#fff" }}>Download conversation</button>
              </div>
              <div style={{ font: "400 11px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 8 }}>Download saves the roadmap conversation — only messages you pinned as important.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const menuItem: CSSProperties = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", textAlign: "left" };
