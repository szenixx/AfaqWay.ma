/* Full-bleed decorative backgrounds — ported from the godui decorative-
   background and geometric-background components. Drop as the first child of
   a `position: relative` container; content sits above them.

   Both are recoloured to the platform's primary blue (--indigo-600 #3B41C9
   and its tints) instead of the sources' violet defaults, per the design
   system rule that colours come from the platform, never from a UI kit.
   Inline gradients cannot read CSS custom properties through the style
   prop's shorthand here, so the ramp steps are written literally — they are
   --primary-50 through --primary-700, in order. */

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
        background: "radial-gradient(circle at 30% 60%, #F5F5FD 0%, #E2E3F8 15%, #C1C2EE 30%, #878BDE 45%, #5B60D2 60%, #494ECD 75%, #3B41C9 90%, #262CA3 100%)",
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
          "linear-gradient(to right, rgba(59,65,201,.05) 1px, transparent 1px)",
          "linear-gradient(to bottom, rgba(59,65,201,.05) 1px, transparent 1px)",
          "radial-gradient(circle 600px at 0% 200px, rgba(59,65,201,.16), transparent)",
          "radial-gradient(circle 600px at 100% 200px, rgba(59,65,201,.16), transparent)",
        ].join(","),
        backgroundSize: "20px 20px, 20px 20px, 100% 100%, 100% 100%",
        ...style,
      }}
    />
  );
}
