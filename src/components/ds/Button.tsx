"use client";

import { type CSSProperties, type ReactNode, useState } from "react";

/* Ported from design/AfaqWay-Design-System/components/buttons/Button.jsx,
   with TS types + loading + fullWidth + type props for form use. */
type Variant = "primary" | "ghost" | "neutral" | "destructive";

const FILLS: Record<Variant, { bg: string; hover: string; press: string; color: string; border: string }> = {
  primary: { bg: "var(--indigo-600)", hover: "var(--indigo-500)", press: "var(--indigo-700)", color: "#FFFFFF", border: "none" },
  ghost: { bg: "transparent", hover: "var(--indigo-100)", press: "var(--indigo-100)", color: "var(--indigo-600)", border: "1.5px solid var(--indigo-600)" },
  neutral: { bg: "var(--subtle)", hover: "#EBEEF4", press: "#E3E8F0", color: "var(--ink-soft)", border: "1px solid var(--line)" },
  destructive: { bg: "var(--red)", hover: "#C04834", press: "#9E3322", color: "#FFFFFF", border: "none" },
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  disabled,
  loading,
  fullWidth,
  type = "button",
  children,
  onClick,
  style,
}: {
  variant?: Variant;
  size?: "md" | "lg";
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  type?: "button" | "submit";
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
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
        font: `600 ${size === "lg" ? "15px" : "14px"}/20px var(--font-sans)`,
        height: size === "lg" ? 44 : 40,
        padding: "0 20px",
        borderRadius: "var(--radius-md)",
        background: st === 2 ? v.press : st === 1 ? v.hover : v.bg,
        color: v.color,
        border: v.border,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        transition: "background 120ms cubic-bezier(.4,0,.2,1)",
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
    >
      {loading ? (
        <span style={{ width: 16, height: 16, borderRadius: 999, border: "2px solid currentColor", borderTopColor: "transparent", animation: "afSpin .7s linear infinite", display: "inline-block", flex: "none" }} />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
