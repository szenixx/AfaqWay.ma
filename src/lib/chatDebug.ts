"use client";

/* TEMPORARY — instrumentation for the mobile chat white-flash investigation.
   Not wired to anything else; safe to delete entirely once the cause is
   found. A tiny event bus so any file can log a line and the on-screen
   overlay (ChatDebugOverlay, rendered inside StudentChat) can show it live
   on a real phone with no devtools attached. */

import { useEffect, useState } from "react";

export type DebugEntry = { t: number; msg: string };

let log: DebugEntry[] = [];
const listeners = new Set<() => void>();

export function dbg(msg: string) {
  log = [...log.slice(-29), { t: Date.now(), msg }];
  // eslint-disable-next-line no-console
  console.log(`[chat-debug ${new Date().toISOString().slice(11, 23)}] ${msg}`);
  // dbg() is called from inside render bodies (deliberately, to catch every
  // render) — notifying listeners synchronously would be a setState-during-
  // another-component's-render, so defer it a tick.
  queueMicrotask(() => listeners.forEach((l) => l()));
}

export function useDebugLog(): DebugEntry[] {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((v) => v + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return log;
}
