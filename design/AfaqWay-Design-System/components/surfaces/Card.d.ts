/**
 * The platform's single surface: white, 1px line border, 16px radius, whisper shadow. Never nest cards — use Divider.
 * @startingPoint section="Primitives" subtitle="White card, hairline border, 16px radius" viewport="700x200"
 */
export interface CardProps {
  /** Uppercase section eyebrow, 10.5 caps faint */
  eyebrow?: string;
  /** Section title, 18/24 600 */
  title?: string;
  /** Padding px, 24-28. Default 24 */
  padding?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;