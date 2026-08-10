"use client";

import { useEffect, useMemo, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useOnlineUsers } from "@/lib/presence";

/* Advisor identity.
 *
 * A student never sees who is answering them. Not the name, not the photo, not
 * the email — only "AfaqWay Advisor" and a number. That is deliberate: the
 * platform answers, not a person. It also means an advisor can hand a
 * conversation over, go on holiday or leave the company without the student
 * losing their thread or feeling abandoned.
 *
 * The number exists so the student can tell that the person changed, and quote
 * it to support. It is derived from the administrator's id rather than stored,
 * so it needs no column, no migration and no lookup the student is not allowed
 * to make — a student cannot read the admins table, and must not be able to.
 *
 * Deriving it also means the number never reveals anything: it is not a
 * sequence, so "Advisor #104" says nothing about how many advisors exist or
 * when this one joined. */

/**
 * A stable three-digit number for one administrator.
 *
 * The same id always gives the same number, and nothing about the id can be
 * recovered from it. Collisions are possible and harmless: two advisors sharing
 * a number is a cosmetic coincidence, not a correctness problem.
 */
export function advisorNumber(adminId: string | null | undefined): number {
  if (!adminId) return 0;
  // FNV-1a: short, stable across sessions and machines, no dependency.
  let hash = 0x811c9dc5;
  for (let i = 0; i < adminId.length; i++) {
    hash ^= adminId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return 100 + (hash % 900);   // 100–999, always three digits
}

/** "Advisor #104", or a neutral label before anyone has replied. */
export function advisorLabel(adminId: string | null | undefined): string {
  return adminId ? `Advisor #${advisorNumber(adminId)}` : "Advisor";
}

export type AdvisorIdentity = {
  /** "Advisor #104" — changes when a different administrator replies. */
  label: string;
  /** True while that administrator has the console open. */
  online: boolean;
  /** ISO timestamp of their most recent message, or null if none. */
  lastSeen: string | null;
  /** True while they are composing a reply. */
  typing: boolean;
};

/**
 * Who is currently answering this conversation, kept live.
 *
 * The advisor is whoever sent the most recent administrator message. When
 * someone else replies, the number, the presence dot and the last-seen time all
 * follow on the next message — without rewriting a single earlier message,
 * which stays attributed to "AfaqWay Advisor" exactly as it was sent.
 */
export function useAdvisorIdentity(userId: string | null | undefined): AdvisorIdentity {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const online = useOnlineUsers();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    /* The latest administrator message names the current advisor. One row is
       read, not the thread: the chat already has the messages. */
    const read = async () => {
      const { data } = await supabase
        .from("messages")
        .select("created_by, created_at")
        .eq("user_id", userId).eq("sender", "admin")
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      if (cancelled) return;
      const row = data as { created_by: string | null; created_at: string } | null;
      setAdminId(row?.created_by ?? null);
      setLastSeen(row?.created_at ?? null);
    };
    void read();

    /* Typing is broadcast, never stored: it is true for a moment and worthless
       afterwards, so it has no business in a table. One tracked timer, not
       one per broadcast — the admin side sends roughly every 1.5s while
       typing, well inside this 2.6s window, so an untracked timer per
       message would keep resetting "typing" true then piling up expiries
       that fire out of order. */
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`advisor-${userId.slice(0, 8)}`)
      .on("broadcast", { event: "typing" }, (payload) => {
        if (cancelled) return;
        const from = (payload.payload as { role?: string } | null)?.role;
        if (from !== "admin") return;
        setTyping(true);
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { if (!cancelled) setTyping(false); }, 2600);
      })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${userId}` },
        () => { void read(); });
    channel.subscribe();

    return () => {
      cancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return useMemo(() => ({
    label: advisorLabel(adminId),
    online: Boolean(adminId && online.has(adminId)),
    lastSeen,
    typing,
  }), [adminId, online, lastSeen, typing]);
}

/* Tells the student's chat that an administrator is composing a reply.
 *
 * Was creating a brand-new, never-subscribed channel on every keystroke
 * (AdminChat calls this from the composer's own onChange, with no
 * debounce) and sending on it unawaited. Broadcasting on a channel that
 * hasn't finished joining is unreliable, and every one of those sends was a
 * fire-and-forget promise with no .catch — on a student typing a real
 * sentence that's dozens of unhandled rejections a second on the very
 * socket connection the message list's own realtime subscription shares,
 * which is exactly the kind of thing that leaves that subscription in a
 * bad state until the page is reloaded.
 *
 * Fixed the same way presence.ts's shared channel is: one channel per
 * student, created and subscribed once, reused after that — and throttled,
 * since "the advisor is typing" doesn't need a message on every keystroke
 * to stay true for the 2.6s window the receiving end holds it for. */
const typingChannels = new Map<string, RealtimeChannel>();
const lastTypingSentAt = new Map<string, number>();
const TYPING_THROTTLE_MS = 1500;

function typingChannel(userId: string): RealtimeChannel {
  const key = userId.slice(0, 8);
  let ch = typingChannels.get(key);
  if (!ch) {
    ch = supabase.channel(`advisor-${key}`);
    ch.subscribe();
    typingChannels.set(key, ch);
  }
  return ch;
}

export function broadcastAdvisorTyping(userId: string) {
  const key = userId.slice(0, 8);
  const now = Date.now();
  if (now - (lastTypingSentAt.get(key) ?? 0) < TYPING_THROTTLE_MS) return;
  lastTypingSentAt.set(key, now);
  typingChannel(userId)
    .send({ type: "broadcast", event: "typing", payload: { role: "admin" } })
    .catch(() => { /* a missed typing ping is cosmetic; never let it surface as an error */ });
}

/** "Active now", or how long ago the advisor last wrote. */
export function lastSeenLabel(iso: string | null, online: boolean): string {
  if (online) return "Active now";
  if (!iso) return "Replies within a day";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 2) return "Active moments ago";
  if (mins < 60) return `Active ${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Active ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.round(hours / 24);
  return `Active ${days} ${days === 1 ? "day" : "days"} ago`;
}
