/* Full-bleed decorative backgrounds — ported from the godui decorative-
   background and geometric-background components. Drop as the first child of
   a `position: relative` container; content sits above them.

   Both are recoloured to the platform's primary blue (--indigo-600 #162E8C
   and its tints) instead of the sources' violet defaults, per the design
   system rule that colours come from the platform, never from a UI kit. */

import type { CSSProperties, HTMLAttributes } from "react";

const base: CSSProperties = { position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" };

/** Soft radial wash. Used as the default cover on every student profile. */
export function DecorativeBackground({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      {...props}
      style={{
        ...base,
        background: "radial-gradient(circle at 30% 60%, #F6F8FF 0%, #E8EEFF 15%, #C4CEEE 30%, #7E93D8 45%, #3D63B4 60%, #1230A6 75%, #162E8C 90%, #0F256F 100%)",
        ...style,
      }}
    />
  );
}

/** Grid ruling plus two corner blooms. Used as the workspace canvas. */
export function GeometricBackground({ style, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      {...props}
      style={{
        ...base,
        backgroundImage: [
          "linear-gradient(to right, rgba(22,46,140,.05) 1px, transparent 1px)",
          "linear-gradient(to bottom, rgba(22,46,140,.05) 1px, transparent 1px)",
          "radial-gradient(circle 600px at 0% 200px, rgba(22,46,140,.16), transparent)",
          "radial-gradient(circle 600px at 100% 200px, rgba(22,46,140,.16), transparent)",
        ].join(","),
        backgroundSize: "20px 20px, 20px 20px, 100% 100%, 100% 100%",
        ...style,
      }}
    />
  );
}
