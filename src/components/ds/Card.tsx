import type { CSSProperties, ReactNode } from "react";

/* Ported from design/AfaqWay-Design-System/components/surfaces/Card.jsx. */
export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="card" style={style}>
      {children}
    </div>
  );
}
