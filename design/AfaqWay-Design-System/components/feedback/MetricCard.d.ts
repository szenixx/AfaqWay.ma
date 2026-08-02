import type { CSSProperties, ReactNode } from "react";

/**
 * The one statistics card: pastel header, white circular icon, oversized outline
 * watermark, big number, title, description and a trend badge. Six tones.
 *
 * @startingPoint section="Feedback" subtitle="Pastel-header statistics tile" viewport="700x220"
 */
export interface MetricCardProps {
  /** Pastel header + icon + badge colour. Default "blue". */
  tone?: "blue" | "indigo" | "green" | "amber" | "red";
  /** Icon node shown in the white circular tile. */
  icon?: ReactNode;
  /** Oversized outline glyph behind the content (rendered at .06 opacity). */
  watermark?: ReactNode;
  value: string | number;
  title: string;
  subtitle?: string;
  /** Trend badge; `up` picks the arrow, omit for a plain label. */
  badge?: { label: string; up?: boolean };
  style?: CSSProperties;
}
export function MetricCard(props: MetricCardProps): JSX.Element;
export default MetricCard;
