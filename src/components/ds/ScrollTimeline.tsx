"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* ScrollTimeline — ported from the godui scroll-timeline motion: a muted rail
   runs down the entries and an accent overlay grows as you scroll, scrubbed
   through a spring and driven by GPU `scaleY` rather than `height`. Each
   entry's date/label sticks while its content scrolls past. Colours and type
   come from the design system tokens. */

export type TimelineEntry = { date?: string; title: string; content: ReactNode };

export function ScrollTimeline({ data, className }: { data: TimelineEntry[]; className?: string }) {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 10%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 320, damping: 32, mass: 0.9 });
  const lineOpacity = useTransform(progress, [0, 0.05], [0, 1]);

  return (
    <div className={className} style={{ width: "100%" }}>
      <div ref={trackRef} style={{ position: "relative", paddingBottom: 40 }}>
        {data.map((item, index) => (
          <div key={`${item.title}-${index}`} className="af-tl-row">
            {/* Sticky node + date */}
            <div className="af-tl-side">
              <span className="af-tl-node"><span className="af-tl-dot" /></span>
              <div className="af-tl-date">
                <div style={{ font: "700 19px/24px var(--font-sans)", color: "var(--ink)" }}>{item.date ?? item.title}</div>
                {item.date && <div style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-faint)" }}>{item.title}</div>}
              </div>
            </div>

            <motion.div
              className="af-tl-body"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={reduce ? { duration: 0 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* On narrow screens the sticky rail is hidden, so the entry
                  carries its own heading instead. */}
              <div className="af-tl-date-inline">{item.date ?? item.title}</div>
              {item.content}
            </motion.div>
          </div>
        ))}

        <div className="af-tl-rail" style={{ height }}>
          <motion.div
            className="af-tl-rail-fill"
            style={{ scaleY: reduce ? 1 : progress, opacity: reduce ? 1 : lineOpacity }}
          />
        </div>
      </div>
    </div>
  );
}

export default ScrollTimeline;
