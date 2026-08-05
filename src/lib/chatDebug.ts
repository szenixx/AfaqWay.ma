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

/* ── Visual-effect toggles ─────────────────────────────────────────────────
   Each flag maps to an `html.dbg-<flag>` class (see the CSS block flagged
   "TEMPORARY DEBUG TOGGLES" near the end of globals.css) that overrides one
   specific effect with !important, so it can be flipped live on a real phone
   without a redeploy.

   "Scenario testing" pairs let afChatMark / dsStatusPing be forced on or off
   independently of whatever the shipped mobile default currently is — check
   the combination matching the scenario you're running (A/B/C/D), not one
   box at a time. Everything else below that: one at a time. */
export const DEBUG_FLAGS = [
  { key: "chatmark-on", label: "afChatMark: force ON (infinite 9s)", group: "Scenario testing" },
  { key: "chatmark-off", label: "afChatMark: force OFF (none)", group: "Scenario testing" },
  { key: "statusping-on", label: "dsStatusPing: force ON (show pill + ring)", group: "Scenario testing" },
  { key: "statusping-off", label: "dsStatusPing: force OFF (hidden)", group: "Scenario testing" },

  { key: "no-texture-blur-only", label: "Watermark: strip filter:blur() only (keep animation)", group: "Compositing interaction" },
  { key: "no-texture", label: "Chat texture/background (whole layer)", group: "Compositing interaction" },
  { key: "no-fixed-lock", label: "sw-content-full position:fixed (chat scroll-lock)", group: "Compositing interaction" },
  { key: "no-blobs", label: "filter:blur() sw-root corner blobs", group: "Compositing interaction" },
  { key: "no-zoom", label: "chat-zoom (zoom/transform)", group: "Compositing interaction" },

  { key: "no-grid-cell", label: "1. Remove CSS animation only (keep grid, mask, cells)", group: "afGridCell breakdown" },
  { key: "no-mask", label: "2. Remove -webkit-mask-image only (keep animation)", group: "afGridCell breakdown" },
  { key: "no-grid-reroll", label: "4. Remove JS reroll only (keep CSS animation looping)", group: "afGridCell breakdown" },

  { key: "no-chev", label: "afChevGo (logo chevron, mobile top bar)", group: "Other infinite animations" },
  { key: "no-bell-anim", label: "bell / chat-bubble unread wiggle", group: "Other infinite animations" },

  { key: "no-anim", label: "ALL CSS animations (global)", group: "Blanket (confirmatory only)" },
  { key: "no-trans", label: "ALL CSS transitions (global)", group: "Blanket (confirmatory only)" },
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

/* One-tap scenario presets — sets exactly the 4 scenario-relevant flags to
   the right state (leaves every other flag, e.g. no-grid-cell, untouched),
   so there's no chance of a manual-toggle mistake while running A/B/C/D. */
const SCENARIO_KEYS = ["chatmark-on", "chatmark-off", "statusping-on", "statusping-off"] as const;
export const SCENARIOS: Record<"A" | "B" | "C" | "D", DebugFlagKey[]> = {
  A: ["chatmark-on", "statusping-off"],
  B: ["chatmark-off", "statusping-on"],
  C: ["chatmark-on", "statusping-on"],
  D: ["chatmark-off", "statusping-off"],
};

export function setScenario(name: keyof typeof SCENARIOS) {
  const el = document.documentElement;
  const want = new Set(SCENARIOS[name]);
  for (const k of SCENARIO_KEYS) {
    const on = want.has(k);
    if (on === activeFlags.has(k)) continue;
    if (on) { activeFlags.add(k); el.classList.add(`dbg-${k}`); }
    else { activeFlags.delete(k); el.classList.remove(`dbg-${k}`); }
  }
  dbg(`scenario ${name}: ${SCENARIOS[name].join(" + ")}`);
  flagListeners.forEach((l) => l());
}
