"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { Children, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* GooeyStack — ported from the godui gooey-stack motion: cards fuse into
   liquid metaballs via an SVG goo filter as the gap between them shrinks, and
   un-fuse as it grows. Surface colour and border use this platform's card
   tokens (--card / --line) instead of Tailwind's theme classes. */

const SPRING = { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.9 };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const nearnessAt = (g: number, expandedGap: number, collapsedGap: number) =>
  clamp((expandedGap - g) / Math.max(1, expandedGap - 4), 0, 1) * clamp((g - collapsedGap) / 20, 0, 1);

export function GooeyStack({
  children, collapsed = false, expandedGap = 18, collapsedGap = -48, gooeyness = 10, radius = 28,
  className, style,
}: {
  children: ReactNode; collapsed?: boolean; expandedGap?: number; collapsedGap?: number;
  gooeyness?: number; radius?: number; className?: string; style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion() ?? false;
  const filterId = useId().replace(/:/g, "");
  const items = Children.toArray(children);
  const n = items.length;
  const g = collapsed ? collapsedGap : expandedGap;

  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>(() => items.map(() => 0));
  useLayoutEffect(() => {
    const measure = () => setHeights(contentRefs.current.map((el) => el?.offsetHeight ?? 0));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    for (const el of contentRefs.current) if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  const heightsBelow = (i: number) => { let d = 0; for (let j = i + 1; j < n; j++) d += heights[j] ?? 0; return d; };
  const cardsBelow = (i: number) => n - 1 - i;
  const expandedTotal = heights.reduce((s, h) => s + h, 0) + Math.max(0, n - 1) * expandedGap;
  const merge = clamp(-g / -Math.min(collapsedGap, -1), 0, 1);

  const gapTarget = useMotionValue(g);
  useEffect(() => { gapTarget.set(g); }, [g, gapTarget]);
  const gapSpring = useSpring(gapTarget, SPRING);
  const nearness = useTransform(gapSpring, (live) => nearnessAt(live, expandedGap, collapsedGap));
  const gooOpacity = useTransform(nearness, (v) => (reduce ? 0 : v));
  const nativeOpacity = useTransform(nearness, (v) => (reduce ? 1 : 1 - v));

  const stateOf = (i: number) => {
    const rank = cardsBelow(i);
    const bottomExpanded = heightsBelow(i) + rank * expandedGap;
    const bottomNow = heightsBelow(i) + rank * g;
    const y = bottomExpanded - bottomNow;
    if (rank === 0) return { y: 0, scale: 1, opacity: 1, silOpacity: 1, blur: 0 };
    return {
      y, scale: 1 - rank * 0.05 * merge,
      opacity: Math.max(0, 1 - rank * 1.1 * merge),
      silOpacity: Math.max(0, 1 - merge),
      blur: Math.min(16, rank * 13 * merge),
    };
  };
  const bottomOf = (i: number) => heightsBelow(i) + cardsBelow(i) * expandedGap;
  const transition = reduce ? { duration: 0 } : SPRING;

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: expandedTotal || undefined, ...style }}>
      <svg aria-hidden style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation={gooeyness} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 80 -40" result="goo" />
            <feGaussianBlur in="goo" stdDeviation="1.2" result="edge" />
            <feColorMatrix in="edge" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -9" result="grown" />
            <feFlood floodColor="var(--line)" result="borderColor" />
            <feComposite in="borderColor" in2="grown" operator="in" result="borderLayer" />
            <feFlood floodColor="var(--card)" result="cardColor" />
            <feComposite in="cardColor" in2="goo" operator="in" result="fillLayer" />
            <feMerge result="surface">
              <feMergeNode in="borderLayer" />
              <feMergeNode in="fillLayer" />
            </feMerge>
            <feGaussianBlur in="surface" stdDeviation="0.5" />
          </filter>
        </defs>
      </svg>

      {/* Merge surface: fused silhouettes, visible only while cards are necking. */}
      <motion.div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: gooOpacity, filter: reduce ? undefined : `url(#${filterId})` }}>
        {items.map((_, i) => {
          const s = stateOf(i);
          return (
            <motion.div key={i} style={{ position: "absolute", left: 0, right: 0, bottom: bottomOf(i), height: heights[i] || undefined, borderRadius: radius, zIndex: i, background: "var(--card)" }}
              initial={false} animate={{ y: s.y, scale: s.scale, opacity: s.silOpacity }} transition={transition} />
          );
        })}
      </motion.div>

      {/* Native surface: crisp DOM cards, shown at rest, cross-faded out while necking. */}
      <motion.div style={{ position: "absolute", inset: 0, opacity: nativeOpacity }}>
        {items.map((_, i) => {
          const s = stateOf(i);
          return (
            <motion.div key={i} style={{ position: "absolute", left: 0, right: 0, bottom: bottomOf(i), height: heights[i] || undefined, borderRadius: radius, zIndex: i, background: "var(--card)", border: "1px solid var(--line)" }}
              initial={false} animate={{ y: s.y, scale: s.scale, opacity: s.opacity }} transition={transition} />
          );
        })}
      </motion.div>

      {/* Content, always on top. */}
      <div style={{ position: "absolute", inset: 0 }}>
        {items.map((child, i) => {
          const s = stateOf(i);
          return (
            <motion.div
              key={i}
              ref={(el) => { contentRefs.current[i] = el; }}
              style={{ position: "absolute", left: 0, right: 0, bottom: bottomOf(i), zIndex: i }}
              initial={false}
              animate={{ y: s.y, scale: s.scale, opacity: s.opacity, filter: reduce ? "blur(0px)" : `blur(${s.blur}px)` }}
              transition={transition}
            >
              {child}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default GooeyStack;
