"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import { notify, requestNotify } from "@/lib/notify";
import { uploadUserFile, fileUrl } from "@/lib/storage/client";
import { parseAsk, toggleReaction, markMessagesSeen, type Reactions } from "@/lib/chat";
import { Download, FileText, Mail, Paperclip, Pin, Plus, Reply, Send, Trash2, X } from "lucide-react";
import { ChatEmpty, ChatDayDivider, isNewChatDay, isLastOfGroup, MessageBubble, PanelCard, UploadingBubble, ChatComposerInput } from "@/components/chat/parts";
import { Loader, Pill, Status, BrandLogo } from "@/components/ds";
import { useAdvisorIdentity, lastSeenLabel } from "@/lib/advisor";
import { firstUnreadId } from "@/lib/chatUnread";

type Msg = {
  id: string; sender: string; body: string; file_path: string | null; file_name: string | null;
  created_at: string; reply_to: string | null; pinned: boolean; emailed: boolean;
  reactions: Reactions | null; seen_at: string | null;
};

const menuItem: CSSProperties = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", textAlign: "left" };

/* Support identity shown to every student — the advisor is the AfaqWay team.
   The advisor's own number is live and comes from lib/advisor. */
const SUPPORT_EMAIL = "support@afaqway.com";

export default function StudentChat({ userId, full, onNav }: {
  userId: string;
  full: boolean;
  /** Lets a decision message send the student to the step it belongs to. */
  onNav?: (page: string) => void;
}) {
  /* Hands the Journey the exact step to reopen, the same hand-off the Documents
     module uses, then navigates. The roadmap expands that stage and opens the
     step, so the student lands on the decision rather than on the page. */
  const openDecision = (decision: { stageId?: string; stepId?: string }) => {
    if (!onNav) return;
    try {
      sessionStorage.setItem("af.journey.open", JSON.stringify({ stepId: decision.stepId, stageId: decision.stageId }));
    } catch { /* storage blocked */ }
    onNav("journey");
  };
  /* Who is answering right now: number, presence, last seen, typing. */
  const advisor = useAdvisorIdentity(userId);
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
    const { data } = await supabase.from("messages").select("id, sender, body, file_path, file_name, created_at, reply_to, pinned, emailed, meta, reactions, seen_at").eq("user_id", userId).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
  }, [userId]);

  useEffect(() => {
    void load();
    requestNotify();
    const ch = supabase.channel(`stu-msgs-${userId}`).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${userId}` }, (payload) => {
      void load();
      const m = payload.new as { sender?: string; body?: string } | null;
      if (payload.eventType === "INSERT" && m?.sender === "admin") { notify("New message from AfaqWay", m.body?.slice(0, 90) || "You received a file"); void markMessagesSeen(userId); }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load]);

  /* This component only mounts while the student is looking at the
     conversation, so its presence on screen is exactly "the thread was
     opened" — the same moment the advisor's own reads are marked. */
  useEffect(() => { void markMessagesSeen(userId); }, [userId]);

  const reactToMessage = useCallback(async (id: string, emoji: string) => {
    const next = await toggleReaction(id, emoji);
    if (next) setMsgs((list) => list.map((m) => (m.id === id ? { ...m, reactions: next } : m)));
  }, []);

  /* Opening the conversation lands on the first message the student has not
     read, not on the bottom of the thread. Arriving from a notification, that
     is the message the notification was about; with nothing unread it is the
     newest message, which is the bottom anyway. */
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread || msgs.length === 0) return;
    const target = firstUnreadId(userId, msgs);
    const el = target ? thread.querySelector<HTMLElement>(`[data-msg="${target}"]`) : null;
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    else thread.scrollTop = thread.scrollHeight;
  }, [msgs, userId]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); };
  }, [menu]);

  async function viewFile(path: string | null) {
    if (!path) return;
    const url = await fileUrl(path);
    if (url) window.open(url, "_blank", "noopener");
  }
  async function downloadFile(path: string | null, name: string | null) {
    if (!path) return;
    const url = await fileUrl(path, name ?? undefined);
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
        const up = await uploadUserFile(file, { folder: "chat" });
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

  /* Derived from msgs, not from anything typed in the composer — memoized so
     typing a message doesn't re-filter/re-scan the whole thread on every
     keystroke for no reason. */
  const pinned = useMemo(() => msgs.filter((m) => m.pinned), [msgs]);
  const files = useMemo(() => msgs.filter((m) => m.file_path), [msgs]);
  /* "Seen" renders once, under the newest message the student sent — not per
     row — the same place every consumer chat puts a single read receipt. */
  const lastMineId = useMemo(() => [...msgs].reverse().find((m) => m.sender === "user")?.id ?? null, [msgs]);

  return (
    <div className="chat-zoom" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div className="chat-shell" style={{ gridTemplateColumns: "minmax(0,1fr) 272px", flex: 1, minHeight: 0 }}>
        {/* ── Conversation ── */}
        <div className="chat-col stu-chat-texture">
          {/* The platform answers, never a named person: the mark, the constant
              name, and the number of whoever is currently on the conversation.
              When a different advisor replies, only this header changes —
              every earlier message stays as it was sent. */}
          <header className="chat-header">
            <span className="chat-brand-wrap">
              <span className="chat-brand-avatar"><BrandLogo variant="app" size={40} /></span>
              {/* Mobile only: a small Instagram-style online dot on the avatar
                  itself, instead of the system Status pill (hidden on mobile
                  below) — desktop keeps the pill exactly as it was. */}
              {(advisor.online || advisor.typing) && <span className="chat-ig-dot" aria-hidden />}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span className="chat-header-name">
                AfaqWay Advisor
                <span style={{ font: "500 11px/16px var(--font-sans)", color: "var(--ink-faint)" }}>{advisor.label}</span>
              </span>
              <span className="chat-header-sub">
                {advisor.typing
                  ? <span className="chat-typing"><i /><i /><i />typing…</span>
                  : <><Mail size={12} />{SUPPORT_EMAIL}</>}
              </span>
            </span>
            <Status
              state={advisor.typing ? "typing" : advisor.online ? "online" : "offline"}
              label={advisor.typing ? "Typing…" : lastSeenLabel(advisor.lastSeen, advisor.online)}
            />
          </header>

          <div ref={threadRef} className="chat-thread">
            <div className="chat-row">
              <div className="chat-msgcol">
                <div className="chat-bubble">
                  <div className="chat-text">{full ? "Welcome. Your dedicated advisor answers here, send any document or question." : "Welcome. Send a document or a question and our team will reply here."}</div>
                </div>
              </div>
            </div>
            {msgs.map((m, i) => (
              <div key={m.id}>
                {isNewChatDay(msgs, i) && <ChatDayDivider iso={m.created_at} />}
                <MessageBubble
                  msg={m}
                  mine={m.sender === "user"}
                  quoted={m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null}
                  quotedAuthor={m.reply_to && msgs.find((x) => x.id === m.reply_to)?.sender === "user" ? "You" : "AfaqWay"}
                  onReply={() => setReplyTo(m)}
                  onDownload={() => downloadFile(m.file_path, m.file_name)}
                  onViewFile={() => viewFile(m.file_path)}
                  onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m }); }}
                  onAnswer={m.sender === "admin" ? (o) => setBody(o) : undefined}
                  onOpenDecision={openDecision}
                  otherAvatar={m.sender === "admin" ? <BrandLogo variant="app" size={30} /> : null}
                  isLastOfGroup={isLastOfGroup(msgs, i)}
                  viewerSide="user"
                  onReact={reactToMessage}
                  seen={m.sender === "user" && m.id === lastMineId && !!m.seen_at}
                />
              </div>
            ))}
            {uploadingName && <UploadingBubble name={uploadingName} />}
          </div>

          {notice && <div style={{ padding: "9px 16px", font: "500 12.5px/18px var(--font-sans)", color: notice.kind === "error" ? "var(--red)" : "var(--amber)", background: notice.kind === "error" ? "var(--red-tint)" : "var(--amber-tint)", borderTop: "1px solid var(--line-soft)" }}>{notice.text}</div>}

          <div className="chat-composer">
            {replyTo && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--subtle)", borderLeft: "3px solid var(--indigo-600)", borderRadius: 12, padding: "7px 12px", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>Replying to {replyTo.sender === "user" ? "yourself" : "AfaqWay"}</div>
                  <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.body?.slice(0, 70) || replyTo.file_name || "Attachment"}</div>
                </div>
                <button type="button" className="chat-act" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={14} /></button>
              </div>
            )}
            {file && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 12, padding: "7px 12px", marginBottom: 8 }}>
                <span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--indigo-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Attached: {file.name}</span>
                <button type="button" className="chat-act" onClick={() => setFile(null)} aria-label="Remove attachment"><X size={14} /></button>
              </div>
            )}
            <div className="af-composer">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={blocked} aria-label="Attach a file" title="Attach a file" style={{ flex: "none", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "none", background: "none", cursor: blocked ? "not-allowed" : "pointer", color: "var(--indigo-600)", opacity: blocked ? 0.5 : 1 }}>
                <Paperclip size={18} />
              </button>
              <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <ChatComposerInput
                placeholder={blocked ? "Messaging is disabled" : "Type a message…"}
                value={body} disabled={blocked}
                onChange={setBody}
                onSend={() => void send()}
              />
              <button type="button" className="chat-send" disabled={sending || blocked} onClick={send}>
                {sending ? <><Loader size={16} onDark />Sending</> : <><Send size={15} />Send</>}
              </button>
            </div>
          </div>
        </div>

        {/* ── Information panel: same cards as the admin console ── */}
        <div className="chat-col">
          <PanelCard
            icon={<Pin size={15} />} title="Pinned updates"
            isEmpty={pinned.length === 0}
            empty={<ChatEmpty art="pinned" title="Nothing pinned yet" sub="Important updates from your advisor appear here." />}
          >
            {pinned.map((m) => (
              <div key={m.id} className="chat-panel-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", gap: 6 }}><Pill tone="indigo">Pinned</Pill></div>
                <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{parseAsk(m.body)?.q ?? m.body ?? m.file_name}</div>
              </div>
            ))}
          </PanelCard>

          <PanelCard
            icon={<FileText size={15} />} title="Shared documents"
            action={<button type="button" className="chat-act" onClick={() => fileRef.current?.click()} disabled={blocked} title="Share a document" aria-label="Share a document"><Plus size={15} /></button>}
            isEmpty={files.length === 0}
            empty={<ChatEmpty art="documents" title="No documents yet" sub="Files you and your advisor share appear here." />}
          >
            {files.map((m) => (
              <div key={m.id} className="chat-panel-item" onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m }); }}>
                <span style={{ flex: "none", width: 28, height: 28, borderRadius: 9, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={14} /></span>
                <span style={{ flex: 1, minWidth: 0, font: "500 12px/16px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.file_name || "file"}</span>
                <button type="button" className="chat-act" onClick={() => downloadFile(m.file_path, m.file_name)} title="Download" aria-label="Download"><Download size={15} /></button>
              </div>
            ))}
          </PanelCard>
        </div>
      </div>

      {menu && (
        <div style={{ position: "fixed", top: Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 100 : menu.y), left: Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 170 : menu.x), zIndex: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "0 16px 40px rgba(23,35,58,.2)", padding: 6, minWidth: 150 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setReplyTo(menu.msg); setMenu(null); }} style={menuItem}><Reply size={15} />Reply</button>
          {menu.msg.file_path && <button type="button" onClick={() => { downloadFile(menu.msg.file_path, menu.msg.file_name); setMenu(null); }} style={menuItem}><Download size={15} />Download</button>}
          {menu.msg.sender === "user" && <button type="button" onClick={() => deleteMsg(menu.msg)} style={{ ...menuItem, color: "var(--red)" }}><Trash2 size={15} />Delete</button>}
        </div>
      )}
    </div>
  );
}
