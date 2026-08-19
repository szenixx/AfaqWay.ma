"use client";

/* Dock — ported from the godui dock: icons magnify as the pointer passes, the
   way a macOS dock does, with the effect falling off over a short distance.

   Orientation is a prop because this app's dock is the collapsed sidebar rail,
   which is vertical; the original is horizontal. Everything else — the spring,
   the falloff, the label tooltip — is the same either way.

   The pointer position travels by context rather than by cloning props onto
   children: an item has to call the same hooks on every render, and a value
   injected through cloneElement cannot guarantee that. */

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const BASE = 44;      // resting size
const PEAK = 62;      // size directly under the pointer
const FALLOFF = 130;  // px over which the magnification decays

type DockCtx = { pointer: ReturnType<typeof useMotionValue<number>> | null; vertical: boolean };
const Ctx = createContext<DockCtx | null>(null);

export function Dock({ children, className, orientation = "horizontal" }: {
  children: ReactNode; className?: string; orientation?: "horizontal" | "vertical";
}) {
  const vertical = orientation === "vertical";
  const pointer = useMotionValue(Number.POSITIVE_INFINITY);
  const ctx = useMemo(() => ({ pointer, vertical }), [pointer, vertical]);

  return (
    <Ctx.Provider value={ctx}>
      <div
        aria-orientation={vertical ? "vertical" : "horizontal"}
        className={cn("dock", vertical && "dock--v", className)}
        onPointerLeave={() => pointer.set(Number.POSITIVE_INFINITY)}
        onPointerMove={(e) => pointer.set(vertical ? e.clientY : e.clientX)}
        role="toolbar"
      >
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function DockItem({ children, label, active, onClick, badge }: {
  children: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const ctx = useContext(Ctx);

  /* Always created, never conditionally: it is only used when an item is
     rendered outside a Dock, which the magnification then simply ignores. */
  const fallback = useMotionValue(Number.POSITIVE_INFINITY);
  const pointer = ctx?.pointer ?? fallback;
  const vertical = ctx?.vertical ?? false;

  /* Distance from the pointer to this item's centre, mapped onto a size. */
  const distance = useTransform(pointer, (p) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return Number.POSITIVE_INFINITY;
    const centre = vertical ? box.y + box.height / 2 : box.x + box.width / 2;
    return p - centre;
  });
  const target = useTransform(distance, [-FALLOFF, 0, FALLOFF], [BASE, PEAK, BASE], { clamp: true });
  const size = useSpring(target, { stiffness: 260, damping: 22, mass: 0.4 });

  return (
    <motion.button
      ref={ref}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={cn("dock-item", active && "dock-item--on")}
      onClick={onClick}
      style={reduce ? { width: BASE, height: BASE } : { width: size, height: size }}
      type="button"
    >
      <span className="dock-item__icon">{children}</span>
      {badge && <span aria-hidden className="dock-item__dot" />}
      <span className="dock-item__label">{label}</span>
    </motion.button>
  );
}

export default Dock;
