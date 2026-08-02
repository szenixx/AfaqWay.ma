"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Children, useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";

/* CardSwap — ported from the godui card-swap motion: a 3D stack that auto-
   advances, tilts toward the pointer, and can be cycled with the arrow
   controls. Not wired into a page yet (saved for later dashboard use per
   request); colours/shadows on the controls follow this platform's tokens. */

export function CardSwap({
  children, interval = 3500, pauseOnHover = true, offsetY = 28, offsetX = 22, scaleStep = 0.06,
  className, style,
}: {
  children: ReactNode; interval?: number; pauseOnHover?: boolean;
  offsetY?: number; offsetX?: number; scaleStep?: number; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const items = Children.toArray(children);
  const n = items.length;

  const [order, setOrder] = useState(() => Array.from({ length: n }, (_, i) => i));
  useEffect(() => { setOrder(Array.from({ length: n }, (_, i) => i)); }, [n]);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => setOrder((o) => (o.length ? [...o.slice(1), o[0] as number] : o)), []);
  const retreat = useCallback(() => setOrder((o) => (o.length ? [o[o.length - 1] as number, ...o.slice(0, -1)] : o)), []);

  useEffect(() => {
    if (!interval || paused || n < 2) return;
    const t = setInterval(advance, interval);
    return () => clearInterval(t);
  }, [interval, paused, n, advance]);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 12, y: px * 14 });
  };
  const handleLeave = () => { setTilt({ x: 0, y: 0 }); if (pauseOnHover) setPaused(false); };

  const rankOf = useMemo(() => {
    const m = new Array<number>(n);
    order.forEach((itemIndex, rank) => { m[itemIndex] = rank; });
    return m;
  }, [order, n]);

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={() => pauseOnHover && setPaused(true)}
      onPointerLeave={handleLeave}
      className={className}
      style={{ position: "relative", display: "grid", placeItems: "center", perspective: 1200, ...style }}
    >
      <motion.div
        style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d" }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: "spring", stiffness: 170, damping: 12, mass: 0.1 }}
      >
        {items.map((child, i) => {
          const r = rankOf[i] ?? 0;
          return (
            <motion.div
              key={i}
              style={{ position: "absolute", inset: 0, zIndex: n - r, transformStyle: "preserve-3d", willChange: "transform" }}
              animate={{ x: r * offsetX, y: -r * offsetY, scale: 1 - r * scaleStep, rotateZ: r * -2.5, opacity: r > 3 ? 0 : 1 }}
              transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
            >
              {child}
            </motion.div>
          );
        })}
      </motion.div>

      {n > 1 && (
        <div style={{ position: "absolute", bottom: -48, display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={retreat} aria-label="Previous card" style={{ borderRadius: 999, border: "1px solid var(--line)", background: "var(--card)", padding: "6px 12px", font: "600 14px/1 var(--font-sans)", color: "var(--ink)", boxShadow: "var(--shadow-card)", cursor: "pointer" }}>‹</button>
          <button type="button" onClick={advance} aria-label="Next card" style={{ borderRadius: 999, border: "1px solid var(--line)", background: "var(--card)", padding: "6px 12px", font: "600 14px/1 var(--font-sans)", color: "var(--ink)", boxShadow: "var(--shadow-card)", cursor: "pointer" }}>›</button>
        </div>
      )}
    </div>
  );
}

export default CardSwap;
