/**
 * Outline icon from the AfaqWay 20x20 glyph library (1.75px stroke, rounded caps; auto 1.5px below 16px).
 * @startingPoint section="Primitives" subtitle="Outline glyph library, 1.75px stroke" viewport="700x150"
 */
export interface IconProps {
  /** Glyph name: status-not-started | status-applied | status-under-review | status-needs-changes | status-approved | document | upload | passport | diploma | calendar | chat | phone | email | payment | search | bell | settings | chevron-down | logout */
  name: string;
  /** Px size: 14 inline, 16 rows, 18 buttons, 20 top bar. Default 20 */
  size?: number;
  /** CSS colour; defaults to currentColor (--ink-soft at rest) */
  color?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;