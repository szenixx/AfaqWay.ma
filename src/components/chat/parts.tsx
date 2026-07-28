"use client";

import type { CSSProperties, ReactNode } from "react";
import { Download, Paperclip, Reply, ArrowRight } from "lucide-react";
import { UserAvatar, type UserAvatarUser, Loader } from "@/components/ds";
import { parseAsk } from "@/lib/chat";

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
  pinned: "/illustrations/empty-pinned.png",
  documents: "/illustrations/empty-documents.png",
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

const time = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function MessageBubble({ msg, mine, quoted, quotedAuthor, onReply, onDownload, onViewFile, onContextMenu, footer, onAnswer, onOpenDecision }: {
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
}) {
  const ask = parseAsk(msg.body);
  const decision = decisionOf(msg);
  return (
    <div className={`chat-row${mine ? " mine" : ""}`} onContextMenu={onContextMenu}>
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

        <div className="chat-time">
          <span>{time(msg.created_at)}</span>
          {msg.emailed && <span style={{ color: mine ? "rgba(255,255,255,.85)" : "var(--green)" }}>emailed</span>}
          {footer}
        </div>
      </div>

      <div className="chat-acts">
        <button type="button" className="chat-act" onClick={onReply} title="Reply" aria-label="Reply"><Reply size={14} /></button>
        {msg.file_path && <button type="button" className="chat-act" onClick={onDownload} title="Download" aria-label="Download"><Download size={14} /></button>}
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
      <div className="chat-bubble" style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Loader size={16} onDark />
        <span className="chat-text" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Uploading {name}…</span>
      </div>
    </div>
  );
}
