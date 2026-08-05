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

/* ── One-at-a-time visual-effect toggles ──────────────────────────────────
   Each flag maps to an `html.dbg-<flag>` class (see the CSS block flagged
   "TEMPORARY DEBUG TOGGLES" near the end of globals.css) that neutralises one
   specific effect with !important, so it can be flipped live on a real phone
   without a redeploy. Never combine two at once while testing — the whole
   point is isolating exactly one cause. */
export const DEBUG_FLAGS = [
  { key: "no-texture", label: "1. Chat texture/background" },
  { key: "no-fixed-lock", label: "2. sw-content-full position:fixed (chat scroll-lock)" },
  { key: "no-blobs", label: "3. filter:blur() sw-root corner blobs" },
  { key: "no-mask", label: "4. -webkit-mask-image (background grid)" },
  { key: "no-zoom", label: "5. chat-zoom (zoom/transform)" },
  { key: "no-anim", label: "8. All CSS animations (global)" },
  { key: "no-trans", label: "9. All CSS transitions (global)" },
] as const;

export type DebugFlagKey = typeof DEBUG_FLAGS[number]["key"];

const flagListeners = new Set<() => void>();
const activeFlags = new Set<DebugFlagKey>();

export function toggleDebugFlag(key: DebugFlagKey) {
  const el = document.documentElement;
  if (activeFlags.has(key)) { activeFlags.delete(key); el.classList.remove(`dbg-${key}`); dbg(`flag OFF: ${key}`); }
  else { activeFlags.add(key); el.classList.add(`dbg-${key}`); dbg(`flag ON: ${key}`); }
  flagListeners.forEach((l) => l());
}

export function useActiveDebugFlags(): Set<DebugFlagKey> {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((v) => v + 1);
    flagListeners.add(l);
    return () => { flagListeners.delete(l); };
  }, []);
  return activeFlags;
}
