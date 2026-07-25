"use client";

import { useSyncExternalStore } from "react";

/* One profile picture per user, everywhere.
   The signed avatar URL lives in this tiny store instead of in a single
   component's state, so the moment a new photo is uploaded every surface that
   renders the current user's avatar (top bar, sidebar, profile, settings, and
   any module added later) repaints with it — no page reload, no prop drilling. */

let current: string | null = null;
const listeners = new Set<() => void>();

export function setAvatarUrl(url: string | null): void {
  if (current === url) return;
  current = url;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** The current user's avatar URL. Pass the value loaded from the profile as a
    fallback so the first paint (and SSR) has something to show. */
export function useAvatarUrl(fallback?: string | null): string | null {
  const url = useSyncExternalStore(subscribe, () => current, () => null);
  return url ?? fallback ?? null;
}
