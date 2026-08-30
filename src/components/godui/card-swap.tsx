"use client";

/* CardSwap — ported from the godui card-swap: a stack of cards where the front
   one retires to the back on an interval, the rest step forward. Depth comes
   from a small translate + scale per position, so any number of children work.

   Paused on hover and while the tab is hidden; static under reduced motion,
   which leaves the top card readable rather than cycling behind the reader.

   On a phone this becomes a different STRUCTURE, not a narrower version of the
   same one: a horizontal swipe carousel, one card at a time, with the same
   dot row as the indicator. A pointer-hover stack simply has no phone
   equivalent — there is no hover, and auto-advance would mean a card sliding
   away while a thumb was mid-swipe on it. The branch is decided via
   matchMedia, not a media query, because the interaction itself changes
   (drag-to-advance vs timer-to-advance), which CSS alone cannot move from
   one to the other.

   Live, not a one-time snapshot at mount: this widget sits on a page a
   student can leave open, resize, split-screen, or rotate a foldable on —
   unlike a one-question onboarding step that remounts fresh on every screen,
   there is no natural remount here to fall back on, so a snapshot taken once
   would stay wrong for the rest of the visit after a resize crossed 767px. */

import { motion, useReducedMotion, type PanInfo } from "framer-motion";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsPhone } from "@/lib/useIsPhone";

export function CardSwap({ children, className, interval = 4000 }: {
  children: ReactNode; className?: string; interval?: number;
}) {
  const phone = useIsPhone();
  return phone
    ? <TouchCardSwap className={className} interval={interval}>{children}</TouchCardSwap>
    : <AutoCardSwap className={className} interval={interval}>{children}</AutoCardSwap>;
}

/* ── Desktop / tablet: the original auto-advancing stack, unchanged ── */
function AutoCardSwap({ children, className, interval = 4000 }: {
  children: ReactNode; className?: string; interval?: number;
}) {
  const items = Children.toArray(children);
  const [front, setFront] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  const advance = useCallback(() => setFront((f) => (f + 1) % Math.max(1, items.length)), [items.length]);

  useEffect(() => {
    if (reduce || paused || items.length < 2) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      advance();
    }, interval);
    return () => clearInterval(id);
  }, [advance, interval, paused, reduce, items.length]);

  return (
    <div
      className={cn("cardswap", className)}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
    >
      {items.map((child, i) => {
        /* 0 = front, 1 = behind it, and so on around the ring. */
        const depth = (i - front + items.length) % items.length;
        return (
          <motion.div
            key={i}
            animate={{
              y: depth * -14,
              x: depth * 10,
              scale: 1 - depth * 0.05,
              opacity: depth > 2 ? 0 : 1,
              zIndex: items.length - depth,
            }}
            className="cardswap__card"
            /* Buried cards are out of the document for good: `pointerEvents`
               alone stops the mouse but leaves their buttons in the tab order,
               so a keyboard would land on a control nobody can see. */
            inert={depth !== 0}
            initial={false}
            style={{ pointerEvents: depth === 0 ? "auto" : "none" }}
            transition={{ type: "spring", stiffness: 220, damping: 26 }}
          >
            {child}
          </motion.div>
        );
      })}

      {items.length > 1 && (
        <div className="cardswap__dots" role="tablist" aria-label="Cards">
          {items.map((_, i) => (
            <button
              key={i} type="button" role="tab"
              aria-label={`Card ${i + 1}`} aria-selected={i === front}
              className={cn("cardswap__dot", i === front && "on")}
              onClick={() => setFront(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Phone: a swipe carousel ──
   One card fills the track at a time; the whole row translates by card
   widths, so nothing is ever left half on/half off screen. Dragging tracks
   the finger 1:1 (transition duration 0) and only snaps once released,
   past a distance OR a flick-velocity threshold — matching how a native
   gallery decides "did they mean to change cards". Auto-advances on the
   same timer and the same wrap-around as the desktop stack, paused for as
   long as a finger is actually on it — the swipe is the one gesture that
   must never be fought by a card sliding out from under it mid-drag. */
function TouchCardSwap({ children, className, interval = 4000 }: {
  children: ReactNode; className?: string; interval?: number;
}) {
  const items = Children.toArray(children);
  const count = items.length;
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(1);
  const [front, setFront] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const reduce = useReducedMotion();

  // Measuring the DOM is the "subscribe to an external system" case; ref
  // access belongs in an effect, never read directly during render.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setTrackWidth(el.offsetWidth || 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || dragging || count < 2) return;
    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      setFront((f) => (f + 1) % count);
    }, interval);
    return () => clearInterval(id);
  }, [reduce, dragging, count, interval]);

  const onPanEnd = (_: unknown, info: PanInfo) => {
    setDragging(false);
    setDragPx(0);
    const pastDistance = Math.abs(info.offset.x) > trackWidth * 0.22;
    const pastVelocity = Math.abs(info.velocity.x) > 500;
    if (!pastDistance && !pastVelocity) return;
    if (info.offset.x < 0) setFront((f) => Math.min(f + 1, count - 1));
    else setFront((f) => Math.max(f - 1, 0));
  };

  const dragPct = dragging ? (dragPx / trackWidth) * 100 : 0;

  return (
    <div className={cn("cardswap cardswap--touch", className)}>
      <div ref={trackRef} className="cardswap__track">
        <motion.div
          className="cardswap__row"
          onPanStart={() => setDragging(true)}
          onPan={(_, info) => setDragPx(info.offset.x)}
          onPanEnd={onPanEnd}
          animate={{ x: `${-front * 100 + dragPct}%` }}
          transition={dragging || reduce ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 32 }}
        >
          {items.map((child, i) => (
            <div key={i} className="cardswap__slide" inert={i !== front ? true : undefined}>
              {child}
            </div>
          ))}
        </motion.div>
      </div>

      {count > 1 && (
        <div className="cardswap__dots" role="tablist" aria-label="Cards">
          {items.map((_, i) => (
            <button
              key={i} type="button" role="tab"
              aria-label={`Card ${i + 1}`} aria-selected={i === front}
              className={cn("cardswap__dot", i === front && "on")}
              onClick={() => setFront(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CardSwap;
