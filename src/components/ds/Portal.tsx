"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/* Renders children into document.body instead of wherever they sit in the
   component tree. Any "cover the viewport" overlay — a backdrop, a full-
   screen modal, a celebration layer — MUST render through this, not as a
   plain `position: fixed` div in place.

   Why: a position:fixed element's containing block becomes the nearest
   ancestor with a transform / filter / backdrop-filter / will-change set,
   instead of the viewport, the moment one exists between it and <body>. This
   codebase has dozens of `:hover{transform}` cards and `backdrop-filter`
   panels, so that ancestor is everywhere. Safari enforces that spec rule more
   strictly than desktop Chrome, and — with no mouse to trigger mouseleave —
   iOS can hold a :hover/:active state indefinitely after a tap. The result:
   an overlay sized and positioned against the wrong box, covering part of the
   screen while the app's own fixed header, structurally outside that
   ancestor, stays crisp on top of it. Portaling straight to <body> removes
   the possibility entirely — it can never end up inside a transformed
   ancestor, because it was never inside the tree that has one. */
export function Portal({ children }: { children: ReactNode }) {
  // document.body doesn't exist during SSR — wait for the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

export default Portal;
