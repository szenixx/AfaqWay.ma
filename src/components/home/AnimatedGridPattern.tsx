"use client";

import { useEffect, useState } from "react";

/* Animated grid pattern — the hero background.

   A static CSS grid with a handful of cells fading in and out at random
   positions, refreshed on a slow interval. Only a few elements move, so it
   stays cheap on every device, and it renders behind the hero content without
   affecting layout. Motion stops under prefers-reduced-motion. */

/* `i` is the cell's slot, not an identity tied to which roll produced it — the
   key below must stay stable across rerolls (same 14 slots, new positions),
   not change every interval. An earlier version keyed each cell on
   `${tick}-${i}`, which changes every roll: React read that as "these 14
   elements are gone, mount 14 different ones" every single interval instead
   of updating their `left`/`top` in place. Inside a full-viewport
   `-webkit-mask-image`-clipped layer (mounted on every workspace page), that
   repeated destroy/recreate cycle was expensive enough on mobile Safari's
   software mask-compositing path to visibly stutter — most noticeably
   wherever another blurred/animated layer (the chat texture) was compositing
   in the same region at the same time. */
type Cell = { i: number; left: string; top: string; delay: string };

const roll = (count: number): Cell[] =>
  Array.from({ length: count }, (_, i) => ({
    i,
    left: `${Math.round(Math.random() * 100)}%`,
    top: `${Math.round(Math.random() * 100)}%`,
    delay: `${(Math.random() * 2).toFixed(2)}s`,
  }));

export function AnimatedGridPattern({ cells = 14, cell = 44, interval = 3200 }: {
  cells?: number; cell?: number; interval?: number;
}) {
  // Positions are produced in effects only, so render stays pure and the
  // server and client markup always agree.
  const [squares, setSquares] = useState<Cell[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // The interval is the external system driving this; the first roll goes
    // through it too, so nothing is set synchronously during the effect.
    const t = setInterval(() => setSquares(roll(cells)), interval);
    const first = setTimeout(() => setSquares(roll(cells)), 0);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [cells, interval]);

  return (
    <div className="af-grid" aria-hidden style={{ backgroundSize: `${cell}px ${cell}px` }}>
      {squares.map((s) => (
        <span key={s.i} className="af-grid-cell" style={{ left: s.left, top: s.top, width: cell, height: cell, animationDelay: s.delay }} />
      ))}
    </div>
  );
}

export default AnimatedGridPattern;
