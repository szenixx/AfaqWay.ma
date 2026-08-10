"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { emailAnnouncement } from "@/lib/email/client";
import { raiseSonnerNotification } from "@/lib/sonnerNotify";

/* The notification centre.

   Everything that happens to a student lands here: a journey decision, a
   document verification, a schedule reminder, a platform announcement. The
   centre reads one table, so a new source only has to insert a row.

   Degrades quietly until 14_platform_updates.sql is applied: reads come back
   empty and the module shows its empty state instead of breaking. */

export type NotifKind = "update" | "journey" | "document" | "schedule" | "message" | "payment" | "system";

export type Notification = {
  id: string;
  user_id: string;
  kind: NotifKind;
  title: string;
  body: string;
  /** Workspace page to open, e.g. "journey" or "documents". */
  link: string;
  read: boolean;
  created_at: string;
};

export type PlatformUpdate = {
  id: string;
  title: string;
  body: string;
  attachments: { path: string; fileName: string; mimeType?: string; size?: number }[];
  author_email: string | null;
  created_at: string;
};

/** True once the migration has been applied. */
export async function notificationsReady(): Promise<boolean> {
  const { error } = await supabase.from("notifications").select("id").limit(1);
  return !error;
}

export async function fetchNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications").select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(limit);
  return error ? [] : ((data ?? []) as Notification[]);
}

export async function markRead(userId: string, id: string, read = true): Promise<void> {
  // Instant, in this tab, before the network call even resolves — the bell's
  // dot and ringing animation stop the moment the student acts, not once a
  // round trip (or worse, a realtime one) comes back around.
  applyLocal(userId, (items) => items.map((n) => (n.id === id ? { ...n, read } : n)));
  const { error } = await supabase.from("notifications").update({ read }).eq("id", id);
  // A blocked/failed write must never be left reading as read — reconcile
  // with what the server actually has, which un-does the optimistic patch
  // above if the write didn't really go through.
  if (error) { console.warn("[notifications] markRead failed:", error.message); notifyLocal(userId); }
}

export async function markAllRead(userId: string): Promise<void> {
  applyLocal(userId, (items) => items.map((n) => ({ ...n, read: true })));
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) { console.warn("[notifications] markAllRead failed:", error.message); notifyLocal(userId); }
}

export async function removeNotification(id: string): Promise<void> {
  await supabase.from("notifications").delete().eq("id", id);
}

/**
 * Raises a notification for one student. Called wherever something happens to
 * them, so the centre never has to poll another table.
 */
export async function notify(
  userId: string,
  input: { kind: NotifKind; title: string; body?: string; link?: string },
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId, kind: input.kind, title: input.title,
    body: input.body ?? "", link: input.link ?? "",
  });
  // A failed notification must never take down the action that caused it.
  if (error) console.warn("notification not delivered", error.message);
}

/* ── Platform updates ─────────────────────────────────────────────────────── */

export async function fetchUpdates(limit = 30): Promise<PlatformUpdate[]> {
  const { data, error } = await supabase
    .from("platform_updates").select("*").order("created_at", { ascending: false }).limit(limit);
  return error ? [] : ((data ?? []) as PlatformUpdate[]);
}

/** Removes one announcement record. Notifications already delivered stay. */
export async function deleteUpdate(id: string): Promise<void> {
  await supabase.from("platform_updates").delete().eq("id", id);
}

/** Clears the whole announcement history. Delivered notifications stay. */
export async function clearUpdates(): Promise<void> {
  // A filter is required; every real row has a created_at.
  await supabase.from("platform_updates").delete().not("created_at", "is", null);
}

/**
 * Publishes an announcement.
 *
 * Three deliveries, in order of importance:
 *   1. the platform_updates row, which a trigger fans out to a notification for
 *      every active student, so this stays one insert at any scale;
 *   2. email, one message per student through the platform email service;
 *   3. nothing else — the notification centre is the record.
 *
 * Email never blocks publishing. The announcement is already stored and every
 * student already has it in the platform, so a mail failure is reported, not
 * thrown.
 */
export async function publishUpdate(input: {
  title: string;
  body: string;
  attachments: PlatformUpdate["attachments"];
}): Promise<{ ok: boolean; error?: string; emailed?: number; emailFailed?: number; emailSkipped?: number }> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("platform_updates").insert({
    title: input.title, body: input.body, attachments: input.attachments,
    author_email: auth.user?.email ?? null, created_by: auth.user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };

  const mail = await emailUpdate(input);
  return { ok: true, ...mail };
}

/**
 * Recipients of an announcement: EVERY account with an email address.
 *
 * Deliberately no payment condition. An announcement is platform news, so it
 * reaches people who have paid, people mid-onboarding and people who never
 * subscribed. The only exclusion is a suspended account.
 *
 * Read in pages: PostgREST caps the rows one request returns, so a single
 * select would silently stop at that cap and the update would reach only the
 * first slice of the audience.
 */
async function recipients(): Promise<{ email: string; name: string }[]> {
  const PAGE = 1000;
  const out: { email: string; name: string }[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("banned", false)
      .not("email", "is", null)
      .order("id")                       // stable order, so pages cannot overlap
      .range(from, from + PAGE - 1);
    if (error) break;

    const page = (data ?? []) as { email: string | null; full_name: string | null }[];
    for (const person of page) {
      if (person.email) out.push({ email: person.email, name: (person.full_name ?? "").split(" ")[0] });
    }
    if (page.length < PAGE) break;       // last page
  }

  // One address may appear twice if a profile was duplicated; send once.
  const seen = new Set<string>();
  return out.filter((p) => {
    const key = p.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Sends the announcement by email through the platform's email service.
 *
 * The recipient list is built here because only this module knows who an
 * announcement is for; rendering, the sender identity and the provider all
 * live behind /api/email, so this function holds no template and no key.
 */
async function emailUpdate(input: { title: string; body: string }) {
  const people = await recipients();
  if (people.length === 0) return { emailed: 0, emailFailed: 0 };

  const result = await emailAnnouncement({
    to: people,
    subject: input.title,
    message: input.body,
  });
  return { emailed: result.sent, emailFailed: result.failed, emailSkipped: result.skipped };
}

/* ── Live centre ──────────────────────────────────────────────────────────── */

/* One realtime channel per user, however many components are listening.
 *
 * supabase-js returns the SAME channel object for a repeated topic, so a second
 * `.on()` after the first `.subscribe()` throws and takes the page down. The
 * workspace legitimately reads notifications from more than one place at once —
 * the sidebar badge and the Overview card — so the subscription is shared and
 * reference-counted here instead of being created per component. */
/* Listeners receive the inserted row when there is one, so a subscriber that
   only cares about arrivals (the floating toast) does not have to re-query. */
type NotifListener = (inserted: Notification | null) => void;
const listeners = new Map<string, Set<NotifListener>>();
const channels = new Map<string, ReturnType<typeof supabase.channel>>();

/** Tells every open useNotifications() for this user to re-fetch, the same
 *  way an incoming realtime event does — used to reconcile with the server
 *  after a write this tab made itself fails, so a rejected update doesn't
 *  leave the optimistic patch below showing something that never actually
 *  happened. */
function notifyLocal(userId: string): void {
  for (const fn of listeners.get(userId) ?? []) fn(null);
}

/* Optimistic local patches — separate from the realtime listeners above.
 * Marking read must never wait on a network round trip (let alone a
 * realtime one) before the bell's dot and animation stop: every open
 * useNotifications() for this user registers its own setItems here, and
 * markRead/markAllRead patch all of them synchronously, in this tab, the
 * instant the student acts. */
const localSetters = new Map<string, Set<(patch: (items: Notification[]) => Notification[]) => void>>();

function registerLocal(userId: string, setter: (patch: (items: Notification[]) => Notification[]) => void): () => void {
  let set = localSetters.get(userId);
  if (!set) { set = new Set(); localSetters.set(userId, set); }
  set.add(setter);
  return () => {
    const current = localSetters.get(userId);
    if (!current) return;
    current.delete(setter);
    if (current.size === 0) localSetters.delete(userId);
  };
}

function applyLocal(userId: string, patch: (items: Notification[]) => Notification[]): void {
  for (const setter of localSetters.get(userId) ?? []) setter(patch);
}

function subscribeNotifications(userId: string, onChange: NotifListener): () => void {
  let set = listeners.get(userId);
  if (!set) {
    set = new Set();
    listeners.set(userId, set);
    const channel = supabase
      .channel(`notifs-${userId.slice(0, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const inserted = payload.eventType === "INSERT" ? (payload.new as Notification) : null;
          for (const fn of listeners.get(userId) ?? []) fn(inserted);
        });
    channel.subscribe();
    channels.set(userId, channel);
  }
  set.add(onChange);

  return () => {
    const current = listeners.get(userId);
    if (!current) return;
    current.delete(onChange);
    // The channel closes only when the last listener has gone.
    if (current.size === 0) {
      listeners.delete(userId);
      const channel = channels.get(userId);
      if (channel) { void supabase.removeChannel(channel); channels.delete(userId); }
    }
  };
}

export function useNotifications(userId: string | null | undefined) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setItems(await fetchNotifications(userId));
    setLoading(false);
  }, [userId]);

  // Fetching from Supabase is the "subscribe to an external system" case; the
  // state set here is the query result, not derived render state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(userId, () => { void load(); });
  }, [userId, load]);

  useEffect(() => {
    if (!userId) return;
    return registerLocal(userId, (patch) => setItems(patch));
  }, [userId]);

  const unread = items.filter((n) => !n.read).length;
  return { items, unread, loading, reload: load };
}

/* ── Floating notifications ───────────────────────────────────────────────── */

/**
 * Raises a floating toast for every notification that arrives while the person
 * is looking at the platform. Rendered by sonner (its own icons/frame/type/
 * animation — see sonnerNotify.ts), not the ds Toast used everywhere else.
 *
 * The database row is the single source: whatever inserted it — a journey
 * decision, a document verification, a payment update, an announcement — gets a
 * toast without knowing this exists. That is the whole point of routing every
 * notification through one table.
 *
 * `onOpen` receives the row's `link`, which is the workspace page to show. It is
 * what the toast's action button calls, so a notification is never a dead end.
 */
export function useNotificationToasts(
  userId: string | null | undefined,
  onOpen: (link: string, notification: Notification) => void,
) {
  /* The callback is held in a ref so a parent re-render cannot tear down the
     subscription and miss an arrival in the gap. */
  const open = useRef(onOpen);
  useEffect(() => { open.current = onOpen; }, [onOpen]);

  useEffect(() => {
    if (!userId) return;
    return subscribeNotifications(userId, (inserted) => {
      // Only arrivals raise a toast; a row being marked read must not.
      if (!inserted || inserted.read) return;
      raiseSonnerNotification(inserted, (link) => open.current(link, inserted));
    });
  }, [userId]);
}
