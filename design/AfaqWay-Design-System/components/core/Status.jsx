import React from "react";

/* AfaqWay Status — the one status vocabulary. 24 states → five tones. The word
   always renders (colour is never the only carrier). Ported from Status.tsx. */

const GREEN = { color: "var(--green)", tint: "var(--green-tint)", line: "var(--green-line)" };
const AMBER = { color: "var(--amber)", tint: "var(--amber-tint)", line: "var(--amber-line)" };
const RED = { color: "var(--red)", tint: "var(--red-tint)", line: "var(--red-line)" };
const INDIGO = { color: "var(--indigo-text)", tint: "var(--indigo-tint)", line: "var(--indigo-line)" };
const GREY = { color: "var(--grey)", tint: "var(--grey-tint)", line: "var(--grey-line)", text: "var(--ink-soft)" };

const STATE = {
  success: { label: "Success", ...GREEN }, error: { label: "Error", ...RED },
  warning: { label: "Warning", ...AMBER }, info: { label: "Info", ...INDIGO },
  neutral: { label: "Neutral", ...GREY },
  online: { label: "Online", ...GREEN }, offline: { label: "Offline", ...GREY },
  busy: { label: "Busy", ...RED }, away: { label: "Away", ...AMBER }, typing: { label: "Typing…", ...INDIGO },
  pending: { label: "Pending", ...AMBER }, processing: { label: "Processing", ...INDIGO },
  waiting: { label: "Waiting", ...AMBER }, submitted: { label: "Submitted", ...INDIGO }, draft: { label: "Draft", ...GREY },
  completed: { label: "Completed", ...GREEN }, approved: { label: "Approved", ...GREEN },
  rejected: { label: "Rejected", ...RED }, cancelled: { label: "Cancelled", ...GREY },
  paid: { label: "Paid", ...GREEN }, failed: { label: "Failed", ...RED }, refunded: { label: "Refunded", ...INDIGO },
  read: { label: "Read", ...GREEN }, delivered: { label: "Delivered", ...GREY },
};

const LIVE = { online: "ping", typing: "ping", processing: "pulse", pending: "pulse", waiting: "pulse", submitted: "pulse" };

export function Status({ state, label, variant = "outline", size = "sm", dotOnly, pulse, ping, className = "", style }) {
  const s = STATE[state] ?? STATE.neutral;
  const text = label ?? s.label;
  const wantsPing = ping ?? LIVE[state] === "ping";
  const wantsPulse = pulse ?? LIVE[state] === "pulse";
  const animate = wantsPing ? " ping" : wantsPulse ? " pulse" : "";
  const indicator = (
    <span className={`ds-status-dot${animate}`} style={{ background: s.color, "--ds-status": s.color }} aria-hidden />
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
