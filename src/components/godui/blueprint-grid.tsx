"use client";

/* BlueprintGrid — ported from the godui blueprint-grid: a technical-drawing
   backdrop drawn entirely in CSS gradients, so it costs no image and no DOM.
   Absolutely positioned and inert; give it a positioned, clipping parent.

   Variants: `grid` (ruled lines), `dots` (a dotted field), `crosses` (ticks at
   the intersections). Styled in dashboard.css beside the other godui ports so
   it takes the platform's own tokens rather than a kit palette. */

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function BlueprintGrid({
  variant = "grid", size = 24, color, fade = true, className,
}: {
  variant?: "grid" | "dots" | "crosses";
  /** Cell size in px. */
  size?: number;
  /** Ink colour; defaults to the platform blue at low opacity. */
  color?: string;
  /** Soften the edges so the field has no hard cut. */
  fade?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("blueprint", `blueprint--${variant}`, fade && "blueprint--fade", className)}
      style={{
        "--bp-size": `${size}px`,
        ...(color ? { "--bp-ink": color } : null),
      } as CSSProperties}
    />
  );
}

export default BlueprintGrid;
