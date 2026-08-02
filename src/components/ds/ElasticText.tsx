"use client";

import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";

/* ElasticText — ported from the godui elastic-text motion: a spotlight of
   emphasis sweeps across the text once it scrolls into view. The source
   component drives a variable font's `wght` axis continuously; Poppins (this
   platform's font) only ships static 400/500/600/700 cuts, so the sweep here
   steps between the loaded weights instead, with a small scale "pop" standing
   in for the elastic overshoot. Word-level (not per-character): steadier to
   read on a large hero headline than a per-character ripple. The sweep replays
   on a 10s cycle while the headline is in view. */

const REPLAY_MS = 10_000;

export function ElasticText({ children, className, style }: { children: string; className?: string; style?: CSSProperties }) {
  const reduceMotion = useReducedMotion();
  const words = useMemo(() => children.split(/(\s+)/), [children]);
  const ref = useRef<HTMLSpanElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const sweep = () => void controls.start((i: number) => ({
      fontWeight: [400, 700, 400],
      scale: [1, 1.05, 1],
      transition: { duration: 0.5, delay: i * 0.09, ease: [0.3, 0.7, 0.4, 1.4] },
    }));

    /* The sweep replays every 10s, but only while the headline is actually on
       screen: an interval left running behind a scrolled-past hero would
       animate to nobody and keep waking the compositor. The observer starts
       and stops the timer as the title enters and leaves the viewport. */
    let timer: number | undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        sweep();
        window.clearInterval(timer);
        timer = window.setInterval(sweep, REPLAY_MS);
      } else {
        window.clearInterval(timer);
        timer = undefined;
      }
    }, { threshold: 0.4 });

    io.observe(el);
    return () => { io.disconnect(); window.clearInterval(timer); };
  }, [controls, reduceMotion]);

  return (
    <span ref={ref} className={className} style={style}>
      {words.map((w, i) =>
        w.trim() === "" ? (
          <span key={i}>{w}</span>
        ) : (
          <motion.span
            key={i}
            custom={i}
            animate={controls}
            initial={{ fontWeight: 400, scale: 1 }}
            style={{ display: "inline-block" }}
          >
            {w}
          </motion.span>
        ),
      )}
    </span>
  );
}

export default ElasticText;
