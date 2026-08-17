"use client";

import { useEffect, useRef } from "react";

/* Confetti burst, scoped to the element it is placed in.

   Canvas-based so nothing is added to the DOM per particle, absolutely
   positioned behind its sibling content, and it fires a fixed number of times
   then stops for good. Respects prefers-reduced-motion by not running at all. */

type Piece = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; color: string; life: number };

/* Brand triad first (primary, hover step, tertiary), then the pale brand line
   and two status hues, then white. Canvas paints pixels, so these have to be
   literal — they are the primary and tertiary ramp values, not new colours. */
const COLORS = ["#3B41C9", "#494ECD", "#1C328B", "#B6B8EA", "#256B49", "#8A5A0C", "#FFFFFF"];

export function Confetti({ bursts = 2, particles = 70, spread = 260, height = 160 }: {
  /** How many times to fire, total. Never loops beyond this. */
  bursts?: number;
  particles?: number;
  /** Width of the emitting area in px. */
  spread?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = spread * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const pieces: Piece[] = [];
    let fired = 0;
    let raf = 0;
    let stopped = false;

    const fire = () => {
      for (let i = 0; i < particles; i++) {
        const angle = (-Math.PI / 2) + (Math.random() - 0.5) * 1.6;
        const speed = 3 + Math.random() * 4;
        pieces.push({
          x: spread / 2 + (Math.random() - 0.5) * 60,
          y: height * 0.72,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.3,
          size: 4 + Math.random() * 4,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          life: 1,
        });
      }
      fired++;
    };

    const tick = () => {
      if (stopped) return;
      ctx.clearRect(0, 0, spread, height);
      for (const p of pieces) {
        p.vy += 0.13;              // gravity
        p.vx *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 0.011;
        if (p.life <= 0) continue;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      // Drop dead particles, and stop for good once the last burst has faded.
      for (let i = pieces.length - 1; i >= 0; i--) if (pieces[i].life <= 0) pieces.splice(i, 1);
      if (!pieces.length && fired >= bursts) { ctx.clearRect(0, 0, spread, height); return; }
      raf = requestAnimationFrame(tick);
    };

    fire();
    tick();
    const second = bursts > 1 ? setTimeout(fire, 900) : undefined;

    return () => { stopped = true; cancelAnimationFrame(raf); if (second) clearTimeout(second); };
  }, [bursts, particles, spread, height]);

  return (
    <canvas
      ref={ref} aria-hidden className="af-confetti"
      style={{ width: spread, height, left: "50%", top: 0, transform: "translateX(-50%)", position: "absolute" }}
    />
  );
}

export default Confetti;
