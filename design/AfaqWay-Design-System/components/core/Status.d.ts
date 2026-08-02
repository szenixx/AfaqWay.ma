import type { CSSProperties } from "react";

export type StatusState =
  | "success" | "error" | "warning" | "info" | "neutral"
  | "online" | "offline" | "busy" | "away" | "typing"
  | "pending" | "processing" | "waiting" | "submitted" | "draft"
  | "completed" | "approved" | "rejected" | "cancelled"
  | "paid" | "failed" | "refunded"
  | "read" | "delivered";

/**
 * The platform's only status indicator: a named state → a dot + a word in one of
 * five tones. Live states (online, typing, processing…) animate by default. The
 * word always renders, so meaning survives greyscale and colour blindness.
 *
 * @startingPoint section="Core" subtitle="24-state dot + label vocabulary" viewport="700x150"
 */
export interface StatusProps {
  state: StatusState;
  /** Overrides the state's own word, e.g. "Waiting review". */
  label?: string;
  /** outline (default) · soft (tinted fill) · plain (no pill). */
  variant?: "outline" | "soft" | "plain";
  /** md matches reference proportions; sm/xs for dense rows. Default "sm". */
  size?: "xs" | "sm" | "md";
  /** Indicator only; the label still reaches assistive tech. */
  dotOnly?: boolean;
  pulse?: boolean;
  ping?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Status(props: StatusProps): JSX.Element;
