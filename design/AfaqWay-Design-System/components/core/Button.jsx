import React, { useState } from "react";

/* AfaqWay Button — the one button (with JrButton, the only two on the platform).
   variant: primary · ghost · neutral · destructive. Radius is a full capsule.
   Ported from the codebase Button.tsx; the loading spinner is <Loader>. */

const FILLS = {
  primary: { bg: "var(--indigo-600)", hover: "var(--indigo-500)", press: "var(--indigo-700)", color: "#FFFFFF", border: "none" },
  ghost: { bg: "transparent", hover: "var(--indigo-100)", press: "var(--indigo-100)", color: "var(--indigo-600)", border: "1.5px solid var(--indigo-600)" },
  neutral: { bg: "var(--subtle)", hover: "#EBEEF4", press: "#E3E8F0", color: "var(--ink-soft)", border: "1px solid var(--line)" },
  destructive: { bg: "var(--red)", hover: "#C04834", press: "#9E3322", color: "#FFFFFF", border: "none" },
  /* Mantine-style "light" — tinted fill in the caller's own colour; press deepens the tint. */
  light: { bg: "color-mix(in srgb, var(--btn-color, var(--indigo-600)) 14%, transparent)", hover: "color-mix(in srgb, var(--btn-color, var(--indigo-600)) 20%, transparent)", press: "color-mix(in srgb, var(--btn-color, var(--indigo-600)) 30%, transparent)", color: "var(--btn-color, var(--indigo-600))", border: "none" },
};

function Spinner({ size, onDark }) {
  return (
    <span className={`af-loader${onDark ? " on-dark" : ""}`} style={{ width: size, height: size }} role="status" aria-label="Loading">
      <svg viewBox="0 0 800 800" aria-hidden>
        <circle className="af-loader-arc" cx="400" cy="400" r="200" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="50" />
      </svg>
    </span>
  );
}

export function Button({
  variant = "primary", size = "md", icon, disabled, loading, fullWidth,
  type = "button", children, onClick, color, style,
}) {
  const [st, setSt] = useState(0); // 0 rest · 1 hover · 2 press
  const v = FILLS[variant] ?? FILLS.primary;
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => setSt(1)}
      onMouseLeave={() => setSt(0)}
      onMouseDown={() => setSt(2)}
      onMouseUp={() => setSt(1)}
      style={{
        "--btn-color": color,
        font: `600 ${size === "lg" ? "15px" : "14px"}/20px var(--font-sans)`,
        height: size === "lg" ? 44 : 40,
        padding: "0 20px",
        borderRadius: variant === "light" ? "var(--radius-xl)" : "var(--radius-control)",
        background: st === 2 ? v.press : st === 1 ? v.hover : v.bg,
        color: v.color,
        border: v.border,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        transition: "background 120ms cubic-bezier(.4,0,.2,1), transform 120ms cubic-bezier(.4,0,.2,1)",
        transform: st === 2 && !isDisabled ? "scale(.97)" : "none",
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
    >
      {loading ? <Spinner size={16} onDark={variant === "primary" || variant === "destructive"} /> : icon}
      {children}
    </button>
  );
}
