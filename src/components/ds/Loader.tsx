"use client";

/* The platform's one loading indicator.
 *
 * A single swirling arc in the AfaqWay blue: the stroke grows and shrinks while
 * the whole circle turns, so the motion never looks stalled the way a constant
 * arc can. It replaces every spinner in both workspaces.
 *
 * Deliberately wordless. A spinner appears while someone waits, and a label
 * beside it repeats what the screen already says; the word is kept only for
 * assistive technology, which has no other way to know. Callers may still pass
 * `label` — it is announced, never drawn.
 *
 * The keyframes live in ds.css with everything else rather than in a <style>
 * tag here, so mounting twenty loaders does not put twenty copies of the same
 * CSS in the document. */

export type LoaderProps = {
  /** Diameter in px. 20 for buttons, 32 inline, 56 for a page. */
  size?: number;
  /** Announced to screen readers. Never rendered as text. */
  label?: string;
  /** Centres the loader in the available space. */
  block?: boolean;
  /** For dark surfaces (primary buttons). */
  onDark?: boolean;
  className?: string;
};

export function Loader({ size = 32, label = "Loading", block, onDark, className }: LoaderProps) {
  const spinner = (
    <span
      className={`af-loader${onDark ? " on-dark" : ""}${className ? " " + className : ""}`}
      style={{ width: size, height: size }}
      role="status" aria-live="polite" aria-label={label}
    >
      <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
        <circle
          className="af-loader-arc"
          cx="400" cy="400" r="200"
          fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="50"
        />
      </svg>
    </span>
  );

  return block ? <div className="af-loader-block">{spinner}</div> : spinner;
}

export default Loader;
