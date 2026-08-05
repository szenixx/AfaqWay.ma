"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Download, Paperclip, Reply, ArrowRight, MoreVertical, CheckCheck } from "lucide-react";
import { UserAvatar, type UserAvatarUser, Loader } from "@/components/ds";
import { parseAsk, QUICK_REACTIONS, type Reactions } from "@/lib/chat";

/* Pieces shared by the admin console chat and the student workspace chat, so
   both sides are literally the same product: same bubbles, same panel cards,
   same empty states, same avatars. Visuals live in ds.css (.chat-*). */

/* ── Avatar with presence ─────────────────────────────────────────────────── */

export function ChatAvatar({ size = 38, src, online, verified, user }: {
  size?: number; src?: string | null; online?: boolean; verified?: boolean; user?: UserAvatarUser | null;
}) {
  return (
    <UserAvatar
      size={size} showStatus={online !== undefined}
      user={{ ...(user ?? {}), avatarUrl: src ?? user?.avatarUrl ?? null, online, verified }}
    />
  );
}

/* ── Empty states ─────────────────────────────────────────────────────────── */

export type EmptyArt = "pinned" | "documents";
const ART: Record<EmptyArt, string> = {
  pinned: "/illustrations/empty-pinned.webp",
  documents: "/illustrations/empty-documents.webp",
};

export function ChatEmpty({ art, title, sub, icon, action }: { art?: EmptyArt; title: string; sub?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="chat-empty">
      {art
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={ART[art]} alt="" />
        : icon && <span style={{ width: 54, height: 54, borderRadius: 18, background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>}
      <div style={{ font: "700 13.5px/19px var(--font-sans)", color: "var(--ink)" }}>{title}</div>
      {sub && <div style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 240 }}>{sub}</div>}
      {action}
    </div>
  );
}

/* ── Right-panel card (Pinned updates / Documents) ────────────────────────── */

export function PanelCard({ icon, title, action, isEmpty, empty, children }: {
  icon: ReactNode; title: string; action?: ReactNode; isEmpty: boolean; empty: ReactNode; children?: ReactNode;
}) {
  return (
    <section className="chat-panel">
      <header className="chat-panel-head">
        <span style={{ width: 28, height: 28, borderRadius: 9, flex: "none", background: "var(--indigo-tint)", color: "var(--indigo-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
        <span className="chat-panel-title">{title}</span>
        {action}
      </header>
      {isEmpty ? empty : <div className="chat-panel-body">{children}</div>}
    </section>
  );
}

/* ── Message bubble ───────────────────────────────────────────────────────── */

export type ChatMsg = {
  id: string; sender: string; body: string; file_path: string | null; file_name: string | null;
  created_at: string; reply_to: string | null; pinned?: boolean; emailed?: boolean;
  /** Set on review decisions, so the card can colour itself and link back. */
  meta?: DecisionMeta | null;
  reactions?: Reactions | null;
  /** Stamped once the other side has opened the thread. */
  seen_at?: string | null;
};

/** A review decision announced in the chat. Written by lib/journeyNotify. */
export type DecisionMeta = {
  kind?: string;
  outcome?: "approved" | "rejected" | "changes_requested";
  stageId?: string;
  stepId?: string;
  stageTitle?: string;
  stepTitle?: string;
};

/** Outcome → the colour of the top highlight. Nothing else on the card changes. */
const DECISION_TONE: Record<string, string> = {
  approved: "green", rejected: "red", changes_requested: "amber",
};

export const decisionOf = (msg: ChatMsg): DecisionMeta | null =>
  msg.meta && msg.meta.outcome && DECISION_TONE[msg.meta.outcome] ? msg.meta : null;

const seenTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

/** "Today" / "Yesterday" / "5 March", each paired with the clock time of the
 *  first message that landed in that calendar day. */
function dayDividerLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const day = sameDay(d, now) ? "Today" : sameDay(d, yesterday) ? "Yesterday" : d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
  const clock = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${clock}`;
}

/** The divider that replaces the per-bubble timestamp: one centred line
 *  between bubbles, shown once per calendar day — so it appears at most once
 *  every 24 hours, on the first message of a new day. */
export function ChatDayDivider({ iso }: { iso: string }) {
  return (
    <div className="chat-day-divider" role="separator">
      <span>{dayDividerLabel(iso)}</span>
    </div>
  );
}

/** True when `iso` is the first message of its calendar day within `all` —
 *  i.e. where the day divider belongs. Shared by both chats so "once per 24h"
 *  means the same thing everywhere. */
export function isNewChatDay(all: { created_at: string }[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(all[index - 1].created_at);
  const cur = new Date(all[index].created_at);
  return prev.toDateString() !== cur.toDateString();
}

const AVATAR_GROUP_GAP_MS = 12 * 60 * 60 * 1000;

/** True when message `index` should carry the avatar — the last of a
 *  consecutive same-sender run (BubbleGroup's idea), OR a same-sender message
 *  that follows a 12h+ gap. A long silence starts a new "session": the bubble
 *  right before the gap keeps its own avatar rather than losing it to a
 *  message that arrives half a day later, and the one after the gap gets its
 *  own too, even though nothing about the sender changed. */
export function isLastOfGroup(all: { sender: string; created_at: string }[], index: number): boolean {
  const next = all[index + 1];
  if (!next) return true;
  if (next.sender !== all[index].sender) return true;
  return new Date(next.created_at).getTime() - new Date(all[index].created_at).getTime() > AVATAR_GROUP_GAP_MS;
}

/** The row's whole action set — react, reply, download — collapsed behind one
 *  borderless three-dot trigger next to the bubble, instead of a row of
 *  separately-chromed icon buttons. Closes on an outside click or after a
 *  pick. Owns no server state — `onReact`'s RPC round trip and the row
 *  re-render come from the realtime subscription, same as every other
 *  message field. */
function MessageMenu({ mine, onReact, onReply, onDownload }: {
  mine: boolean; onReact?: (emoji: string) => void; onReply: () => void; onDownload?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const doOpen = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Roughly clear the row's bottom edge so a trigger near the foot of the
    // thread doesn't open a menu that runs off-screen.
    const estHeight = 160;
    const top = rect.bottom + estHeight > window.innerHeight ? Math.max(8, rect.bottom - estHeight) : rect.top;
    setPos(mine ? { top, right: window.innerWidth - rect.left + 4 } : { top, left: rect.right + 4 });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (btnRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    // A `position: fixed` menu doesn't track its trigger's scroll position,
    // so any scroll (capture: true catches it on nested scroll containers
    // like the thread, not just the window) closes the menu instead of
    // leaving it stranded over the wrong row.
    const onScroll = () => setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("scroll", onScroll, true); };
  }, [open]);

  return (
    <>
      <button ref={btnRef} type="button" className="chat-morebtn" onClick={() => (open ? setOpen(false) : doOpen())} title="More" aria-label="More actions"><MoreVertical size={15} /></button>
      {open && pos && createPortal(
        /* Portaled to <body>: the row lives inside a scrolling, overflow-
           clipped thread, so a menu positioned within that row can never
           paint above the composer or any other frame — only escaping the
           whole tree to the document root can. */
        <div ref={menuRef} className={`chat-more-menu${mine ? " mine" : ""}`} style={{ position: "fixed", top: pos.top, left: pos.left, right: pos.right }}>
          {onReact && (
            <div className="chat-more-react">
              {QUICK_REACTIONS.map((e) => (
                <button key={e} type="button" onClick={() => { onReact(e); setOpen(false); }} aria-label={`React ${e}`}>{e}</button>
              ))}
            </div>
          )}
          <button type="button" className="chat-more-row" onClick={() => { onReply(); setOpen(false); }}><Reply size={14} />Reply</button>
          {onDownload && (
            <button type="button" className="chat-more-row" onClick={() => { onDownload(); setOpen(false); }}><Download size={14} />Download</button>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

/** The reaction pills under a bubble — one per emoji, with a count once more
 *  than one side has used it, highlighted when the viewer's own side is
 *  among the reactors. */
function ReactionsRow({ reactions, viewerSide, onToggle }: { reactions: Reactions; viewerSide: "user" | "admin"; onToggle: (emoji: string) => void }) {
  const entries = Object.entries(reactions).filter(([, sides]) => sides.length > 0);
  if (entries.length === 0) return null;
  return (
    <div className="chat-reactions">
      {entries.map(([emoji, sides]) => (
        <button
          key={emoji} type="button" onClick={() => onToggle(emoji)}
          className={`chat-reaction-pill${sides.includes(viewerSide) ? " active" : ""}`}
        >
          <span>{emoji}</span>{sides.length > 1 && <span>{sides.length}</span>}
        </button>
      ))}
    </div>
  );
}

export function MessageBubble({
  msg, mine, quoted, quotedAuthor, onReply, onDownload, onViewFile, onContextMenu, footer, onAnswer, onOpenDecision,
  otherAvatar, isLastOfGroup = true, viewerSide, onReact, seen,
}: {
  msg: ChatMsg;
  mine: boolean;
  quoted?: ChatMsg | null;
  /** Display name for the quoted message's author. */
  quotedAuthor?: string;
  onReply: () => void;
  onDownload: () => void;
  onViewFile: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  /** Extra controls under the timestamp (e.g. the admin's pin/unpin). */
  footer?: ReactNode;
  /** Student side: tapping an option of an interactive question answers it. */
  onAnswer?: (option: string) => void;
  /** Student side: opens the Journey on the step this decision belongs to. */
  onOpenDecision?: (decision: DecisionMeta) => void;
  /** The other party's avatar. Rendered only on their messages, never on the
   *  viewer's own — inside the thread, next to each of their bubbles, the way
   *  every consumer chat app shows the other person and never yourself. */
  otherAvatar?: ReactNode;
  /** False for every message except the last in a run of consecutive
   *  same-sender messages — a "message group", the way BubbleGroup collapses
   *  a run to one avatar. Earlier messages in the run still reserve the
   *  avatar's width (so the bubble column doesn't shift), they just don't
   *  paint it. */
  isLastOfGroup?: boolean;
  /** Which side the signed-in viewer is on, for reaction highlighting. */
  viewerSide: "user" | "admin";
  /** Reacts as the viewer. Omit to hide the reaction control entirely. */
  onReact?: (messageId: string, emoji: string) => void;
  /** True only on the viewer's own last message once the other side has
   *  read it — a single "Seen" line, not a per-message receipt. */
  seen?: boolean;
}) {
  const ask = parseAsk(msg.body);
  const decision = decisionOf(msg);
  return (
    /* The id is on the row so the conversation can scroll straight to one
       message, e.g. the first unread when arriving from a notification. */
    <div className={`chat-row${mine ? " mine" : ""}`} data-msg={msg.id} onContextMenu={onContextMenu}>
      <div className="chat-msgcol">
      {/* Avatar + bubble share one row, so the avatar's cross-axis alignment
          (flex-end = bottom) measures against the bubble alone — not the
          reactions/time/seen text stacked below it, which live outside this
          row entirely. That's what keeps the avatar level with the bubble
          instead of sinking to match whatever meta text happens to follow. */}
      <div className="chat-bubblewrap">
      {!mine && (
        <span className={`chat-row-avatar${isLastOfGroup ? "" : " spacer"}`}>
          {isLastOfGroup ? otherAvatar : null}
        </span>
      )}
      {/* Mine: the menu sits on the outer (left) side of the own bubble, the
          side away from the screen edge — the same side WhatsApp puts it. */}
      {mine && (
        <div className="chat-acts">
          <MessageMenu mine={mine} onReact={onReact ? (emoji) => onReact(msg.id, emoji) : undefined} onReply={onReply} onDownload={msg.file_path ? onDownload : undefined} />
        </div>
      )}
      {/* Reactions anchor to and overlap the bubble's own bottom corner —
          BubbleReactions' idea — rather than sit in the meta flow below it. */}
      <div className="chat-bubble-slot">
      <div className={`chat-bubble${msg.pinned ? " pinned" : ""}${decision ? ` decision tone-${DECISION_TONE[decision.outcome as string]}` : ""}`}>
        {/* A thin bar across the top, and nothing else about the card changes. */}
        {decision && <span className="chat-decision-bar" aria-hidden />}
        {quoted && (
          <div style={{ borderLeft: `3px solid ${mine ? "rgba(255,255,255,.65)" : "var(--indigo-600)"}`, background: mine ? "rgba(255,255,255,.14)" : "rgba(22,46,140,.06)", borderRadius: 8, padding: "5px 9px", marginBottom: 7 }}>
            <span style={{ display: "block", font: "600 10.5px/14px var(--font-sans)", color: mine ? "rgba(255,255,255,.9)" : "var(--indigo-600)" }}>{quotedAuthor}</span>
            <span style={{ display: "block", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: "400 11.5px/16px var(--font-sans)", color: mine ? "rgba(255,255,255,.75)" : "var(--ink-soft)" }}>
              {parseAsk(quoted.body)?.q ?? quoted.body?.slice(0, 60) ?? quoted.file_name ?? "Attachment"}
            </span>
          </div>
        )}

        {ask ? (
          <div>
            <div className="chat-text" style={{ fontWeight: 600 }}>{ask.q}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 7 }}>
              {ask.opts.map((o, i) => onAnswer ? (
                <button key={i} type="button" onClick={() => onAnswer(o)} style={askOpt}>{i + 1}. {o}</button>
              ) : (
                <div key={i} style={askOpt}>{i + 1}. {o}</div>
              ))}
            </div>
          </div>
        ) : msg.body ? <div className="chat-text">{msg.body}</div> : null}

        {msg.file_path && (
          <button type="button" onClick={onViewFile} style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: msg.body ? 7 : 0, background: mine ? "rgba(255,255,255,.16)" : "var(--subtle)", border: `1px solid ${mine ? "rgba(255,255,255,.28)" : "var(--line)"}`, borderRadius: 10, padding: "6px 10px", cursor: "pointer", font: "600 11.5px/1 var(--font-sans)", color: mine ? "#fff" : "var(--indigo-600)" }}>
            <Paperclip size={13} />{msg.file_name || "file"}
          </button>
        )}

        {decision && onOpenDecision && (
          <div className="chat-decision-cta">
            <button type="button" className="chat-decision-link" onClick={() => onOpenDecision(decision)}>
              Click Here<ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {onReact && msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <ReactionsRow reactions={msg.reactions} viewerSide={viewerSide} onToggle={(emoji) => onReact(msg.id, emoji)} />
      )}
      </div>
      {/* Other side: the menu sits on the outer (right) side of their bubble. */}
      {!mine && (
        <div className="chat-acts">
          <MessageMenu mine={mine} onReact={onReact ? (emoji) => onReact(msg.id, emoji) : undefined} onReply={onReply} onDownload={msg.file_path ? onDownload : undefined} />
        </div>
      )}
      </div>

      {/* The per-message timestamp moved out of here — a centred day divider
          in the thread carries the date now (ChatDayDivider), so this row
          only appears when there's something else to say. */}
      {(msg.emailed || footer) && (
        <div className="chat-time">
          {msg.emailed && <span style={{ color: "var(--green)" }}>emailed</span>}
          {footer}
        </div>
      )}
      {seen && (
        <div className="chat-seen"><CheckCheck size={12} />Seen{msg.seen_at ? ` ${seenTime(msg.seen_at)}` : ""}</div>
      )}
      </div>
    </div>
  );
}

const askOpt: CSSProperties = {
  border: "1px solid var(--indigo-line)", borderRadius: 10, padding: "7px 11px", background: "var(--card)",
  font: "500 12.5px/17px var(--font-sans)", color: "var(--indigo-text)", textAlign: "left", cursor: "pointer", width: "100%",
};

/* Uploading placeholder shown in the thread while a file is on its way. */
export function UploadingBubble({ name }: { name: string }) {
  return (
    <div className="chat-row mine">
      <div className="chat-msgcol">
        <div className="chat-bubble" style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Loader size={16} onDark />
          <span className="chat-text" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Uploading {name}…</span>
        </div>
      </div>
    </div>
  );
}
