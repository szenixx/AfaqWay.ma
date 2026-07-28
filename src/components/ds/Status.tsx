import type { CSSProperties } from "react";

/* Status — the one status indicator for the platform.
 *
 * Shaped after the Kibo UI status badge: a fully rounded pill, an outline by
 * default, a small coloured indicator with a ping ring, and a label beside it.
 * Rebuilt on the AfaqWay tokens rather than installed, so there is one styling
 * system and the colours are ours.
 *
 * A status is a dot AND a word. The word is never optional in a way that loses
 * meaning: with `dotOnly` the label still reaches assistive technology, so
 * colour is never the only carrier of the information.
 *
 * The vocabulary is a closed set of names — `paid`, `submitted`, `waiting`,
 * `draft` — rather than raw colours. Call sites name what something IS and the
 * table decides how it looks, so "pending" is the same amber everywhere and a
 * new screen cannot invent a seventh shade of "waiting". */

export type StatusState =
  /* Generic */
  | "success" | "error" | "warning" | "info" | "neutral"
  /* Presence */
  | "online" | "offline" | "busy" | "away" | "typing"
  /* Progress */
  | "pending" | "processing" | "waiting" | "submitted" | "draft"
  /* Outcomes */
  | "completed" | "approved" | "rejected" | "cancelled"
  /* Payments */
  | "paid" | "failed" | "refunded"
  /* Messages */
  | "read" | "delivered";

type Tone = { label: string; color: string; tint: string; line: string; /** Label colour, when the indicator's own is too light to read. */ text?: string };

/* Five tones, reused. Text-weight colours for the label and border, the
   softened variants for the indicator, all from ds.css. */
const GREEN: Omit<Tone, "label"> = { color: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)" };
const AMBER: Omit<Tone, "label"> = { color: "var(--amber)", tint: "var(--amber-tint)", line: "var(--amber-line)" };
const RED: Omit<Tone, "label"> = { color: "var(--red)", tint: "var(--red-tint)", line: "var(--red-line)" };
const INDIGO: Omit<Tone, "label"> = { color: "var(--indigo-text)", tint: "var(--indigo-tint)", line: "var(--indigo-line)" };
/* The grey dot is legible as a dot at 3:1, but grey TEXT on white is only
   3.04:1 — below the 4.5:1 AA floor. So the label takes ink-soft (5.42:1) while
   the indicator keeps the grey. Affects offline, draft, cancelled, delivered
   and neutral, which are exactly the states a reader sees most often. */
const GREY: Omit<Tone, "label"> = { color: "var(--grey)", tint: "var(--grey-tint)", line: "var(--grey-line)", text: "var(--ink-soft)" };

const STATE: Record<StatusState, Tone> = {
  success:    { label: "Success", ...GREEN },
  error:      { label: "Error", ...RED },
  warning:    { label: "Warning", ...AMBER },
  info:       { label: "Info", ...INDIGO },
  neutral:    { label: "Neutral", ...GREY },

  online:     { label: "Online", ...GREEN },
  offline:    { label: "Offline", ...GREY },
  busy:       { label: "Busy", ...RED },
  away:       { label: "Away", ...AMBER },
  typing:     { label: "Typing…", ...INDIGO },

  pending:    { label: "Pending", ...AMBER },
  processing: { label: "Processing", ...INDIGO },
  waiting:    { label: "Waiting", ...AMBER },
  submitted:  { label: "Submitted", ...INDIGO },
  draft:      { label: "Draft", ...GREY },

  completed:  { label: "Completed", ...GREEN },
  approved:   { label: "Approved", ...GREEN },
  rejected:   { label: "Rejected", ...RED },
  cancelled:  { label: "Cancelled", ...GREY },

  paid:       { label: "Paid", ...GREEN },
  failed:     { label: "Failed", ...RED },
  refunded:   { label: "Refunded", ...INDIGO },

  read:       { label: "Read", ...GREEN },
  delivered:  { label: "Delivered", ...GREY },
};

/* States that are live by nature animate by default. A ping ring says someone
   is there right now; a pulse says something is still happening. */
const LIVE: Partial<Record<StatusState, "pulse" | "ping">> = {
  online: "ping",
  typing: "ping",
  processing: "pulse",
  pending: "pulse",
  waiting: "pulse",
  submitted: "pulse",
};

export type StatusProps = {
  state: StatusState;
  /** Overrides the state's own word, e.g. "Waiting review" for `waiting`. */
  label?: string;
  /**
   * outline  bordered, transparent — the default, matching the reference
   * soft     tinted fill, for a status sitting on a plain surface
   * plain    no pill at all, for dense rows and table cells
   */
  variant?: "outline" | "soft" | "plain";
  /** `md` matches the reference proportions; `sm` and `xs` are for dense rows. */
  size?: "xs" | "sm" | "md";
  /** Indicator only. The label still reaches assistive technology. */
  dotOnly?: boolean;
  pulse?: boolean;
  ping?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Status({
  state, label, variant = "outline", size = "sm", dotOnly, pulse, ping,
  className = "", style,
}: StatusProps) {
  const s = STATE[state] ?? STATE.neutral;
  const text = label ?? s.label;
  // An explicit prop always wins; otherwise the state's own nature decides.
  const wantsPing = ping ?? LIVE[state] === "ping";
  const wantsPulse = pulse ?? LIVE[state] === "pulse";
  const animate = wantsPing ? " ping" : wantsPulse ? " pulse" : "";

  const indicator = (
    <span
      className={`ds-status-dot${animate}`}
      // The ring reads its colour from the dot, so one value drives both.
      style={{ background: s.color, "--ds-status": s.color } as CSSProperties}
      aria-hidden
    />
  );

  if (dotOnly) {
    return (
      <span className={`ds-status dot-only ${className}`.trim()} style={style} role="img" aria-label={text}>
        {indicator}
      </span>
    );
  }

  return (
    <span
      className={`ds-status ${variant} ${size} ${className}`.trim()}
      style={{
        // The label never inherits a colour it cannot be read in.
        color: s.text ?? s.color,
        ...(variant === "outline" ? { borderColor: s.line } : null),
        ...(variant === "soft" ? { background: s.tint, borderColor: "transparent" } : null),
        ...style,
      }}
    >
      {indicator}
      <span className="ds-status-label">{text}</span>
    </span>
  );
}
