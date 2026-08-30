"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

/* Safari private mode, some in-app browsers (Instagram/Facebook webviews) and
   a full storage quota all throw synchronously on getItem/setItem rather than
   failing quietly. This runs inside a useEffect on every new message — an
   uncaught throw there is a render-adjacent crash, not a display glitch, and
   is exactly the kind of mobile-only failure that never shows up testing on
   a desktop browser with ordinary storage access. */
function readStorage(k: string): string | null {
  try { return window.localStorage.getItem(k); } catch { return null; }
}
function writeStorage(k: string, v: string): void {
  try { window.localStorage.setItem(k, v); } catch { /* unread tracking is a display hint, not a permission */ }
}

function lastSeen(userId: string): string {
  if (typeof window === "undefined") return new Date().toISOString();
  const stored = readStorage(key(userId));
  if (stored) return stored;
  /* First visit on this device: treat everything already in the thread as read,
     so a returning student is not greeted by a badge counting their whole
     history. */
  const now = new Date().toISOString();
  writeStorage(key(userId), now);
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
    if (!userId) return;
    writeStorage(key(userId), new Date().toISOString());
    setUnread(0);
  }, [userId]);

  /* Reading the count is the "subscribe to an external system" case; the state
     set here is the query result, not derived render state. */
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (active) markSeen(); else void count(); }, [active, count, markSeen]);

  /* This hook lives at the dashboard's top level for the sidebar badge, so
     it never unmounts — only `active` flips, every time the student steps
     into or out of the Messages tab. With `active` in the effect's own
     dependency array, every one of those taps tore the channel down and
     resubscribed a channel of the SAME name, the identical race fixed in
     advisor.ts (a channel of the same topic, still leaving from the
     previous mount, handed back and re-subscribed). Reading the current
     active/markSeen/count through a ref means this effect depends on
     `userId` alone: the channel is created once per account and never
     churns on ordinary navigation. */
  const liveRef = useRef({ active, markSeen, count });
  useEffect(() => { liveRef.current = { active, markSeen, count }; });

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`chat-unread-${userId.slice(0, 8)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `user_id=eq.${userId}` },
        () => { const { active, markSeen, count } = liveRef.current; if (active) markSeen(); else void count(); });
    channel.subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

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
  const seen = readStorage(key(userId));
  if (!seen) return null;
  const found = messages.find((m) => m.sender === "admin" && m.created_at > seen);
  return found?.id ?? null;
}
