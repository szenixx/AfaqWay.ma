import React from "react";

/* AfaqWay Card — the generic 28px floating surface. Hierarchy comes from
   elevation and whitespace, not borders. Hover lifts 3px. */

export function Card({ children, hover = true, style, className = "", onClick }) {
  const base = {
    background: "var(--card)",
    border: "var(--card-border)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--elev-2)",
    padding: 24,
    ...style,
  };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`card ${className}`.trim()} style={{ ...base, textAlign: "left", cursor: "pointer", font: "inherit", display: "block", width: "100%" }}>
        {children}
      </button>
    );
  }
  return <div className={`${hover ? "card" : ""} ${className}`.trim()} style={base}>{children}</div>;
}

export default Card;
