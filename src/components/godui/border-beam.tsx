"use client";

/* BorderBeam — ported from the godui border-beam: a short bead of light that
   runs the card's border. Drawn on an inset overlay that follows the same
   radius, travelling with `offset-path`/`offset-distance` so the browser
   animates one compositor property and the card's own box never moves.

   Render more than one with different `delay` values to get beams chasing
   each other, as the reference does. */

import { useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function BorderBeam({
  size = 70, duration = 6, delay = 0, className,
  colorFrom = "#2E3BC7", colorTo = "#6B4BA8", borderWidth = 1.6,
}: {
  size?: number;
  /** Seconds for one full lap. */
  duration?: number;
  delay?: number;
  className?: string;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}) {
  const reduce = useReducedMotion();
  /* Motion is the whole point of this element — with reduced motion there is
     nothing worth leaving behind, so it simply does not render. */
  if (reduce) return null;

  return (
    <span
      aria-hidden
      className={cn("beam", className)}
      style={{
        "--beam-size": `${size}px`,
        "--beam-duration": `${duration}s`,
        "--beam-delay": `-${delay}s`,
        "--beam-from": colorFrom,
        "--beam-to": colorTo,
        "--beam-width": `${borderWidth}px`,
      } as CSSProperties}
    />
  );
}

export default BorderBeam;
