"use client";

import { useRef, type HTMLAttributes, type PointerEvent, type ReactNode } from "react";

/* SpotlightCard — ported from the godui spotlight-card effect: a soft radial
   glow follows the pointer across the card, plus a matching highlight masked
   to the 1px border ring. The glow colour is the platform's primary blue at
   low opacity (rgba of --indigo-600 #3B41C9), per the design system; nothing
   here introduces a new colour.

   Implemented with a plain CSS custom property written on pointer move rather
   than React state, so a pointer sweep never triggers a re-render. */

const GLOW = "rgba(59,65,201,.14)";
const BORDER_GLOW = "rgba(59,65,201,.42)";

export function SpotlightCard({
  children, className, style, glowColor = GLOW, radius = 350, border = true, ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode; glowColor?: string; radius?: number; border?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--sy", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      className={`af-spotlight${className ? " " + className : ""}`}
      onPointerMove={handlePointerMove}
      style={{ ["--spot-color" as string]: glowColor, ["--spot-border" as string]: border ? BORDER_GLOW : "transparent", ["--spot-radius" as string]: `${radius}px`, ...style }}
      {...props}
    >
      <span aria-hidden className="af-spotlight-glow" />
      {border && <span aria-hidden className="af-spotlight-ring" />}
      <div className="af-spotlight-content">{children}</div>
    </div>
  );
}

export default SpotlightCard;
