"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import { glassPanelStyle } from "./GlassCard";
import { notify, requestNotify } from "@/lib/notify";
import { uploadUserFile, fileUrl } from "@/lib/r2";

type Msg = { id: string; sender: string; body: string; file_path: string | null; file_name: string | null; created_at: string; reply_to: string | null };

const actIco: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, cursor: "pointer", color: "var(--ink-soft)", flex: "none" };
const menuItem: CSSProperties = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", textAlign: "left" };

export default function StudentChat({ userId, full }: { userId: string; full: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "info" | "error"; text: string } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; msg: Msg } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("messages").select("id, sender, body, file_path, file_name, created_at, reply_to").eq("user_id", userId).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
  }, [userId]);

  useEffect(() => {
    void load();
    requestNotify();
    const ch = supabase.channel(`stu-msgs-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${userId}` }, (payload) => {
      void load();
      const m = payload.new as { sender?: string; body?: string } | null;
      if (payload.eventType === "INSERT" && m?.sender === "admin") notify("New message from AfaqWay", m.body?.slice(0, 90) || "You received a file");
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load]);

  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [msgs]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); };
  }, [menu]);

  async function viewFile(path: string | null) {
    if (!path) return;
    const url = await fileUrl(path, "update_files");
    if (url) window.open(url, "_blank", "noopener");
  }
  async function downloadFile(path: string | null, name: string | null) {
    if (!path) return;
    const url = await fileUrl(path, "update_files", name ?? undefined);
    if (url) { const a = document.createElement("a"); a.href = url; a.download = name ?? ""; document.body.appendChild(a); a.click(); a.remove(); }
  }
  async function deleteMsg(m: Msg) { setMenu(null); if (m.sender !== "user") return; await supabase.from("messages").delete().eq("id", m.id); void load(); }

  async function send() {
    if ((!body.trim() && !file) || sending || blocked) return;
    setSending(true); setNotice(null);
    try {
      let fp: string | null = null, fn: string | null = null;
      if (file) {
        const up = await uploadUserFile(file, { fallbackBucket: "update_files", fallbackPrefix: userId });
        fp = up.path; fn = file.name;
      }
      const { data, error } = await supabase.rpc("send_user_message", { p_body: body.trim(), p_file_path: fp, p_file_name: fn, p_reply_to: replyTo?.id ?? null });
      if (error) { setNotice({ kind: "error", text: "Could not send: " + error.message }); return; }
      const res = (data ?? {}) as { ok?: boolean; reason?: string };
      if (res.ok) { setBody(""); setFile(null); setReplyTo(null); void load(); }
      else if (res.reason === "banned") { setBlocked(true); setNotice({ kind: "error", text: "Your account is currently blocked. Please contact support." }); }
      else setNotice({ kind: "error", text: "Message not sent. Please try again." });
    } catch (e) { setNotice({ kind: "error", text: "Could not send: " + (e instanceof Error ? e.message : "error") }); } finally { setSending(false); }
  }

  return (
    <div style={{ ...glassPanelStyle, padding: 0, overflow: "hidden", height: 480, display: "flex", flexDirection: "column" }}>
      <div ref={threadRef} style={{ flex: 1, minHeight: 0, padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        <div style={{ alignSelf: "flex-start", maxWidth: "78%", background: "rgba(255,255,255,.7)", borderRadius: 12, padding: "10px 14px", font: "400 13px/19px var(--font-sans)", color: "var(--ink)" }}>
          {full ? "Welcome. Your dedicated admin answers here, send any document or question." : "Welcome. Send a document or a question and our team will reply here."}
        </div>
        {msgs.map((m) => {
          const mine = m.sender === "user";
          const quoted = m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "center", gap: 6, alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "90%" }}
              onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m }); }}>
              <div style={{ minWidth: 0, background: mine ? "var(--indigo-tint)" : "rgba(255,255,255,.7)", borderRadius: 12, padding: "9px 12px" }}>
                {quoted && (
                  <div style={{ borderLeft: "3px solid var(--indigo-600)", background: "rgba(43,76,155,.06)", borderRadius: 6, padding: "4px 8px", marginBottom: 6 }}>
                    <span style={{ display: "block", font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>{quoted.sender === "user" ? "You" : "AfaqWay"}</span>
                    <span style={{ display: "block", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{quoted.body?.slice(0, 60) || quoted.file_name || "Attachment"}</span>
                  </div>
                )}
                {m.body && <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{m.body}</div>}
                {m.file_path && <button type="button" onClick={() => viewFile(m.file_path)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: m.body ? 6 : 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", font: "600 11.5px/1 var(--font-sans)", color: "var(--indigo-600)" }}><svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M8 10l4-4a2.8 2.8 0 0 1 4 4l-6 6a4 4 0 0 1-6-6l6-6" /></svg>{m.file_name || "file"}</button>}
                <div style={{ font: "400 10px/14px var(--font-sans)", color: "var(--ink-faint)", marginTop: 5 }}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
              {/* Actions OUTSIDE the bubble */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "none" }}>
                <button type="button" onClick={() => setReplyTo(m)} title="Reply" style={actIco}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 4 10l5 4M4 10h7a5 5 0 0 1 5 5v1" /></svg></button>
                {m.file_path && <button type="button" onClick={() => downloadFile(m.file_path, m.file_name)} title="Download" style={actIco}><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15v2h12v-2" /></svg></button>}
              </div>
            </div>
          );
        })}
      </div>
      {notice && <div style={{ padding: "8px 16px", font: "500 12.5px/18px var(--font-sans)", color: notice.kind === "error" ? "var(--red)" : "var(--amber)", background: notice.kind === "error" ? "var(--red-tint)" : "var(--amber-tint)", borderTop: "1px solid var(--line-soft)" }}>{notice.text}</div>}
      <div style={{ borderTop: "1px solid var(--line-soft)", padding: 12 }}>
        {replyTo && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.6)", borderLeft: "3px solid var(--indigo-600)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>Replying to {replyTo.sender === "user" ? "yourself" : "AfaqWay"}</div>
              <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.body?.slice(0, 70) || replyTo.file_name || "Attachment"}</div>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}>✕</button>
          </div>
        )}
        {file && <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}><span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--indigo-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Attached: {file.name}</span><button type="button" onClick={() => setFile(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)" }}>✕</button></div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={blocked} style={{ height: 42, padding: "0 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--card)", cursor: blocked ? "not-allowed" : "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", opacity: blocked ? 0.5 : 1 }}>Upload</button>
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <input className="af" placeholder={blocked ? "Messaging is disabled" : "Type a message…"} value={body} disabled={blocked} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} style={{ flex: 1 }} />
          <button type="button" disabled={sending || blocked} onClick={send} style={{ height: 42, padding: "0 18px", borderRadius: 10, border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 14px/1 var(--font-sans)", cursor: sending || blocked ? "not-allowed" : "pointer", opacity: sending || blocked ? 0.5 : 1 }}>{sending ? "…" : "Send"}</button>
        </div>
      </div>

      {menu && (
        <div style={{ position: "fixed", top: Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 100 : menu.y), left: Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 170 : menu.x), zIndex: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px rgba(23,35,58,.2)", padding: 6, minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setReplyTo(menu.msg); setMenu(null); }} style={menuItem}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 4 10l5 4M4 10h7a5 5 0 0 1 5 5v1" /></svg>Reply</button>
          {menu.msg.file_path && <button type="button" onClick={() => { downloadFile(menu.msg.file_path, menu.msg.file_name); setMenu(null); }} style={menuItem}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15v2h12v-2" /></svg>Download</button>}
          {menu.msg.sender === "user" && <button type="button" onClick={() => deleteMsg(menu.msg)} style={{ ...menuItem, color: "var(--red)" }}><svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 6h10M8 6V4h4v2M6 6l1 10h6l1-10" /></svg>Delete</button>}
        </div>
      )}
    </div>
  );
}
