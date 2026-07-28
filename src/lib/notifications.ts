"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { emailAnnouncement } from "@/lib/email/client";

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

export async function markRead(id: string, read = true): Promise<void> {
  await supabase.from("notifications").update({ read }).eq("id", id);
}

export async function markAllRead(userId: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
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
    const channel = supabase
      .channel(`notifs-${userId.slice(0, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => { void load(); });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, load]);

  const unread = items.filter((n) => !n.read).length;
  return { items, unread, loading, reload: load };
}
