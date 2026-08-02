import type { CSSProperties } from "react";

/**
 * The loading placeholder for text/avatar while content streams in. Shimmer
 * animation; disabled under prefers-reduced-motion.
 *
 * @startingPoint section="Feedback" subtitle="Shimmer loading placeholder — text or avatar" viewport="300x140"
 */
export interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  /** Square + fully round — for avatars. */
  circle?: boolean;
  radius?: string;
  style?: CSSProperties;
}
export function Skeleton(props: SkeletonProps): JSX.Element;
