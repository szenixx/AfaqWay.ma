"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input, Toggle, Flag, fieldIcon, Loader, Pill, Status } from "@/components/ds";
import { COUNTRIES, countryByCode } from "@/components/profile-setup/countries";
import { notify, requestNotify } from "@/lib/notify";
import { fileUrl, uploadUserFile } from "@/lib/storage/client";
import { loadAvatarFields } from "@/lib/avatarProfile";
import { useOnlineUsers } from "@/lib/presence";
import { emailAdvisorMessage } from "@/lib/email/client";
import { parseAsk } from "@/lib/chat";
import { CircleHelp, Download, EllipsisVertical, FileText, Info, Mail, MessageCircle, Paperclip, Pencil, Pin, Plus, Reply, Send, Trash2, Users, X } from "lucide-react";
import { ChatAvatar, ChatEmpty, MessageBubble, PanelCard, UploadingBubble } from "@/components/chat/parts";
/* Tells the student's conversation that someone is composing a reply. */
import { broadcastAdvisorTyping } from "@/lib/advisor";
import { UserDetails } from "@/components/admin/users/UserDetails";

type U = { id: string; full_name: string | null; email: string | null; user_number: number | null; plan: string | null; avatar_path: string | null; gender?: string | null; avatar_seed?: string | null; avatar_style?: string | null };
type Msg = { id: string; user_id: string; sender: string; body: string; file_path: string | null; file_name: string | null; pinned: boolean; emailed: boolean; created_at: string; reply_to: string | null };

const awu = (n: number | null) => "AWU-" + String(n ?? 0).padStart(3, "0");

export default function AdminChat({ initialUserId, onOpenPlanModule }: { initialUserId?: string | null; onOpenPlanModule?: (plan: string, userId: string) => void }) {
  /* Presence is who is actually on the platform, not whose chat is open. */
  const onlineUsers = useOnlineUsers();
  const [country, setCountry] = useState<string | null>(initialUserId ? "LT" : null);
  const [users, setUsers] = useState<U[]>([]);
  const [avatars, setAvatars] = useState<Record<string, string>>({});
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
  // Unread student messages per conversation, for the list badges.
  const [unread, setUnread] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => { window.removeEventListener("click", close); window.removeEventListener("scroll", close, true); };
  }, [menu]);

  useEffect(() => { if (initialUserId) { setCountry("LT"); setSel(initialUserId); } }, [initialUserId]);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, user_number, plan, avatar_path").eq("plan_status", "active").order("plan_activated_at", { ascending: false });
    const list = (data ?? []) as U[];
    // Avatar identity is fetched separately so the console keeps working before
    // the avatar migration is applied.
    const ids = list.map((u) => u.id);
    const fields = await loadAvatarFields(ids);
    setUsers(list.map((u) => ({ ...u, ...(fields.get(u.id) ?? {}) })));
    const withAvatar = list.filter((u) => u.avatar_path);
    const entries = await Promise.all(withAvatar.map(async (u) => [u.id, await fileUrl(u.avatar_path as string, "avatars", undefined, 86400)] as const));
    setAvatars(Object.fromEntries(entries.filter(([, url]) => url)) as Record<string, string>);
  }, []);
  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const loadMsgs = useCallback(async (uid: string) => {
    const { data } = await supabase.from("messages").select("id, user_id, sender, body, file_path, file_name, pinned, emailed, created_at, reply_to").eq("user_id", uid).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
  }, []);
  const selRef = useRef<string | null>(sel);
  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; }, [msgs]);
  useEffect(() => { if (sel) void loadMsgs(sel); else setMsgs([]); }, [sel, loadMsgs]);
  // Opening a conversation clears its unread badge.
  const openConvo = (id: string) => { setSel(id); setUnread((u) => (u[id] ? { ...u, [id]: 0 } : u)); };

  // Sound + notification for any incoming student message (B3).
  useEffect(() => {
    requestNotify();
    const ch = supabase.channel("admin-msgs-incoming")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.user_id === selRef.current) void loadMsgs(m.user_id);
        if (m.sender === "user") {
          if (m.user_id !== selRef.current) setUnread((u) => ({ ...u, [m.user_id]: (u[m.user_id] ?? 0) + 1 }));
          notify("New message from a student", m.body?.slice(0, 90) || "Sent a file");
          void loadUsers();
        }
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
        // Filed under the recipient student so they can read it back from R2.
        const up = await uploadUserFile(file, { folder: "chat", ownerId: sel });
        file_path = up.path; file_name = file.name;
        if (emailOn) attachUrl = await fileUrl(up.path, "update_files", undefined, 60 * 60 * 24 * 7);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const ins = await supabase.from("messages").insert({ user_id: sel, sender: "admin", body: finalBody, file_path, file_name, pinned: pinOn, emailed: emailOn, created_by: user?.id, reply_to: replyTo?.id ?? null });
      if (ins.error) throw ins.error;
      if (emailOn && selUser.email) {
        /* The chat message is already saved; email is a second delivery of the
           same words. Its outcome is reported, never allowed to fail silently
           and never allowed to undo the message. */
        const mail = await emailAdvisorMessage({
          to: selUser.email,
          subject: `Message from your AfaqWay advisor`,
          message: attachUrl ? `${finalBody}\n\nAttachment: ${file_name}\n${attachUrl}` : finalBody,
        });
        if (mail.ok && mail.sent > 0) setStatus("Sent and emailed");
        else if (mail.notConfigured) setStatus("Sent to chat. Email is not configured yet.");
        else setStatus("Sent to chat. Email failed: " + (mail.error ?? "unknown error"));
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
              <Status state={c.available ? "online" : "pending"} label={c.available ? "Available now" : "Coming soon"} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Label style shared by the composer's option toggles.
  const optLbl: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, font: "600 12px/1 var(--font-sans)", color: "var(--ink-soft)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 172px)", minHeight: 520 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flex: "none" }}>
        <h1 style={{ font: "700 22px/28px var(--font-sans)", color: "var(--ink)", margin: 0 }}>Messages</h1>
        <Pill tone="grey">{countryByCode(country)?.name}</Pill>
        <button type="button" onClick={() => { setCountry(null); setSel(null); }} style={{ background: "none", border: "none", cursor: "pointer", font: "600 12px/1 var(--font-sans)", color: "var(--indigo-600)" }}>change</button>
      </div>

      <div className="chat-shell" style={{ gridTemplateColumns: "282px minmax(0,1fr) 272px", flex: 1, minHeight: 0 }}>
        {/* ── LEFT: conversations ── */}
        <div className="chat-col">
          <div className="chat-list">
            <Input icon={fieldIcon("search")} placeholder="Search name, ID or email" aria-label="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="chat-tabs">
              {([["all", "All plans"], ["full", "Full service"], ["self", "Self service"]] as const).map(([f, label]) => (
                <button key={f} type="button" className={`chat-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>{label}</button>
              ))}
            </div>
            {shown.length === 0 ? (
              <ChatEmpty icon={<Users size={22} />} title="No conversations" sub="No student matches this search or filter." />
            ) : shown.map((u) => (
              <button key={u.id} type="button" onClick={() => openConvo(u.id)} className={`chat-convo${sel === u.id ? " active" : ""}`}>
                <ChatAvatar size={38} src={avatars[u.id]} online={onlineUsers.has(u.id)} user={{ id: u.id, name: u.full_name, gender: u.gender, avatarSeed: u.avatar_seed, avatarStyle: u.avatar_style }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="chat-convo-name">{u.full_name || "Unnamed"}</span>
                  <span className="chat-convo-meta">
                    <span>{awu(u.user_number)}</span>
                    <Pill tone={u.plan === "full_service" ? "indigo" : "green"} style={{ padding: "2px 8px", fontSize: 9 }}>{u.plan === "full_service" ? "Full" : "Self"}</Pill>
                    <span>Direct</span>
                  </span>
                </span>
                {(unread[u.id] ?? 0) > 0 && <span className="chat-unread">{unread[u.id] > 9 ? "9+" : unread[u.id]}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: header, actions, thread, composer ── */}
        <div className="chat-col">
          {!selUser ? (
            <ChatEmpty icon={<MessageCircle size={24} />} title="Select a conversation" sub="Pick a student on the left to open the conversation." />
          ) : (
            <>
              <header className="chat-header">
                <button type="button" className="chat-header-btn" onClick={() => setShowInfo(true)} title="Open student profile">
                  <ChatAvatar size={40} src={avatars[selUser.id]} online user={{ id: selUser.id, name: selUser.full_name, gender: selUser.gender, avatarSeed: selUser.avatar_seed, avatarStyle: selUser.avatar_style }} />
                  <span style={{ minWidth: 0 }}>
                    <span className="chat-header-name">{selUser.full_name || "Unnamed"}</span>
                    <span className="chat-header-sub"><Mail size={12} />{selUser.email || "—"}</span>
                  </span>
                  <Info size={15} style={{ color: "var(--indigo-600)", flex: "none" }} />
                </button>
                <button type="button" className="chat-act" onClick={downloadConversation} title="Download the pinned conversation" aria-label="Download conversation"><Download size={15} /></button>
              </header>

              {/* Quick actions sit above the thread. */}
              <div className="chat-actions">
                <Toggle checked={emailOn} onChange={setEmailOn} ariaLabel="Also email this message" label={<span style={optLbl}><Mail size={14} />Email</span>} />
                <Toggle checked={pinOn} onChange={setPinOn} ariaLabel="Pin this message" label={<span style={optLbl}><Pin size={14} />Pin</span>} />
                <Toggle checked={whatsappOn} onChange={setWhatsappOn} ariaLabel="WhatsApp alert (coming soon)" label={<span style={optLbl}><MessageCircle size={14} />WhatsApp</span>} />
                <Toggle checked={showQ} onChange={setShowQ} ariaLabel="Ask a question" label={<span style={optLbl}><CircleHelp size={14} />Question</span>} />
              </div>

              <div ref={threadRef} className="chat-thread stu-chat-texture">
                {msgs.length === 0 && <ChatEmpty icon={<MessageCircle size={24} />} title="No messages yet" sub="Send the first update to this student." />}
                {msgs.map((m) => (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    mine={m.sender === "admin"}
                    quoted={m.reply_to ? msgs.find((x) => x.id === m.reply_to) : null}
                    quotedAuthor={m.reply_to && msgs.find((x) => x.id === m.reply_to)?.sender === "admin" ? "You" : selUser.full_name || "Student"}
                    onReply={() => setReplyTo(m)}
                    onDownload={() => downloadFile(m.file_path, m.file_name)}
                    onViewFile={() => viewFile(m.file_path)}
                    onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m, kind: "msg" }); }}
                    footer={m.sender === "admin" ? (
                      <button type="button" onClick={() => togglePin(m)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "600 10px/1 var(--font-sans)", padding: 0, textDecoration: "underline" }}>{m.pinned ? "unpin" : "pin"}</button>
                    ) : null}
                  />
                ))}
                {uploadingName && <UploadingBubble name={uploadingName} />}
              </div>

              <div className="chat-composer">
                {file && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--indigo-tint)", border: "1px solid var(--indigo-line)", borderRadius: 12, padding: "7px 12px", marginBottom: 8 }}>
                    <span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--indigo-text)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Attached: {file.name}</span>
                    <button type="button" className="chat-act" onClick={() => setFile(null)} aria-label="Remove attachment"><X size={14} /></button>
                  </div>
                )}
                {showQ && (
                  <div style={{ border: "1px solid var(--line)", borderRadius: 16, padding: 12, marginBottom: 10, display: "flex", flexDirection: "column", gap: 8, background: "var(--subtle)" }}>
                    <Input icon={fieldIcon("message")} placeholder="Question" value={qText} onChange={(e) => setQText(e.target.value)} />
                    {qOpts.map((o, i) => <Input key={i} icon={fieldIcon("text")} placeholder={`Answer ${i + 1}`} value={o} onChange={(e) => setQOpts(qOpts.map((x, j) => j === i ? e.target.value : x))} />)}
                    {qOpts.length < 4 && <button type="button" onClick={() => setQOpts([...qOpts, ""])} style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", font: "600 12px/1 var(--font-sans)", color: "var(--indigo-600)" }}>+ Add answer</button>}
                  </div>
                )}
                {whatsappOn && <div style={{ font: "500 11.5px/16px var(--font-sans)", color: "var(--amber)", marginBottom: 8 }}>WhatsApp alerts are coming soon, this message posts to the chat for now.</div>}
                {replyTo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--subtle)", borderLeft: "3px solid var(--indigo-600)", borderRadius: 12, padding: "7px 12px", marginBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: "600 10.5px/14px var(--font-sans)", color: "var(--indigo-600)" }}>Replying to {replyTo.sender === "admin" ? "yourself" : selUser?.full_name || "student"}</div>
                      <div style={{ font: "400 12px/16px var(--font-sans)", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.body?.slice(0, 70) || replyTo.file_name || "Attachment"}</div>
                    </div>
                    <button type="button" className="chat-act" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={14} /></button>
                  </div>
                )}
                <div className="af-composer">
                  <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach a file" title="Attach a file" style={{ flex: "none", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "none", background: "none", cursor: "pointer", color: "var(--indigo-600)" }}>
                    <Paperclip size={18} />
                  </button>
                  <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  <input placeholder="Write a message…" value={body} onChange={(e) => { setBody(e.target.value); if (sel) broadcastAdvisorTyping(sel); }} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} className="af-composer-input" />
                  <button type="button" className="chat-send" disabled={sending} onClick={send}>
                    {sending ? <><Loader size={16} onDark />Sending</> : <><Send size={15} />{emailOn ? "Send & email" : "Send"}</>}
                  </button>
                </div>
                {status && <div style={{ font: "500 12px/17px var(--font-sans)", color: status.startsWith("Failed") ? "var(--red)" : "var(--green)", marginTop: 8 }}>{status}</div>}
              </div>
            </>
          )}
        </div>

        {/* ── RIGHT: pinned updates + documents ── */}
        <div className="chat-col">
          <PanelCard
            icon={<Pin size={15} />} title="Pinned updates"
            isEmpty={!selUser || pinned.length === 0}
            empty={<ChatEmpty art="pinned" title="Nothing pinned yet" sub="Pin an important update and it stays here for the student." />}
          >
            {pinned.map((m) => (
              <div key={m.id} className="chat-panel-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", gap: 6 }}><Pill tone="indigo">Pinned</Pill>{m.emailed && <Status state="delivered" label="Emailed" />}</div>
                <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink)", whiteSpace: "pre-wrap" }}>{parseAsk(m.body)?.q ?? m.body ?? m.file_name}</div>
              </div>
            ))}
          </PanelCard>

          <PanelCard
            icon={<FileText size={15} />} title="Documents"
            action={<button type="button" className="chat-act" onClick={() => fileRef.current?.click()} disabled={!selUser} title="Share a new document" aria-label="Share a new document"><Plus size={15} /></button>}
            isEmpty={!selUser || files.length === 0}
            empty={<ChatEmpty art="documents" title="No documents shared" sub="Files you and the student exchange appear here." />}
          >
            {files.map((m) => (
              <div key={m.id} className="chat-panel-item" onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, msg: m, kind: "file" }); }}>
                <span style={{ flex: "none", width: 28, height: 28, borderRadius: 9, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}><FileText size={14} /></span>
                <span style={{ flex: 1, minWidth: 0, font: "500 12px/16px var(--font-sans)", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.file_name || "file"}</span>
                <button type="button" className="chat-act" onClick={(e) => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setMenu({ x: r.left - 150, y: r.bottom, msg: m, kind: "file" }); }} title="Options" aria-label="Document options"><EllipsisVertical size={15} /></button>
              </div>
            ))}
          </PanelCard>
        </div>
      </div>

      {menu && (
        <div style={{ position: "fixed", top: Math.min(menu.y, typeof window !== "undefined" ? window.innerHeight - 190 : menu.y), left: Math.max(8, Math.min(menu.x, typeof window !== "undefined" ? window.innerWidth - 170 : menu.x)), zIndex: 200, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "0 16px 40px rgba(23,35,58,.2)", padding: 6, minWidth: 158 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => { setReplyTo(menu.msg); setMenu(null); }} style={menuItem}><Reply size={15} />Reply</button>
          {menu.msg.file_path && <button type="button" onClick={() => { downloadFile(menu.msg.file_path, menu.msg.file_name); setMenu(null); }} style={menuItem}><Download size={15} />Download</button>}
          {menu.kind === "file" && menu.msg.file_path && <button type="button" onClick={() => renameFile(menu.msg)} style={menuItem}><Pencil size={15} />Rename</button>}
          {menu.msg.sender === "admin" && <button type="button" onClick={() => deleteMsg(menu.msg)} style={{ ...menuItem, color: "var(--red)" }}><Trash2 size={15} />Delete</button>}
        </div>
      )}

      {showInfo && selUser && (
        /* The same module the users tables open, no duplicate UI. */
        <UserDetails
          user={{
            id: selUser.id, full_name: selUser.full_name, email: selUser.email ?? null,
            plan: selUser.plan ?? null, avatar_url: avatars[selUser.id] ?? null,
          }}
          onClose={() => setShowInfo(false)}
          onNavigate={onOpenPlanModule ? () => onOpenPlanModule(selUser.plan ?? "self_service", selUser.id) : undefined}
        />
      )}
    </div>
  );
}

const menuItem: CSSProperties = { display: "flex", alignItems: "center", gap: 9, width: "100%", padding: "9px 11px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", font: "600 13px/1 var(--font-sans)", color: "var(--ink)", textAlign: "left" };
