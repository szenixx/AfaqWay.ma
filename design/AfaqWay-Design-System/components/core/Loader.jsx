import React from "react";

/* AfaqWay Loader — the one spinner. A swirling arc in the platform blue whose
   stroke grows and shrinks while the whole circle turns. Wordless; the label is
   for assistive tech only. Keyframes live in base.css. Ported from Loader.tsx. */

export function Loader({ size = 32, label = "Loading", block, onDark, className }) {
  const spinner = (
    <span
      className={`af-loader${onDark ? " on-dark" : ""}${className ? " " + className : ""}`}
      style={{ width: size, height: size }}
      role="status" aria-live="polite" aria-label={label}
    >
      <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
        <circle className="af-loader-arc" cx="400" cy="400" r="200" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="50" />
      </svg>
    </span>
  );
  return block ? <div className="af-loader-block">{spinner}</div> : spinner;
}

export default Loader;
