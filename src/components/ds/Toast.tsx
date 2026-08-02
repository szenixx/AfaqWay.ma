"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  Bell, CheckCheck, CreditCard, FileText, MessageCircle, Megaphone,
  Route, TriangleAlert, X,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
/* Audio lives in one module for the whole platform; the toast does not own
   a second copy of it. */
import { playSoftChime } from "@/lib/notify";

/* Toast — the platform's floating notification.
 *
 * One stack, top-centre, above everything. Any module can raise one without
 * importing this file's internals: `toast({ ... })` posts to a tiny store and
 * the single <Toaster /> mounted in the workspace renders it. That indirection
 * is what lets a database subscription, a form handler and a realtime event all
 * announce themselves the same way.
 *
 * Each toast carries the platform mark, an icon for its kind, a title, a
 * preview of the message, the date and time, and an action that takes the
 * reader to the thing itself. The action is the point: a notification that
 * cannot be opened is just noise.
 *
 * Sound is a short two-tone chime, played at most once per toast and only
 * after the person has interacted with the page, because browsers refuse audio
 * before that and a refusal must not surface as an error. */

export type ToastKind =
  | "message" | "journey" | "payment" | "document" | "update"
  | "approved" | "rejected" | "changes" | "system";

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  /** One or two lines. Long bodies are clamped by CSS, never truncated here. */
  message?: string;
  /** ISO timestamp. Defaults to the moment the toast was raised. */
  at?: string;
  /** Label for the action button. */
  actionLabel?: string;
  /** Where the action goes. Omit for a toast that is purely informational. */
  onAction?: () => void;
  /** Milliseconds on screen. 0 keeps it until dismissed. */
  duration?: number;
  /** Suppresses the chime for toasts raised in bulk. */
  silent?: boolean;
};

type ToastInput = Omit<Toast, "id">;

/* ── Store ─────────────────────────────────────────────────────────────────
   Deliberately not React context: a Supabase callback or a plain async
   function must be able to raise a toast without being inside a component. */

let items: Toast[] = [];
const subscribers = new Set<(list: Toast[]) => void>();
const emit = () => { for (const fn of subscribers) fn(items); };

/** At most four on screen; older ones fall off rather than filling the view. */
const MAX = 4;

export function toast(input: ToastInput): string {
  const id = `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const next: Toast = { at: new Date().toISOString(), duration: 5000, ...input, id };
  /* Newest first, so an arrival lands at the top of the column where the eye
     already is, and older ones fall off the bottom. */
  items = [next, ...items].slice(0, MAX);
  emit();
  if (!next.silent) playSoftChime();
  return id;
}

export function dismissToast(id: string) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function subscribe(fn: (list: Toast[]) => void) {
  subscribers.add(fn);
  fn(items);
  return () => { subscribers.delete(fn); };
}

/** Public subscribe, for alternate renderers of the same toast store (e.g. the
 *  student workspace's gooey notification tray) that must not duplicate the
 *  notification-fetch/store logic above. */
export const subscribeToasts = subscribe;

/* ── Rendering ─────────────────────────────────────────────────────────────── */

const KIND: Record<ToastKind, { icon: ReactNode; tone: string }> = {
  message:  { icon: <MessageCircle size={13} />, tone: "indigo" },
  journey:  { icon: <Route size={13} />,         tone: "indigo" },
  payment:  { icon: <CreditCard size={13} />,    tone: "amber" },
  document: { icon: <FileText size={13} />,      tone: "indigo" },
  update:   { icon: <Megaphone size={13} />,     tone: "indigo" },
  approved: { icon: <CheckCheck size={13} />,    tone: "green" },
  rejected: { icon: <TriangleAlert size={13} />, tone: "red" },
  changes:  { icon: <TriangleAlert size={13} />, tone: "amber" },
  system:   { icon: <Bell size={13} />,          tone: "grey" },
};

function ToastCard({ item, onClose }: { item: Toast; onClose: () => void }) {
  const meta = KIND[item.kind] ?? KIND.system;
  /* `at` is stamped by `toast()` the moment the notification is raised, so
     render never has to read the clock. */
  const when = new Date(item.at ?? 0);

  /* The latest onClose is held in a ref, so the auto-dismiss timer does not
     restart every time the parent re-renders. */
  const latestClose = useRef(onClose);
  useEffect(() => { latestClose.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!item.duration) return;
    const t = window.setTimeout(() => latestClose.current(), item.duration);
    return () => window.clearTimeout(t);
  }, [item.duration]);

  return (
    <div className="ds-toast" role="status" aria-live="polite">
      <div className="ds-toast-head">
        <span className="ds-toast-brand"><BrandLogo size={20} /></span>
        <span className={`ds-toast-kind ${meta.tone}`}>{meta.icon}</span>
        <span className="ds-toast-title">{item.title}</span>
        <button type="button" className="ds-toast-x" onClick={() => latestClose.current()} aria-label="Dismiss"><X size={14} /></button>
      </div>

      {item.message && <p className="ds-toast-body">{item.message}</p>}

      <div className="ds-toast-foot">
        <span className="ds-toast-when">
          {when.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          {" · "}
          {when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
        {item.onAction && (
          <button
            type="button" className="ds-toast-act"
            onClick={() => { item.onAction?.(); latestClose.current(); }}
          >{item.actionLabel ?? "Click Here"}</button>
        )}
      </div>
    </div>
  );
}

/**
 * The single stack. Mount once, high in the tree; everything else calls
 * `toast()`. Rendered in a portal so no ancestor's overflow or stacking
 * context can clip it.
 *
 * A plain top-centre column: each notification appears, sits for its duration
 * (5s by default) and goes. No stacking, depth, or expand-on-hover motion.
 */
export function Toaster() {
  const [list, setList] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  // Portals need a DOM, so the stack appears only after hydration.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); return subscribe(setList); }, []);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="ds-toaster" aria-live="polite" aria-relevant="additions">
      {list.map((t) => <ToastCard key={t.id} item={t} onClose={() => dismissToast(t.id)} />)}
    </div>,
    document.body,
  );
}
