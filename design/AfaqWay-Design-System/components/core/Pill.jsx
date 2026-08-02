import React from "react";

/* AfaqWay Pill — the one label / badge / tag / chip. Colour arrives from the
   five tone tokens; shape, rhythm and optional slots (icon, avatar, delta) live
   in .ds-pill. Ported from the codebase Pill.tsx. */

const TONE = {
  grey: { text: "var(--grey)", tint: "var(--grey-tint)", line: "var(--grey-line)" },
  indigo: { text: "var(--indigo-text)", tint: "var(--indigo-tint)", line: "var(--indigo-line)" },
  amber: { text: "var(--amber)", tint: "var(--amber-tint)", line: "var(--amber-line)" },
  red: { text: "var(--red)", tint: "var(--red-tint)", line: "var(--red-line)" },
  green: { text: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)" },
};

export function Pill({
  children, tone = "grey", size = "md", icon, avatar, delta, deltaSuffix = "",
  ghost, onClick, title, className = "", style,
}) {
  const t = TONE[tone] ?? TONE.grey;
  const interactive = Boolean(onClick);
  const base = {
    color: t.text,
    background: ghost ? "transparent" : t.tint,
    borderColor: ghost ? "transparent" : t.line,
    ...style,
  };
  const inner = (
    <>
      {avatar && <span className="ds-pill-avatar">{avatar}</span>}
      {icon && <span className="ds-pill-ico">{icon}</span>}
      {children != null && children !== "" && <span className="ds-pill-text">{children}</span>}
      {typeof delta === "number" && (
        <span className={`ds-pill-delta${delta < 0 ? " down" : delta > 0 ? " up" : ""}`}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"}
          {Math.abs(delta)}{deltaSuffix}
        </span>
      )}
    </>
  );
  const cls = `ds-pill ${size}${ghost ? " ghost" : ""}${interactive ? " act" : ""} ${className}`.trim();
  return interactive
    ? <button type="button" className={cls} style={base} onClick={onClick} title={title}>{inner}</button>
    : <span className={cls} style={base} title={title}>{inner}</span>;
}
