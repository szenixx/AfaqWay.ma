"use client";

/* NotificationInbox — a mini module that drops out of the bell button itself,
   the way godui's notification-inbox popover works: anchored to its trigger,
   not centred over the page. Grouped by day, one row per notification with an
   icon tile in place of an avatar (there is no "actor" in this data — a
   notification is raised by the platform, not a person) and a title/body/time
   stack, exactly the row shape the reference groups as actor/action/target.
   Clicking a row marks it read and navigates, the same behaviour the full
   Notifications module already has — this is the same list, closer to hand. */

import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useNotifications, markRead, markAllRead, type Notification } from "@/lib/notifications";
import { NOTIF_ICON } from "./Modules";

function dayGroup(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

const relTime = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
};

export function NotificationInbox({ userId, onOpen, onClose }: {
  userId: string;
  /** Navigates the workspace to the notification's page, then closes the popover. */
  onOpen: (link: string) => void;
  onClose: () => void;
}) {
  const { items, unread, reload } = useNotifications(userId);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* The bell button itself sits outside this popover's own DOM subtree, so
       without the trigger check below, tapping it while open used to fire
       both handlers in the same gesture: mousedown closes here first, then
       click re-opens via the trigger's own setNotifOpen(v => !v) — the
       popover would visually close and instantly reopen, unable to be
       dismissed by re-tapping the bell. */
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (ref.current && !ref.current.contains(target) && !target.closest?.("[data-notif-trigger]")) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", key); };
  }, [onClose]);

  const open = async (n: Notification) => {
    if (!n.read) { await markRead(n.id); void reload(); }
    if (n.link) onOpen(n.link);
    onClose();
  };

  let lastGroup = "";

  return (
    <div ref={ref} className="sw-notifpop" role="dialog" aria-label="Notifications">
      <header className="sw-notifpop-head">
        <span>Notifications</span>
        {unread > 0 && (
          <button type="button" onClick={() => { void markAllRead(userId); void reload(); }}>
            <Check size={12} />Mark all read
          </button>
        )}
      </header>

      <div className="sw-notifpop-list">
        {items.length === 0 ? (
          <div className="sw-notifpop-empty">
            <Bell size={22} />
            <span>Nothing yet</span>
          </div>
        ) : items.slice(0, 20).map((n) => {
          const g = dayGroup(n.created_at);
          const showHeader = g !== lastGroup;
          lastGroup = g;
          return (
            <div key={n.id}>
              {showHeader && <div className="sw-notifpop-group">{g}</div>}
              <button type="button" className={`sw-notifpop-row${n.read ? "" : " unread"}`} onClick={() => open(n)}>
                <span className="sw-notifpop-ico">{NOTIF_ICON[n.kind] ?? <Bell size={15} />}</span>
                <span className="sw-notifpop-body">
                  <span className="sw-notifpop-title">{n.title}</span>
                  {n.body && <span className="sw-notifpop-sub">{n.body}</span>}
                </span>
                <span className="sw-notifpop-time">{relTime(n.created_at)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationInbox;
