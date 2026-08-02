import type { CSSProperties } from "react";

/**
 * A hairline separator, optionally with a centred uppercase label.
 */
export interface DividerProps {
  label?: string;
  style?: CSSProperties;
}
export function Divider(props: DividerProps): JSX.Element;
export default Divider;
