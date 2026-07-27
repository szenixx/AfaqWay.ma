"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

/**
 * Publishes an announcement. A database trigger fans it out to a notification
 * for every active student, so this stays a single insert however many students
 * there are.
 */
export async function publishUpdate(input: {
  title: string;
  body: string;
  attachments: PlatformUpdate["attachments"];
}): Promise<{ ok: boolean; error?: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("platform_updates").insert({
    title: input.title, body: input.body, attachments: input.attachments,
    author_email: auth.user?.email ?? null, created_by: auth.user?.id ?? null,
  });
  if (error) return { ok: false, error: error.message };

  /* Email is best-effort and must not block publishing: the announcement is
     already stored and every student has been notified in the platform. */
  try {
    await supabase.functions.invoke("send-update", {
      body: { broadcast: true, subject: input.title, message: input.body },
    });
  } catch (err) {
    console.warn("announcement email not sent", err);
  }
  return { ok: true };
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
