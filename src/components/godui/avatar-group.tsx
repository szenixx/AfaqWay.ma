"use client";

/* AvatarGroup — ported from the godui avatar-group: overlapping avatars that
   fan apart on hover, with a "+n" chip once the list runs past `max`.

   Entries animate in and out and the rest slide along, so a live roster reads
   as somebody arriving rather than the images swapping underneath you. Keyed
   by identity, not index — keying by position would animate the wrong avatar
   when the newest person lands at the front. */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export type GroupAvatar = {
  src?: string | null;
  alt: string;
  online?: boolean;
  /** Stable identity for the enter/leave animation. Falls back to `alt`. */
  key?: string;
};

export function AvatarGroup({ avatars, max = 4, className }: {
  avatars: GroupAvatar[]; max?: number; className?: string;
}) {
  const reduce = useReducedMotion();
  const shown = avatars.slice(0, max);
  const extra = Math.max(0, avatars.length - shown.length);

  const initials = (n: string) =>
    n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";

  return (
    <div className={cn("avgrp", className)} role="group" aria-label={`${avatars.length} people`}>
      <AnimatePresence initial={false} mode="popLayout">
        {shown.map((a) => (
        <motion.span
          key={a.key ?? a.alt}
          layout={!reduce}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          className="avgrp__item"
          exit={reduce ? undefined : { opacity: 0, scale: 0.6, transition: { duration: 0.18 } }}
          initial={reduce ? false : { opacity: 0, scale: 0.6, x: -10 }}
          title={a.alt}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          whileHover={reduce ? undefined : { y: -4, scale: 1.08 }}
        >
          {/* Signed Supabase URL with a short TTL: next/image would cache a
              link that expires, and these are 32px. Same call UserAvatar makes. */}
          {a.src
            // eslint-disable-next-line @next/next/no-img-element
            ? <img alt={a.alt} className="avgrp__img" loading="lazy" src={a.src} />
            : <span className="avgrp__fallback">{initials(a.alt)}</span>}
          {a.online && <span aria-hidden className="avgrp__dot" />}
        </motion.span>
        ))}
      </AnimatePresence>
      {extra > 0 && <span className="avgrp__more" title={`${extra} more`}>+{extra}</span>}
    </div>
  );
}

export default AvatarGroup;
