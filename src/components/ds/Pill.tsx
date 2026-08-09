import type { CSSProperties, ReactNode } from "react";

/* Pill — the platform's one label / badge / tag / chip.
 *
 * Everything that used to be a hand-rolled <span className="pill pill-green">
 * or a bespoke inline-styled chip goes through this. One component means one
 * set of paddings, one radius and one type scale, so a tag in the admin tables
 * and a tag in the student workspace cannot drift apart.
 *
 * The slots exist because the old chips had them, scattered: an icon on the
 * left, an avatar on the left, a delta on the right. They are optional and
 * compose in any combination.
 *
 * Colour comes from the tone tokens in ds.css. No new palette. */

export type PillTone = "grey" | "indigo" | "amber" | "red" | "green" | "purple";
export type PillSize = "sm" | "md";

const TONE: Record<PillTone, { text: string; tint: string; line: string }> = {
  grey: { text: "var(--grey)", tint: "var(--grey-tint)", line: "var(--grey-line)" },
  indigo: { text: "var(--indigo-text)", tint: "var(--indigo-tint)", line: "var(--indigo-line)" },
  amber: { text: "var(--amber)", tint: "var(--amber-tint)", line: "var(--amber-line)" },
  red: { text: "var(--red)", tint: "var(--red-tint)", line: "var(--red-line)" },
  green: { text: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)" },
  purple: { text: "var(--purple)", tint: "var(--purple-tint)", line: "var(--purple-line)" },
};

export type PillProps = {
  children?: ReactNode;
  tone?: PillTone;
  size?: PillSize;
  /** Leading glyph, e.g. a lucide icon at 11–13px. */
  icon?: ReactNode;
  /** Leading avatar or flag. Rendered round and clipped to the pill height. */
  avatar?: ReactNode;
  /**
   * Trailing change indicator. A positive number reads as up and green, a
   * negative one as down and red, independent of the pill's own tone.
   */
  delta?: number;
  /** Suffix for the delta, e.g. "%" — purely presentational. */
  deltaSuffix?: string;
  /** Transparent until hovered, for pills that sit inside dense rows. */
  ghost?: boolean;
  /** Makes the pill an activatable control rather than a label. */
  onClick?: () => void;
  title?: string;
  className?: string;
  style?: CSSProperties;
};

export function Pill({
  children, tone = "grey", size = "md", icon, avatar, delta, deltaSuffix = "",
  ghost, onClick, title, className = "", style,
}: PillProps) {
  const t = TONE[tone] ?? TONE.grey;
  const interactive = Boolean(onClick);

  const base: CSSProperties = {
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

  return interactive ? (
    <button type="button" className={cls} style={base} onClick={onClick} title={title}>{inner}</button>
  ) : (
    <span className={cls} style={base} title={title}>{inner}</span>
  );
}
