import type { CSSProperties, ReactNode } from "react";

/**
 * A collapsible notification stack: collapsed shows peeking card edges melded
 * together (scale/offset falloff); expanded spreads items with `expandedGap`.
 * Sits at the top of the notification tray/panel.
 *
 * @startingPoint section="Feedback" subtitle="Collapsible notification card stack" viewport="360x220"
 */
export interface GooeyStackProps {
  children?: ReactNode;
  collapsed?: boolean;
  /** Gap between items when expanded, in px. Default 18. */
  expandedGap?: number;
  /** Corner radius of the stack's cards, in px. Default 22. */
  radius?: number;
  style?: CSSProperties;
}
export function GooeyStack(props: GooeyStackProps): JSX.Element;
