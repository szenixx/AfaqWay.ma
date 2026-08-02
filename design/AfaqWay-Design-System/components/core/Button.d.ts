import type { CSSProperties, ReactNode } from "react";

/**
 * The platform's primary button. One of only two button families (with JrButton).
 * A full capsule; four variants; pressing scales to .97. Never hand-roll a button.
 *
 * @startingPoint section="Core" subtitle="Primary / ghost / neutral / destructive capsule button" viewport="700x150"
 */
export interface ButtonProps {
  /** Fill treatment. "light" is a Mantine-style tinted fill in `color` (or indigo by default). Default "primary". */
  variant?: "primary" | "ghost" | "neutral" | "destructive" | "light";
  /** md → height 40; lg → height 44. Default "md". */
  size?: "md" | "lg";
  /** Leading icon node (a 14–16px lucide glyph). */
  icon?: ReactNode;
  disabled?: boolean;
  /** Swaps content for the platform Loader. */
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  /** Only used by variant="light" — any CSS colour (e.g. a status token) tints the fill/text. Defaults to indigo. */
  color?: string;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
