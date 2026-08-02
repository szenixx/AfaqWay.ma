import type { CSSProperties, ReactNode } from "react";

/**
 * The generic floating card: white, 28px radius, --elev-2, 24px padding, lifts
 * 3px on hover. Use for any surface that isn't one of the five card roles.
 *
 * @startingPoint section="Core" subtitle="Generic 28px floating surface" viewport="700x220"
 */
export interface CardProps {
  children?: ReactNode;
  /** Apply the lift-on-hover treatment. Default true. */
  hover?: boolean;
  /** Renders as a button when set. */
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

export function Card(props: CardProps): JSX.Element;
export default Card;
