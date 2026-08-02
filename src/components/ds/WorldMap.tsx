"use client";

import DottedMap from "dotted-map";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useMemo } from "react";

/* WorldMap — ported from the godui world-map: a dotted-land world map with
   arcs that draw between origin/destination pins and a ripple on each pin.
   Arc and pin colour is the platform primary blue (--indigo-600); land dots
   use the design system's faint ink, so nothing new is introduced. */

export type WorldMapPoint = { lat: number; lng: number; label?: string };
export type WorldMapConnection = { start: WorldMapPoint; end: WorldMapPoint };

/** Bounding box to draw. Defaults to the corridor that actually matters here:
 *  North Africa up through the Baltics, so Morocco and every destination fill
 *  the frame instead of being two specks on a whole-world map. */
export type WorldMapRegion = { lat: { min: number; max: number }; lng: { min: number; max: number } };
const DEFAULT_REGION: WorldMapRegion = { lat: { min: 30, max: 56 }, lng: { min: -30, max: 50 } };

export function WorldMap({
  connections, lineColor = "var(--indigo-600)", dotColor = "rgba(134,149,171,.45)",
  loop = true, duration = 1.6, region = DEFAULT_REGION, className, style,
}: {
  connections: WorldMapConnection[]; lineColor?: string; dotColor?: string;
  loop?: boolean; duration?: number; region?: WorldMapRegion; className?: string; style?: React.CSSProperties;
}) {
  const reduceMotion = useReducedMotion();
  const gradientId = useId().replace(/:/g, "");

  /* The dot grid is deterministic, so server and client render identical
     markup — no hydration mismatch. */
  const { markup, width, height, map } = useMemo(() => {
    const map = new DottedMap({ height: 46, grid: "diagonal", region });
    const svg = map.getSVG({ radius: 0.22, color: "currentColor", shape: "circle", backgroundColor: "transparent" });
    const inner = svg.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    const { width, height } = map.image;
    return { markup: inner, width, height, map };
  }, [region]);

  const arcs = useMemo(() => connections.map((c) => {
    const a = map.getPin({ lat: c.start.lat, lng: c.start.lng });
    const b = map.getPin({ lat: c.end.lat, lng: c.end.lng });
    if (!a || !b) return null;
    const cx = (a.x + b.x) / 2;
    const bow = Math.hypot(b.x - a.x, b.y - a.y) * 0.35;
    const cy = Math.min(a.y, b.y) - bow;
    return { d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`, start: { ...a, label: c.start.label }, end: { ...b, label: c.end.label } };
  }).filter((v): v is NonNullable<typeof v> => v !== null), [connections, map]);

  const pins = useMemo(() => {
    const seen = new Map<string, { x: number; y: number; label?: string }>();
    for (const arc of arcs) {
      seen.set(`${arc.start.x},${arc.start.y}`, { x: arc.start.x, y: arc.start.y, label: arc.start.label });
      seen.set(`${arc.end.x},${arc.end.y}`, { x: arc.end.x, y: arc.end.y, label: arc.end.label });
    }
    return [...seen.values()];
  }, [arcs]);

  return (
    <div className={className} style={{ position: "relative", width: "100%", aspectRatio: `${width} / ${height}`, ...style }}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="World map showing routes from Morocco to study destinations" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", color: dotColor }}>
        <g dangerouslySetInnerHTML={{ __html: markup }} />

        <defs>
          {/* Fade the arc ends so each beam emerges from and dissolves into its pin. */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="12%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="88%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {arcs.map((arc, i) => (
          <motion.path
            key={i}
            d={arc.d}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={0.35}
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={reduceMotion ? { duration: 0 } : {
              pathLength: {
                duration, delay: 0.4 + i * 0.3, ease: [0.22, 1, 0.36, 1],
                repeat: loop ? Number.POSITIVE_INFINITY : 0,
                repeatDelay: loop ? connections.length * 0.3 : 0,
                repeatType: "loop",
              },
            }}
          />
        ))}

        {pins.map((pin) => (
          <g key={`${pin.x},${pin.y}`}>
            {!reduceMotion && (
              <motion.circle
                cx={pin.x} cy={pin.y} r={0.5} fill={lineColor}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            )}
            <circle cx={pin.x} cy={pin.y} r={0.5} fill={lineColor}>
              {pin.label ? <title>{pin.label}</title> : null}
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default WorldMap;
