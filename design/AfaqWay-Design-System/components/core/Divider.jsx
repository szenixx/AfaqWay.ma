import React from "react";

/* AfaqWay Divider — a hairline separator with an optional centred label. */

export function Divider({ label, style }) {
  if (!label) {
    return <hr style={{ border: "none", borderTop: "1px solid var(--line-soft)", margin: 0, ...style }} />;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, ...style }}>
      <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
      <span style={{ font: "600 11px/14px var(--font-sans)", letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-faint)", flex: "none" }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: "var(--line-soft)" }} />
    </div>
  );
}

export default Divider;
