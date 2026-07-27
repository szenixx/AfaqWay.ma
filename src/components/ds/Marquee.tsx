"use client";

import type { CSSProperties, ReactNode } from "react";

/* Infinite marquee.

   Pure CSS: the track holds two identical runs of the children and translates
   by exactly half its length, so the loop point is invisible and nothing is
   measured or animated in JavaScript. That keeps it smooth on a phone and off
   the main thread.

   Horizontal by default, vertical below the mobile breakpoint, controlled from
   ds.css so the component itself has no media-query logic. Pausing on hover and
   honouring prefers-reduced-motion are both handled there too. */

export function Marquee({ children, seconds = 55, reverse, gap = 20, className, style }: {
  children: ReactNode;
  /** One full loop, in seconds. Longer is slower. */
  seconds?: number;
  reverse?: boolean;
  gap?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const vars = {
    "--mq-duration": `${seconds}s`,
    "--mq-gap": `${gap}px`,
    "--mq-direction": reverse ? "reverse" : "normal",
  } as CSSProperties;

  return (
    <div className={`mq${className ? ` ${className}` : ""}`} style={{ ...vars, ...style }}>
      <div className="mq-track">
        <div className="mq-run">{children}</div>
        {/* The duplicate is decorative: screen readers read the first run only. */}
        <div className="mq-run" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

export default Marquee;
