"use client";

/* CardSwap — ported from the godui card-swap: a stack of cards where the front
   one retires to the back on an interval, the rest step forward. Depth comes
   from a small translate + scale per position, so any number of children work.

   Paused on hover and while the tab is hidden; static under reduced motion,
   which leaves the top card readable rather than cycling behind the reader. */

import { motion, useReducedMotion } from "framer-motion";
import { Children, useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardSwap({ children, className, interval = 3400 }: {
  children: ReactNode; className?: string; interval?: number;
}) {
  const items = Children.toArray(children);
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const advance = useCallback(() => setFront((f) => (f + 1) % Math.max(1, items.length)), [items.length]);

  useEffect(() => {
    if (reduce || paused || items.length < 2) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      advance();
    }, interval);
    return () => clearInterval(id);
  }, [advance, interval, paused, reduce, items.length]);

  return (
    <div
      className={cn("cardswap", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {items.map((child, i) => {
        /* 0 = front, 1 = behind it, and so on around the ring. */
        const depth = (i - front + items.length) % items.length;
        return (
          <motion.div
            key={i}
            animate={{
              y: depth * -14,
              x: depth * 10,
              scale: 1 - depth * 0.05,
              opacity: depth > 2 ? 0 : 1,
              zIndex: items.length - depth,
            }}
            className="cardswap__card"
            /* Buried cards are out of the document for good: `pointerEvents`
               alone stops the mouse but leaves their buttons in the tab order,
               so a keyboard would land on a control nobody can see. */
            inert={depth !== 0}
            initial={false}
            style={{ pointerEvents: depth === 0 ? "auto" : "none" }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          >
            {child}
          </motion.div>
        );
      })}

      {items.length > 1 && (
        <div className="cardswap__dots" role="tablist" aria-label="Cards">
          {items.map((_, i) => (
            <button
              key={i} type="button" role="tab"
              aria-label={`Card ${i + 1}`} aria-selected={i === front}
              className={cn("cardswap__dot", i === front && "on")}
              onClick={() => setFront(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CardSwap;
