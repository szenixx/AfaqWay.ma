"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* Animated modal — the platform's single overlay animation.

   Same motion as the original: enter from opacity 0 / scale .5 / rotateX 80deg
   / y 40 with a spring (stiffness 260, damping 15), exit to opacity 0 / scale
   .8 / rotateX 10. Sizing, spacing, colour and typography stay with the
   design system, so any existing modal body can be dropped inside unchanged.

   Portaled to document.body and driven by AnimatePresence — the same pattern
   MorphingDialog already uses — instead of rendering in place and faking the
   exit animation with a bare setTimeout. Two real bugs came from that: (1) a
   fast re-open/re-close (easy to trigger on a touchscreen, rare with a mouse)
   could stack two pending timeouts and fire onClose an extra time; (2)
   rendering in place meant the fixed-position overlay's containing block was
   whatever ancestor happened to have a transform/filter/backdrop-filter set
   at the time (a hover-lifted card, a zoomed panel) instead of the viewport —
   Safari enforces that containing-block rule more strictly than desktop
   Chrome, so the overlay could end up sized and positioned against the wrong
   box: a translucent panel covering part of the screen while the app's own
   fixed header, outside that ancestor, stayed on top of it. Both go away once
   the overlay always portals straight to <body> and never manages its own
   mount timing by hand. */

const overlayVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const panelVariants = {
  initial: { opacity: 0, scale: 0.5, rotateX: 80, y: 40 },
  animate: { opacity: 1, scale: 1, rotateX: 0, y: 0 },
  exit: { opacity: 0, scale: 0.8, rotateX: 10 },
};

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
  const reduceMotion = useReducedMotion() ?? false;
  // document.body doesn't exist during SSR — the portal waits for the client.
  const [canPortal, setCanPortal] = useState(false);
  useEffect(() => setCanPortal(true), []);

  // Escape to close, and the page behind never scrolls under the overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  if (!canPortal) return null;

  const overlayTransition = { duration: reduceMotion ? 0 : 0.2 };
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 15 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`am-overlay${overlayClassName ? " " + overlayClassName : ""}`}
          onClick={onClose}
          role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-label={ariaLabel}
          variants={overlayVariants} initial="initial" animate="animate" exit="exit" transition={overlayTransition}
        >
          <motion.div
            className={`am-panel${className ? " " + className : ""}`}
            onClick={stop}
            variants={panelVariants} initial="initial" animate="animate" exit="exit" transition={panelTransition}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default AnimatedModal;
