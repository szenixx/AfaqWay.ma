"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

/* Unread advisor messages.
 *
 * The messages table has no per-recipient read flag, so "unread" is defined as
 * "sent by an advisor after the last time this student opened the chat". That
 * marker is kept per user in localStorage: it is a display hint, not a
 * permission, so it does not need a column and does not need to survive a
 * device change.
 *
 * The count is always derived from real rows. There is no seeded value and no
 * fallback number, so an account with nothing waiting reports exactly zero. */

const key = (userId: string) => `afq_chat_seen_${userId}`;

function lastSeen(userId: string): string {
  if (typeof window === "undefined") return new Date().toISOString();
  const stored = window.localStorage.getItem(key(userId));
  if (stored) return stored;
  /* First visit on this device: treat everything already in the thread as read,
     so a returning student is not greeted by a badge counting their whole
     history. */
  const now = new Date().toISOString();
  window.localStorage.setItem(key(userId), now);
  return now;
}

/**
 * Live count of advisor messages the student has not opened yet.
 *
 * `markSeen` is called when the Messages module is on screen, which clears the
 * badge and moves the marker forward.
 */
export function useChatUnread(userId: string | null | undefined, active: boolean) {
  const [unread, setUnread] = useState(0);

  const count = useCallback(async () => {
    if (!userId) { setUnread(0); return; }
    const { count: n, error } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("sender", "admin")
      .gt("created_at", lastSeen(userId));
    setUnread(error ? 0 : n ?? 0);
  }, [userId]);

  const markSeen = useCallback(() => {
    if (!userId || typeof window === "undefined") return;
    window.localStorage.setItem(key(userId), new Date().toISOString());
    setUnread(0);
  }, [userId]);

  /* Reading the count is the "subscribe to an external system" case; the state
     set here is the query result, not derived render state. */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (active) markSeen(); else void count(); }, [active, count, markSeen]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`chat-unread-${userId.slice(0, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${userId}` },
        () => { if (active) markSeen(); else void count(); });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId, active, count, markSeen]);

  return unread;
}

/**
 * The first advisor message the student has not opened yet.
 *
 * Uses the same marker as the unread badge, so the number in the sidebar and
 * the message the conversation scrolls to always refer to the same thing.
 * Returns null when everything has been read.
 */
export function firstUnreadId(
  userId: string | null | undefined,
  messages: { id: string; sender: string; created_at: string }[],
): string | null {
  if (!userId || typeof window === "undefined") return null;
  const seen = window.localStorage.getItem(key(userId));
  if (!seen) return null;
  const found = messages.find((m) => m.sender === "admin" && m.created_at > seen);
  return found?.id ?? null;
}
