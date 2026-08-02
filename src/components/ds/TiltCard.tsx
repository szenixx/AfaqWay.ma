"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";

/* TiltCard — ported from the godui tilt-card motion: the card tilts toward
   the pointer with spring-smoothed parallax and an optional glare that tracks
   the cursor. Not wired into a page yet (saved for later dashboard use per
   request); surface, border and shadow follow this platform's card tokens. */

const SPRING = { stiffness: 170, damping: 12, mass: 0.1 } as const;

export function TiltCard({
  children, className, style, maxTilt = 12, scale = 1.03, depth = 40, glare = true,
}: {
  children: ReactNode; className?: string; style?: React.CSSProperties;
  maxTilt?: number; scale?: number; depth?: number; glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);

  const rotateX = useTransform(sy, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-maxTilt, maxTilt]);
  const glareX = useTransform(sx, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(sy, [-0.5, 0.5], [0, 100]);
  const hoverScale = useSpring(1, SPRING);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleEnter = () => hoverScale.set(scale);
  const handleLeave = () => { px.set(0); py.set(0); hoverScale.set(1); };

  return (
    <motion.div
      ref={ref}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      className={className}
      style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--line)",
        background: "var(--card)",
        boxShadow: "var(--elev-2)",
        transformStyle: "preserve-3d",
        willChange: "transform",
        rotateX: reduceMotion ? 0 : rotateX,
        rotateY: reduceMotion ? 0 : rotateY,
        scale: reduceMotion ? 1 : hoverScale,
        ...style,
      }}
    >
      <div style={{ transform: `translateZ(${depth}px)`, transformStyle: "preserve-3d" }}>{children}</div>
      {glare && !reduceMotion && (
        <motion.div
          aria-hidden
          style={{
            position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", mixBlendMode: "overlay",
            background: useTransform([glareX, glareY], (latest) => {
              const [gx, gy] = latest as [number, number];
              return `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,.5), transparent 60%)`;
            }),
          }}
        />
      )}
    </motion.div>
  );
}

export default TiltCard;
