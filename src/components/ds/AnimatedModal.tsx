"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/* Animated modal — the platform's single overlay animation.

   Ported from the Inspira UI animated-modal registry entry, matching its motion
   exactly: enter from opacity 0 / scale .5 / rotateX 80deg / y 40 with a
   spring (stiffness 260, damping 15), exit to opacity 0 / scale .8 /
   rotateX 10, and a backdrop that blurs from 0 to 10px. Only the animation is
   new — sizing, spacing, colour and typography stay with the design system, so
   any existing modal body can be dropped inside unchanged. */

export function AnimatedModal({ open, onClose, children, className, overlayClassName, labelledBy, ariaLabel }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra class for the panel — pass the modal's existing card class. */
  className?: string;
  overlayClassName?: string;
  labelledBy?: string;
  ariaLabel?: string;
}) {
  /* `open` drives mounting; the exit animation is played by the wrapper before
     the caller unmounts us, so no state has to be synchronised here. */
  const [leaving, setLeaving] = useState(false);
  const mounted = open || leaving;
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Escape to close, and the page behind never scrolls under the overlay.
  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [mounted]);

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);
  const requestClose = useCallback(() => {
    setLeaving(true);
    setTimeout(() => { setLeaving(false); onClose(); }, 200);
  }, [onClose]);
  if (!mounted) return null;

  return (
    <div
      className={`am-overlay${leaving ? " leaving" : ""}${overlayClassName ? " " + overlayClassName : ""}`}
      onClick={requestClose} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-label={ariaLabel}
    >
      <div className={`am-panel${leaving ? " leaving" : ""}${className ? " " + className : ""}`} onClick={stop}>
        {children}
      </div>
    </div>
  );
}

export default AnimatedModal;
