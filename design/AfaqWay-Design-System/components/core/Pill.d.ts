import type { CSSProperties, ReactNode } from "react";

/**
 * The one label / badge / tag / chip. Five tones, two sizes, optional leading
 * icon or avatar and a trailing signed delta. Never hand-roll a chip.
 *
 * @startingPoint section="Core" subtitle="Label / badge / tag in five tones" viewport="700x150"
 */
export interface PillProps {
  children?: ReactNode;
  /** Colour family. Default "grey". */
  tone?: "grey" | "indigo" | "amber" | "red" | "green";
  size?: "sm" | "md";
  /** Leading glyph (11–13px). */
  icon?: ReactNode;
  /** Leading avatar/flag, clipped round to the pill height. */
  avatar?: ReactNode;
  /** Trailing change: positive reads up/green, negative down/red. */
  delta?: number;
  deltaSuffix?: string;
  /** Transparent until hovered, for dense rows. */
  ghost?: boolean;
  /** Makes the pill an activatable control. */
  onClick?: () => void;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

export function Pill(props: PillProps): JSX.Element;
