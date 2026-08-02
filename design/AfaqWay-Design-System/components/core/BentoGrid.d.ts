import type { CSSProperties, ReactNode } from "react";

/**
 * An asymmetric grid of white cards (icon tile + title + description) for
 * dashboard highlight rows. `colSpan`/`rowSpan` let one card stretch.
 *
 * @startingPoint section="Core" subtitle="Asymmetric highlight-card grid" viewport="760x360"
 */
export interface BentoGridProps { children?: ReactNode; className?: string; style?: CSSProperties }
export function BentoGrid(props: BentoGridProps): JSX.Element;

export interface BentoCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  colSpan?: number;
  rowSpan?: number;
  style?: CSSProperties;
}
export function BentoCard(props: BentoCardProps): JSX.Element;
