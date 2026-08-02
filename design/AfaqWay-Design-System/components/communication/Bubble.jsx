import React from "react";

/* AfaqWay Bubble — the chat message bubble family (advisor ↔ student chat).
   BubbleGroup stacks a sender's consecutive messages; Bubble picks the tone;
   BubbleContent is the actual rounded-3xl fill; BubbleReactions is the small
   pill that overlaps the bubble's corner. Adapted from a shadcn-style Bubble
   primitive onto our own tokens (no Tailwind/cva at runtime). */

const VARIANT = {
  default:     { background: "var(--indigo-600)", color: "#fff", border: "1px solid transparent" },
  secondary:   { background: "var(--subtle)", color: "var(--ink)", border: "1px solid transparent" },
  muted:       { background: "var(--grey-tint)", color: "var(--ink)", border: "1px solid transparent" },
  tinted:      { background: "var(--indigo-tint)", color: "var(--ink)", border: "1px solid transparent" },
  outline:     { background: "var(--card)", color: "var(--ink)", border: "1px solid var(--line)" },
  ghost:       { background: "transparent", color: "var(--ink)", border: "none" },
  destructive: { background: "var(--red-tint)", color: "var(--red)", border: "1px solid transparent" },
};

export function BubbleGroup({ children, style }) {
  return <div className="bubble-group" style={style}>{children}</div>;
}

export function Bubble({ variant = "default", align = "start", children, style }) {
  return (
    <div className="bubble" data-align={align} data-variant={variant} style={{ alignSelf: align === "end" ? "flex-end" : "flex-start", ...style }}>
      {children}
    </div>
  );
}

export function BubbleContent({ variant = "default", children, style }) {
  const v = VARIANT[variant] ?? VARIANT.default;
  const isGhost = variant === "ghost";
  return (
    <div
      className="bubble-content"
      style={{
        background: v.background,
        color: v.color,
        border: v.border,
        padding: isGhost ? 0 : "10px 14px",
        borderRadius: isGhost ? 0 : "var(--radius-dialog)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function BubbleReactions({ side = "bottom", align = "end", children, style }) {
  return (
    <div
      className="bubble-reactions"
      style={{
        [side === "top" ? "top" : "bottom"]: 0,
        transform: side === "top" ? "translateY(-70%)" : "translateY(70%)",
        [align === "start" ? "left" : "right"]: 12,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
