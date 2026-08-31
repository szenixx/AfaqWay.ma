"use client";

/* NotificationInbox — the bell in the top bar and the list that drops out of
   it, rebuilt on HeroUI so the open/outside-click/Escape handling this used
   to hand-roll with its own window listener is the library's job instead.

   Desktop and mobile open through two different HeroUI primitives, on
   purpose, not one component squeezed to fit both:

   - Desktop stays exactly as it already behaved: a Popover anchored to the
     bell itself, bottom-end of it, the ordinary dropdown pattern for a
     top-bar icon.
   - Mobile is a centred Modal instead. The mobile top bar is a floating,
     centred pill — the bell sits inside it, not pinned to a screen edge —
     so there is no single "anchor to the icon" position that is also
     "centred on screen"; those two asks pull against each other once the
     trigger itself isn't at an edge. Placement="top" is the middle ground:
     it materialises just under the header, horizontally centred, with the
     Modal's own settle-in animation reading as "arrived from up near the
     bar" rather than a full-screen takeover.

   The list itself is identical either way: grouped by day, an icon tile in
   place of an avatar (there is no "actor" in this data — a notification is
   raised by the platform, not a person), title/body/time. Clicking a row
   marks it read and navigates to the page it's about — never removes it
   from the list; a read notification is exactly as available afterwards as
   before, same as the full Notifications module already behaves. */

import { useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Button, Modal, Popover } from "@heroui/react";
import { useNotifications, markRead, markAllRead, type Notification } from "@/lib/notifications";
import { notifIdentity } from "@/lib/notifIdentity";
import { useAfqHuiPortal } from "@/lib/useAfqHuiPortal";

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

/** The header + list, identical whichever shell (Popover or Modal) wraps it. */
function NotificationListContent({ userId, items, unread, reload, onOpen }: {
  userId: string;
  items: Notification[];
  unread: number;
  reload: () => Promise<void> | void;
  onOpen: (n: Notification) => void;
}) {
  let lastGroup = "";
  return (
    <>
      <header className="sw-notifpop-head">
        <span>Notifications</span>
        {unread > 0 && (
          <Button
            onPress={() => { void (async () => { await markAllRead(userId); await reload(); })(); }}
            size="sm" variant="tertiary"
          >
            <Check size={12} />Mark all read
          </Button>
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
              <button type="button" className={`sw-notifpop-row${n.read ? "" : " unread"}`} onClick={() => onOpen(n)}>
                {/* The tile says what KIND of thing this is before a word is
                    read: the platform's own mark for an announcement, the
                    route for the journey (coloured by how the step went), a
                    chat bubble for an unanswered advisor message. */}
                {/* Decorative: the title and body below already say what this
                    is, so the tile is not repeated to a screen reader. */}
                <span className="sw-notifpop-ico" data-tone={notifIdentity(n).tone} aria-hidden>
                  {notifIdentity(n).icon}
                </span>
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
    </>
  );
}

export function NotificationInbox({ userId, onOpen, plain }: {
  userId: string;
  /** Navigates the workspace to the notification's page. */
  onOpen: (link: string) => void;
  /** The mobile top bar's icon buttons render without the card background
      the desktop ones carry at rest — same trigger, same behaviour. Also
      the one switch between the two panel shells (see file header). */
  plain?: boolean;
}) {
  const { items, unread, reload } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const portal = useAfqHuiPortal(triggerRef);

  const openNotification = async (n: Notification) => {
    if (!n.read) { await markRead(userId, n.id); void reload(); }
    setOpen(false);
    // Read AFTER closing: the panel should not sit open while the page
    // underneath it changes.
    if (n.link) onOpen(n.link);
  };

  const triggerClass = `sw-iconbtn${plain ? " plain" : ""}${open ? " active" : ""}${unread > 0 ? " unread" : ""}`;

  if (plain) {
    return (
      <span ref={triggerRef} style={{ display: "contents" }}>
        <button aria-label="Notifications" className={triggerClass} data-notif-trigger onClick={() => setOpen(true)} type="button">
          <span className="sw-bell-ico"><Bell size={22} /></span>
          {unread > 0 && <span className="sw-dot sw-dot-plain" aria-hidden />}
        </button>

        <Modal>
          <Modal.Backdrop isOpen={open} onOpenChange={setOpen} UNSTABLE_portalContainer={portal ?? undefined}>
            <Modal.Container placement="top">
              <Modal.Dialog aria-label="Notifications" className="sw-notifpanel p-0 sm:max-w-[420px]">
                <Modal.CloseTrigger />
                <NotificationListContent items={items} onOpen={(n) => void openNotification(n)} reload={reload} unread={unread} userId={userId} />
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </span>
    );
  }

  return (
    <span ref={triggerRef} style={{ display: "contents" }}>
    <Popover isOpen={open} onOpenChange={setOpen}>
      {/* A plain element carries no press behaviour of its own — Popover's
          own PressResponder context is read only by a component that calls
          usePress (HeroUI's Button, or one wrapped in Pressable), never by
          a bare DOM element — so the trigger itself has to BE the pressable
          thing. Popover.Trigger already renders one (a div, role="button",
          wrapped in Pressable); nesting a second, real <button> inside it
          would just be two interactive elements announcing as one, so the
          icon markup here stays plain spans and every button-ish attribute
          (the label, the trigger hook, the visual classes) lives on
          Popover.Trigger instead. */}
      <Popover.Trigger aria-label="Notifications" className={triggerClass} data-notif-trigger>
        <span className="sw-bell-ico"><Bell size={22} /></span>
        {unread > 0 && <span className="sw-dot sw-dot-plain" aria-hidden />}
      </Popover.Trigger>

      <Popover.Content className="sw-notifpop" placement="bottom end" UNSTABLE_portalContainer={portal ?? undefined}>
        <Popover.Dialog aria-label="Notifications" className="p-0">
          <NotificationListContent items={items} onOpen={(n) => void openNotification(n)} reload={reload} unread={unread} userId={userId} />
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
    </span>
  );
}

export default NotificationInbox;
