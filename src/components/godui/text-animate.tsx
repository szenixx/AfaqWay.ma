"use client";

/* TextAnimate — ported from the godui text-animate motion, the same way
   MorphingDialog and the decorative backgrounds were: the component lives in
   this repo rather than arriving as a dependency.

   Text is split by word, character or line and each piece enters on a stagger.
   Splitting is presentational only — the whole string stays in the accessible
   tree as one label, so a screen reader reads a sentence, not a word list. */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export type TextAnimateAnimation =
  | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "fadeIn" | "blurIn";

const ANIMATIONS: Record<TextAnimateAnimation, Variants> = {
  slideLeft: { hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0 } },
  slideRight: { hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0 } },
  slideUp: { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } },
  slideDown: { hidden: { opacity: 0, y: -18 }, show: { opacity: 1, y: 0 } },
  fadeIn: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  blurIn: { hidden: { opacity: 0, filter: "blur(8px)" }, show: { opacity: 1, filter: "blur(0px)" } },
};

/** Splits while keeping the spaces, so the rendered line still reads normally. */
function split(text: string, by: "word" | "character" | "line"): string[] {
  if (by === "line") return text.split("\n");
  if (by === "character") return Array.from(text);
  return text.split(/(\s+)/).filter((p) => p.length > 0);
}

export function TextAnimate({
  children, animation = "fadeIn", by = "word", className,
  delay = 0, duration = 0.5, once = true, repeatEvery,
}: {
  children: string;
  animation?: TextAnimateAnimation;
  by?: "word" | "character" | "line";
  className?: string;
  delay?: number;
  duration?: number;
  once?: boolean;
  /** Seconds between replays. Omit to play once. */
  repeatEvery?: number;
}) {
  const reduce = useReducedMotion();
  const parts = useMemo(() => split(children, by), [children, by]);
  const variants = ANIMATIONS[animation] ?? ANIMATIONS.fadeIn;

  /* Remounting the subtree is what replays the stagger — bumping a key is
     cheaper and more reliable than driving the controls by hand, and it keeps
     every child's delay in step. Paused while the tab is hidden so a
     background tab is not animating to nobody. */
  const [run, setRun] = useState(0);
  useEffect(() => {
    if (!repeatEvery || reduce) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setRun((n) => n + 1);
    }, repeatEvery * 1000);
    return () => clearInterval(id);
  }, [repeatEvery, reduce]);

  /* Motion is emphasis here, never information — with reduced motion the text
     is simply present. */
  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      key={run}
      aria-label={children}
      className={className}
      initial="hidden"
      style={{ display: "inline-block" }}
      transition={{ staggerChildren: by === "character" ? 0.018 : 0.055, delayChildren: delay }}
      {...(repeatEvery ? { animate: "show" } : { whileInView: "show", viewport: { once } })}
    >
      {parts.map((part, i) =>
        /^\s+$/.test(part) ? (
          <span key={i}> </span>
        ) : (
          <motion.span
            key={i}
            aria-hidden
            style={{ display: "inline-block", willChange: "transform, opacity" }}
            transition={{ duration, ease: [0.4, 0, 0.2, 1] }}
            variants={variants}
          >
            {part}
          </motion.span>
        ),
      )}
    </motion.span>
  );
}

export default TextAnimate;
