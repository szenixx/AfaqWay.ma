"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/* Lamp — ported from the godui lamp effect: two conic light cones meet at a
   glowing bar and switch on as the section scrolls into view, with the
   content rising into the light. Colour is the platform primary blue
   (--indigo-600), never the source's purple/theme default. */

const VIEWPORT = { once: true, margin: "-20%" } as const;

export function Lamp({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduceMotion = useReducedMotion();
  const lit = { scaleX: 1, opacity: 1 };
  const unlit = { scaleX: 0.5, opacity: 0 };
  const ease = { duration: 0.8, ease: "easeInOut" as const };

  return (
    <div className={`af-lamp${className ? " " + className : ""}`} style={style}>
      <div className="af-lamp-rig" aria-hidden>
        <motion.div className="af-lamp-cone left" initial={reduceMotion ? lit : unlit} whileInView={lit} viewport={VIEWPORT} transition={ease} />
        <motion.div className="af-lamp-cone right" initial={reduceMotion ? lit : unlit} whileInView={lit} viewport={VIEWPORT} transition={ease} />
        <motion.div className="af-lamp-bar" initial={reduceMotion ? lit : unlit} whileInView={lit} viewport={VIEWPORT} transition={ease} />
        <motion.div className="af-lamp-halo" initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={VIEWPORT} transition={ease} />
      </div>

      <motion.div
        style={{ position: "relative", zIndex: 1 }}
        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEWPORT}
        transition={{ ...ease, delay: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default Lamp;
