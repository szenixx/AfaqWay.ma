"use client";

/* MagicButton — ported from the godui magic-button: a conic sheen that travels
   the border while the label sits on a still surface above it. The glow is a
   pseudo-layer, so it never moves the button's box and cannot shift layout. */

import { useReducedMotion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MagicButton({
  children, variant = "default", className, ...rest
}: {
  children: ReactNode;
  variant?: "default" | "outline";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      {...rest}
      className={cn("magic-btn", `magic-btn--${variant}`, reduce && "magic-btn--still", className)}
    >
      <span aria-hidden className="magic-btn__sheen" />
      <span className="magic-btn__face">{children}</span>
    </button>
  );
}

export default MagicButton;
