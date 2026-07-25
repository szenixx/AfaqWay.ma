"use client";

/* The platform's one loading indicator.

   Replaces every spinner across both workspaces. Three orbiting dots in the
   AfaqWay palette, sized by `size`, with `label` announced to screen readers.
   Under prefers-reduced-motion the motion stops and the dots simply pulse. */

export type LoaderProps = {
  /** Diameter in px. 20 for buttons, 32 inline, 56 for a page. */
  size?: number;
  label?: string;
  /** Centres the loader in the available space with its label underneath. */
  block?: boolean;
  /** For dark surfaces (primary buttons). */
  onDark?: boolean;
  className?: string;
};

export function Loader({ size = 32, label = "Loading", block, onDark, className }: LoaderProps) {
  const dot = Math.max(4, Math.round(size * 0.22));
  const spinner = (
    <span
      className={`af-loader${onDark ? " on-dark" : ""}${className ? " " + className : ""}`}
      style={{ width: size, height: size, ["--af-dot" as string]: `${dot}px` }}
      role="status" aria-live="polite" aria-label={label}
    >
      <span /><span /><span />
    </span>
  );

  if (!block) return spinner;
  return (
    <div className="af-loader-block">
      {spinner}
      {label && <span className="af-loader-label">{label}</span>}
    </div>
  );
}

export default Loader;
