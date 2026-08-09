"use client";

import { useEffect, useState } from "react";

/* TEMPORARY mobile-performance debug tool. Not part of the product — for
   isolating which specific animation/blur/effect is responsible for the
   reported mobile lag, by letting the person testing on their own phone
   flip effects off one at a time (or all at once) and feel the difference
   live, without a rebuild. Every flag maps to an `html.dbg-<flag>` class
   (see the "TEMPORARY PERF DEBUG TOGGLES" block at the end of globals.css)
   plus, for the one effect driven by JS rather than CSS, a flag read
   directly in AnimatedGridPattern. Delete this file, its CSS block, and
   <PerfDebugPanel/> once the culprit is found and permanently fixed. */

export type PerfFlag =
  | "blob-blur" | "grid-reroll" | "grid-anim"
  | "mnav-pop" | "notif-pop" | "sidebar-transition"
  | "loader-spin" | "skeleton-shimmer"
  | "journey-glass-blur" | "journey-locked-blur" | "journey-entrance"
  | "rp-card-entrance"
  | "explore-entrance" | "explore-pulse" | "explore-marquee"
  | "chat-texture" | "chat-unread-icons" | "typing-dots"
  | "status-pulse";

export const PERF_FLAGS: { id: PerfFlag; label: string; group: string; note: string }[] = [
  { id: "blob-blur", group: "Background", label: "Corner blur blobs", note: "sw-root::before/::after, filter: blur(64px), every page" },
  { id: "grid-anim", group: "Background", label: "Grid cell fade animation", note: "af-grid-cell CSS animation (already off on mobile — re-check here)" },
  { id: "grid-reroll", group: "Background", label: "Grid cell JS reroll", note: "AnimatedGridPattern's setInterval reshuffle, every 3.2s" },
  { id: "sidebar-transition", group: "Navigation", label: "Sidebar collapse/expand transition", note: "desktop only, width transition" },
  { id: "mnav-pop", group: "Navigation", label: "Mobile menu open animation", note: "hamburger dropdown pop-in" },
  { id: "notif-pop", group: "Navigation", label: "Notification popover open animation", note: "sw-notifpop pop-in" },
  { id: "loader-spin", group: "Loading", label: "Loading spinner animation", note: "shown while any module/data is loading" },
  { id: "skeleton-shimmer", group: "Loading", label: "Skeleton shimmer", note: "avatar + content placeholders" },
  { id: "journey-glass-blur", group: "Journey", label: "Journey glass blur", note: "jr-nav/jr-stage/jr-head, backdrop-filter blur(18px), one per stage card" },
  { id: "journey-locked-blur", group: "Journey", label: "Locked stage blur", note: "jr-stage.locked, filter: blur(2px)" },
  { id: "journey-entrance", group: "Journey", label: "Stage expand entrance animation", note: "jr-stage-body fade+rise (already off on mobile — re-check here)" },
  { id: "rp-card-entrance", group: "Right panel", label: "Right-panel card entrance animation", note: "rp-card fade+rise, up to 4 at once (already off on mobile — re-check here)" },
  { id: "explore-entrance", group: "Explore", label: "Explore card entrance animations", note: "ex-stat/ex-exp-body/ex-city (already off on mobile — re-check here)" },
  { id: "explore-pulse", group: "Explore", label: "Explore current-node pulse", note: "ex-node.current, infinite box-shadow (already off on mobile — re-check here)" },
  { id: "explore-marquee", group: "Explore", label: "Explore marquee scroll", note: "continuous transform scroll, 60s loop" },
  { id: "chat-texture", group: "Chat", label: "Chat header texture pulse", note: "stu-chat-texture, already capped to once on mobile — re-check here" },
  { id: "chat-unread-icons", group: "Chat", label: "Unread bell/chat icon motion", note: "header icons, while something is unread" },
  { id: "typing-dots", group: "Chat", label: "Typing indicator dots", note: "shown while the other side is typing" },
  { id: "status-pulse", group: "Misc", label: "Online status pulse/ping dot", note: "small, wherever presence is shown" },
];

type Listener = () => void;
const listeners = new Set<Listener>();
const STORAGE_KEY = "af.perfdbg";

function readFlags(): Set<PerfFlag> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as PerfFlag[]) : []);
  } catch { return new Set(); }
}

function writeFlags(flags: Set<PerfFlag>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...flags])); } catch { /* storage blocked */ }
  if (typeof document !== "undefined") {
    for (const f of PERF_FLAGS) document.documentElement.classList.toggle(`dbg-${f.id}`, flags.has(f.id));
  }
  // Deferred: a toggle can fire from inside another component's render (a
  // checkbox's own onChange), so notifying synchronously here risks the
  // classic "setState while rendering a different component" warning.
  queueMicrotask(() => listeners.forEach((l) => l()));
}

export function isPerfFlagOn(flag: PerfFlag): boolean {
  return readFlags().has(flag);
}

export function togglePerfFlag(flag: PerfFlag) {
  const flags = readFlags();
  if (flags.has(flag)) flags.delete(flag); else flags.add(flag);
  writeFlags(flags);
}

export function setAllPerfFlags(on: boolean) {
  writeFlags(on ? new Set(PERF_FLAGS.map((f) => f.id)) : new Set());
}

/** Applies whatever was saved from a previous page, on every mount (route
    change re-mounts the layout tree in a way that would otherwise drop the
    dbg-* classes). Call once, high in the tree. */
export function useApplyPerfFlags() {
  useEffect(() => { writeFlags(readFlags()); }, []);
}

/** Live-updating read of the current flag set, for JS-level checks
    (AnimatedGridPattern's reroll interval — CSS classes alone can't stop a
    setInterval). */
export function useActivePerfFlags(): Set<PerfFlag> {
  const [flags, setFlags] = useState<Set<PerfFlag>>(() => readFlags());
  useEffect(() => {
    const onChange = () => setFlags(readFlags());
    listeners.add(onChange);
    return () => { listeners.delete(onChange); };
  }, []);
  return flags;
}
