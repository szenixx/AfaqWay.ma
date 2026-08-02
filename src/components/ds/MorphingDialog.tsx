"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/* MorphingDialog — ported from the godui morphing-dialog motion: trigger and
   content share a layoutId, so the card physically morphs into the modal and
   back instead of the usual fade/pop. Overlay colour, blur and z-index match
   this platform's existing AnimatedModal overlay exactly, so it reads as the
   same system, just with a different open/close animation. */

const MORPH_SPRING = { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.9 };

type Ctx = { isOpen: boolean; open: () => void; close: () => void; layoutId: string; reduceMotion: boolean };
const MorphingDialogContext = createContext<Ctx | null>(null);
function useMorphingDialog() {
  const ctx = useContext(MorphingDialogContext);
  if (!ctx) throw new Error("MorphingDialog components must be used within <MorphingDialog>.");
  return ctx;
}

export function MorphingDialog({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion() ?? false;
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo<Ctx>(() => ({
    isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false),
    layoutId: `morphing-dialog-${id}`, reduceMotion,
  }), [isOpen, id, reduceMotion]);
  return <MorphingDialogContext.Provider value={value}>{children}</MorphingDialogContext.Provider>;
}

export function MorphingDialogTrigger({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const { open, layoutId, isOpen } = useMorphingDialog();
  return (
    <motion.div
      layoutId={layoutId}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
      onClick={open}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
      className={className}
      style={{ cursor: "pointer", ...style }}
    >
      {children}
    </motion.div>
  );
}

export function MorphingDialogContent({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const { isOpen, close, layoutId, reduceMotion } = useMorphingDialog();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [isOpen, close]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 220, display: "grid", placeItems: "center", padding: 24 }}>
          <motion.button
            type="button"
            aria-label="Dismiss dialog"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            style={{ position: "absolute", inset: 0, cursor: "default", border: "none", background: "rgba(23,35,58,.5)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
          />
          <motion.div
            layoutId={layoutId}
            role="dialog"
            aria-modal="true"
            transition={reduceMotion ? { duration: 0 } : MORPH_SPRING}
            className={className}
            style={{ position: "relative", zIndex: 1, overflow: "hidden", background: "var(--card)", color: "var(--ink)", boxShadow: "0 24px 70px rgba(23,35,58,.28)", borderRadius: 20, ...style }}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function MorphingDialogClose({ className }: { className?: string }) {
  const { close } = useMorphingDialog();
  return (
    <motion.button
      type="button"
      aria-label="Close dialog"
      onClick={close}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.1 }}
      className={className}
      style={{ position: "absolute", right: 14, top: 14, width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 999, border: "none", background: "var(--subtle)", color: "var(--ink-soft)", cursor: "pointer" }}
    >
      <X size={16} />
    </motion.button>
  );
}
