"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import { notify, requestNotify } from "@/lib/notify";
import { uploadUserFile, fileUrl } from "@/lib/r2";
import { parseAsk } from "@/lib/chat";
import { Paperclip, Reply, Download, Trash2 } from "lucide-react";

type Msg = { id: string; sender: string; body: string; file_path: string | null; file_name: string | null; created_at: string; reply_to: string | null };

const actIco: CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, cursor: "pointer", color: "var(--ink-soft)", flex: "none" };
const menuItem: CSSProperties = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", textAlign: "left" };

export default function StudentChat({ userId, full }: { userId: string; full: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingName, setUploadingName] = useState<string | null>(null);
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
        setUploadingName(file.name); // show it in the conversation right away while it uploads
        const up = await uploadUserFile(file, { fallbackBucket: "update_files", fallbackPrefix: userId });
        fp = up.path; fn = file.name;
      }
      const { data, error } = await supabase.rpc("send_user_message", { p_body: body.trim(), p_file_path: fp, p_file_name: fn, p_reply_to: replyTo?.id ?? null });
      if (error) { setNotice({ kind: "error", text: "Could not send: " + error.message }); return; }
      const res = (data ?? {}) as { ok?: boolean; reason?: string };
      if (res.ok) { setBody(""); setFile(null); setReplyTo(null); void load(); }
      else if (res.reason === "banned") { setBlocked(true); setNotice({ kind: "error", text: "Your account is currently blocked. Please contact support." }); }
      else setNotice({ kind: "error", text: "Message not sent. Please try again." });
    } catch (e) { setNotice({ kind: "error", text: "Could not send: " + (e instanceof Error ? e.message : "error") }); } finally { setSending(false); setUploadingName(null); }
  }

  return (
    <div className="stu-chat-texture" style={{ padding: 0, overflow: "hidden", height: "min(68dvh, 480px)", minHeight: 320, display: "flex", flexDirection: "column", borderRadius: 20, border: "1px solid var(--line)", boxShadow: "0 10px 30px rgba(23,35,58,.08)" }}>
      <div ref={threadRef} style={{ flex: 1, minHeight: 0, padding: 16, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
        <div style={{ alignSelf: "flex-start", maxWidth: "78%", background: "rgba(255,255,255,.92)", borderRadius: 12, padding: "10px 14px", font: "400 13px/19px var(--font-sans)", color: "var(--ink)" }}>
          {full ? "Welcome. Your dedicated admin answers here, send any document or question." : "Welcome. Send a document or a question and our team will reply here."}
        </div>
        {msgs.map((m) => {
          const mine = m.sender === "user";
          const quoted = m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null;
          const ask = parseAsk(m.body);
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: mine ? "row-reverse" : "row", alignItems: "center", gap: 6, alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "90%" }}
              onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m }); }}>
              <div style={{ minWidth: 0, background: mine ? "var(--indigo-tint)" : "rgba(255,255,255,.92)", borderRadius: 16, padding: "9px 13px", boxShadow: "0 2px 8px rgba(23,35,58,.06)" }}>
                {quoted && (
                  <div style={{ borderLeft: "3px solid var(--indigo-600)", background: "rgba(43,76,155,.06)", borderRadius: 6, padding: "4px 8px", marginBottom: 6 }}>
                    <span style={{ display: "block", font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>{quoted.sender === "user" ? "You" : "AfaqWay"}</span>
                    <span style={{ display: "block", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-soft)" }}>{quoted.body?.slice(0, 60) || quoted.file_name || "Attachment"}</span>
                  </div>
                )}
                {ask ? (
                  <div>
                    <div style={{ font: "600 13px/19px var(--font-sans)", color: "var(--ink)" }}>{ask.q}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 7 }}>
                      {ask.opts.map((o, i) => (
                        <button key={i} type="button" onClick={() => setBody(o)} title="Tap to put this answer in your message box" style={{ textAlign: "left", border: "1px solid var(--indigo-line)", borderRadius: 9, padding: "8px 11px", cursor: "pointer", background: "var(--card)", font: "500 12.5px/17px var(--font-sans)", color: "var(--indigo-text)" }}>{i + 1}. {o}</button>
                      ))}
                    </div>
                    <div style={{ font: "400 10.5px/14px var(--font-sans)", color: "var(--ink-faint)", marginTop: 6 }}>Tap an answer, then press Send.</div>
                  </div>
                ) : m.body && <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{m.body}</div>}
                {m.file_path && <button type="button" onClick={() => viewFile(m.file_path)} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: m.body ? 6 : 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", font: "600 11.5px/1 var(--font-sans)", color: "var(--indigo-600)" }}><Paperclip size={13} />{m.file_name || "file"}</button>}
                <div style={{ font: "400 10px/14px var(--font-sans)", color: "var(--ink-faint)", marginTop: 5 }}>{new Date(m.created_at).toLocaleString()}</div>
              </div>
              {/* Actions OUTSIDE the bubble */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: "none" }}>
                <button type="button" onClick={() => setReplyTo(m)} title="Reply" style={actIco}><Reply size={14} /></button>
                {m.file_path && <button type="button" onClick={() => downloadFile(m.file_path, m.file_name)} title="Download" style={actIco}><Download size={14} /></button>}
              </div>
            </div>
          );
        })}
        {uploadingName && (
          <div style={{ alignSelf: "flex-end", maxWidth: "80%", background: "var(--indigo-tint)", borderRadius: 16, padding: "9px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden style={{ width: 14, height: 14, flex: "none", border: "2px solid var(--indigo-line)", borderTopColor: "var(--indigo-600)", borderRadius: "50%", animation: "afSpin .7s linear infinite" }} />
            <span style={{ font: "500 12.5px/17px var(--font-sans)", color: "var(--indigo-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Uploading {uploadingName}…</span>
          </div>
        )}
      </div>
      {notice && <div style={{ padding: "8px 16px", font: "500 12.5px/18px var(--font-sans)", color: notice.kind === "error" ? "var(--red)" : "var(--amber)", background: notice.kind === "error" ? "var(--red-tint)" : "var(--amber-tint)", borderTop: "1px solid var(--line-soft)" }}>{notice.text}</div>}
      <div style={{ borderTop: "1px solid var(--line-soft)", padding: 12, background: "var(--card)" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "4px 5px 4px 8px", boxShadow: "0 6px 18px rgba(23,35,58,.06)" }}>
          <button type="button" onClick={() => fileRef.current?.click()} disabled={blocked} aria-label="Attach a file" title="Attach a file" style={{ flex: "none", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "none", background: "none", cursor: blocked ? "not-allowed" : "pointer", color: "var(--ink-soft)", opacity: blocked ? 0.5 : 1 }}>
            <Paperclip size={18} />
          </button>
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <input placeholder={blocked ? "Messaging is disabled" : "Type a message…"} value={body} disabled={blocked} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} style={{ flex: "1 1 auto", minWidth: 0, height: 38, border: "none", background: "transparent", outline: "none", font: "400 16px/1 var(--font-sans)", color: "var(--ink)" }} />
          <button type="button" disabled={sending || blocked} onClick={send} style={{ height: 38, flex: "none", padding: "0 16px", borderRadius: 999, border: "none", background: "var(--indigo-600)", color: "#fff", font: "600 13.5px/1 var(--font-sans)", cursor: sending || blocked ? "not-allowed" : "pointer", opacity: sending || blocked ? 0.5 : 1 }}>{sending ? "…" : "Send"}</button>
        </div>
      </div>

      {menu && (
        <div style={{ position: "fixed", top: Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 100 : menu.y), left: Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 170 : menu.x), zIndex: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 16px 40px rgba(23,35,58,.2)", padding: 6, minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setReplyTo(menu.msg); setMenu(null); }} style={menuItem}><Reply size={15} />Reply</button>
          {menu.msg.file_path && <button type="button" onClick={() => { downloadFile(menu.msg.file_path, menu.msg.file_name); setMenu(null); }} style={menuItem}><Download size={15} />Download</button>}
          {menu.msg.sender === "user" && <button type="button" onClick={() => deleteMsg(menu.msg)} style={{ ...menuItem, color: "var(--red)" }}><Trash2 size={15} />Delete</button>}
        </div>
      )}
    </div>
  );
}
