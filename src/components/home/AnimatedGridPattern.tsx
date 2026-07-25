"use client";

import { useEffect, useState } from "react";

/* Animated grid pattern — the hero background.

   A static CSS grid with a handful of cells fading in and out at random
   positions, refreshed on a slow interval. Only a few elements move, so it
   stays cheap on every device, and it renders behind the hero content without
   affecting layout. Motion stops under prefers-reduced-motion. */

type Cell = { id: string; left: string; top: string; delay: string };

const roll = (count: number, tick: number): Cell[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${tick}-${i}`,
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
    let tick = 0;
    // The interval is the external system driving this; the first roll goes
    // through it too, so nothing is set synchronously during the effect.
    const t = setInterval(() => { setSquares(roll(cells, tick)); tick += 1; }, interval);
    const first = setTimeout(() => setSquares(roll(cells, tick)), 0);
    return () => { clearInterval(t); clearTimeout(first); };
  }, [cells, interval]);

  return (
    <div className="af-grid" aria-hidden style={{ backgroundSize: `${cell}px ${cell}px` }}>
      {squares.map((s) => (
        <span key={s.id} className="af-grid-cell" style={{ left: s.left, top: s.top, width: cell, height: cell, animationDelay: s.delay }} />
      ))}
    </div>
  );
}

export default AnimatedGridPattern;
