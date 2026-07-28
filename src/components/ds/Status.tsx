import type { CSSProperties } from "react";

/* Status — one indicator for every state the platform reports.
 *
 * A status is a dot plus a word. The dot carries the colour, the word carries
 * the meaning, and neither is ever invented at the call site: passing a state
 * name picks both, so "pending" looks the same in Payments, in Journey and in
 * the admin tables.
 *
 * Two liveness animations, both optional and both off by default:
 *   pulse  the dot breathes — something is ongoing (processing, typing)
 *   ping   a ring expands outward — someone is present right now (online)
 *
 * Colour never carries the meaning alone: every status renders its label, so
 * the indicator survives a colour-blind reader and a greyscale print. */

export type StatusState =
  | "success" | "error" | "warning" | "info" | "neutral"
  | "online" | "offline" | "pending" | "processing";

const STATE: Record<StatusState, { label: string; color: string; tint: string }> = {
  success:    { label: "Success",    color: "var(--green-soft)",  tint: "var(--green-tint)" },
  error:      { label: "Error",      color: "var(--red-soft)",    tint: "var(--red-tint)" },
  warning:    { label: "Warning",    color: "var(--amber-soft)",  tint: "var(--amber-tint)" },
  info:       { label: "Info",       color: "var(--indigo-600)",  tint: "var(--indigo-tint)" },
  neutral:    { label: "Neutral",    color: "var(--grey)",        tint: "var(--grey-tint)" },
  online:     { label: "Online",     color: "var(--green-soft)",  tint: "var(--green-tint)" },
  offline:    { label: "Offline",    color: "var(--grey)",        tint: "var(--grey-tint)" },
  pending:    { label: "Pending",    color: "var(--amber-soft)",  tint: "var(--amber-tint)" },
  processing: { label: "Processing", color: "var(--indigo-600)",  tint: "var(--indigo-tint)" },
};

/** The states that are live by nature, so the animation is the default there. */
const LIVE: Partial<Record<StatusState, "pulse" | "ping">> = {
  online: "ping",
  processing: "pulse",
  pending: "pulse",
};

export type StatusProps = {
  state: StatusState;
  /** Overrides the state's own word, e.g. "Awaiting review" for `pending`. */
  label?: string;
  /** Dot only, for dense rows and avatars. The label still reaches a reader. */
  dotOnly?: boolean;
  /** Tinted chip behind the indicator, for when it stands alone in a cell. */
  chip?: boolean;
  pulse?: boolean;
  ping?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Status({ state, label, dotOnly, chip, pulse, ping, className = "", style }: StatusProps) {
  const s = STATE[state] ?? STATE.neutral;
  const text = label ?? s.label;
  // An explicit prop always wins; otherwise the state's own nature decides.
  const wantsPing = ping ?? LIVE[state] === "ping";
  const wantsPulse = pulse ?? LIVE[state] === "pulse";
  const animate = wantsPing ? " ping" : wantsPulse ? " pulse" : "";

  const dot = (
    <span
      className={`ds-status-dot${animate}`}
      // The ring reads its colour from the dot, so one value drives both.
      style={{ background: s.color, "--ds-status": s.color } as CSSProperties}
      aria-hidden
    />
  );

  if (dotOnly) {
    return <span className={`ds-status dot-only ${className}`.trim()} style={style} title={text} role="img" aria-label={text}>{dot}</span>;
  }

  return (
    <span
      className={`ds-status${chip ? " chip" : ""} ${className}`.trim()}
      style={{ color: s.color, ...(chip ? { background: s.tint } : null), ...style }}
    >
      {dot}
      <span className="ds-status-label">{text}</span>
    </span>
  );
}
