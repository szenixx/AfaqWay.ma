/**
 * The platform's single loading indicator: a swirling indigo arc. Deliberately
 * wordless — `label` is announced to screen readers, never drawn.
 */
export interface LoaderProps {
  /** Diameter in px. 16–20 for buttons, 32 inline, 56 for a page. */
  size?: number;
  label?: string;
  /** Centres the loader in the available space. */
  block?: boolean;
  /** For dark surfaces (primary buttons). */
  onDark?: boolean;
  className?: string;
}

export function Loader(props: LoaderProps): JSX.Element;
export default Loader;
