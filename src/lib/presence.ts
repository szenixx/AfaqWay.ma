"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

/* Who is actually on the platform right now.

   Presence is a property of the person, not of a conversation: a student is
   online because their workspace is open, not because an administrator happens
   to have opened their chat.

   Everyone shares ONE channel, created once here. That is not an optimisation:
   supabase-js hands back the same channel object for a topic, so a second
   component calling `.on()` after the first has subscribed throws
   "cannot add presence callbacks after subscribe()". The singleton owns the
   subscription and the listeners; components only read from it. */

const TOPIC = "afaqway-presence";

type Roster = Set<string>;

let channel: RealtimeChannel | null = null;
let roster: Roster = new Set();
const listeners = new Set<(r: Roster) => void>();
/** What this tab is announcing, re-sent whenever the socket reconnects. */
let selfPayload: { userId: string; name: string | null; role: string } | null = null;

function readRoster(ch: RealtimeChannel): Roster {
  const state = ch.presenceState() as Record<string, { userId?: string }[]>;
  const ids = new Set<string>();
  for (const [key, entries] of Object.entries(state)) {
    if (!key.startsWith("observer-")) ids.add(key);
    for (const entry of entries) if (entry?.userId) ids.add(entry.userId);
  }
  return ids;
}

/** Creates the single shared channel, with every listener attached up front. */
function ensureChannel(): RealtimeChannel {
  if (channel) return channel;

  const ch = supabase.channel(TOPIC, {
    config: { presence: { key: `observer-${Math.random().toString(36).slice(2, 10)}` } },
  });

  const sync = () => {
    roster = readRoster(ch);
    for (const notify of listeners) notify(roster);
  };

  ch.on("presence", { event: "sync" }, sync)
    .on("presence", { event: "join" }, sync)
    .on("presence", { event: "leave" }, sync)
    .subscribe((status) => {
      // Re-announce after a reconnect, otherwise this tab silently disappears.
      if (status === "SUBSCRIBED" && selfPayload) void ch.track(selfPayload);
    });

  channel = ch;
  return ch;
}

/** Announces this user as online for as long as the component is mounted. */
export function usePresenceBroadcast(
  userId: string | null | undefined,
  meta: { name?: string | null; role?: "student" | "admin" } = {},
) {
  const name = meta.name ?? null;
  const role = meta.role ?? "student";

  useEffect(() => {
    if (!userId) return;
    const ch = ensureChannel();
    selfPayload = { userId, name, role };
    // Tracking before the socket is ready is queued by supabase-js; the
    // subscribe callback re-sends it after any reconnect.
    void ch.track(selfPayload);

    return () => {
      selfPayload = null;
      void ch.untrack();
    };
  }, [userId, name, role]);
}

/** The set of user ids currently online, kept live. */
export function useOnlineUsers(): Set<string> {
  const [online, setOnline] = useState<Roster>(() => roster);

  useEffect(() => {
    ensureChannel();
    const notify = (r: Roster) => setOnline(new Set(r));
    listeners.add(notify);
    // Adopt whatever the roster already holds, in case sync fired before mount.
    notify(roster);
    return () => { listeners.delete(notify); };
  }, []);

  return online;
}

/** Single-user convenience for a badge. */
export function useIsOnline(userId: string | null | undefined): boolean {
  const online = useOnlineUsers();
  return Boolean(userId && online.has(userId));
}
