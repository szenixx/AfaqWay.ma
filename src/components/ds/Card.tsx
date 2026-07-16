import type { CSSProperties, ReactNode } from "react";

/* Ported from design/AfaqWay-Design-System/components/surfaces/Card.jsx. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-card)", padding: 24, ...style }}>
      {children}
    </div>
  );
}
