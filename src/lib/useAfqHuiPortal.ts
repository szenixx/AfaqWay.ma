"use client";

import { useEffect, useState, type RefObject } from "react";

/* A HeroUI overlay — a Modal, a Popover — portals to document.body by
   default, outside whatever page happens to render it. The Admin Workspace
   solves this once, workspace-wide, with an UNSAFE_PortalProvider around its
   shell; a component that can be opened from a page with no such provider
   brings its own small `.afq-hui`-scoped portal target instead, so the
   brand tokens these components read are always present regardless of which
   page opened them.

   Nested inside the nearest .sw-root/.adm-root, not appended straight to
   document.body: both workspace roots carry their own fixed CSS `zoom`
   (.af-desktop-zoom on .sw-root; --adm-zoom on .adm-root — see globals.css/
   admin-overview.css). A portal target sitting outside that subtree — a
   sibling of the root rather than a descendant — would render at zoom:1
   while everything around it stayed at the workspace's own zoom: the one
   place a dialog could visibly disagree in size with the page that opened
   it. Falls back to document.body when no such root is found (a page with
   nothing to compensate for). */
export function useAfqHuiPortal(anchorRef?: RefObject<Element | null>): HTMLElement | null {
  const [node] = useState(() => (typeof document === "undefined" ? null : Object.assign(document.createElement("div"), { className: "afq-hui" })));
  useEffect(() => {
    if (!node) return;
    const host = anchorRef?.current?.closest(".sw-root, .adm-root") ?? document.body;
    host.appendChild(node);
    return () => { host.removeChild(node); };
  }, [node, anchorRef]);
  return node;
}
