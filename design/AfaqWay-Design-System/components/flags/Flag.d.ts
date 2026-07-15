/**
 * Country flag chip — destination picker (lg 42x30), language switch / rows (md 24x18), inline (sm 16x12). Flags are never recoloured.
 * @startingPoint section="Primitives" subtitle="Flag chip, 3 sizes, stripe fallback" viewport="700x150"
 */
export interface FlagProps {
  /** Real flag asset URL — preferred */
  src?: string;
  /** Stopgap: array of stripe colours, top to bottom, e.g. ['#FDB913','#006A44','#C1272D'] for Lithuania */
  stripes?: string[];
  /** Emoji flag glyph fallback (correct choice inside native selects) */
  emoji?: string;
  /** lg 42x30 | md 24x18 | sm 16x12. Default md */
  size?: 'lg' | 'md' | 'sm';
  /** Coming-soon destination: grayscale + dimmed */
  unavailable?: boolean;
  /** 1.5px indigo outer border (image never tinted) */
  selected?: boolean;
  style?: React.CSSProperties;
}
export declare function Flag(props: FlagProps): JSX.Element;