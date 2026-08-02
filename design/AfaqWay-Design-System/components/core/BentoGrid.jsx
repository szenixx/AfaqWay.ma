import React from "react";

/* AfaqWay BentoGrid/BentoCard — an asymmetric grid of white cards (icon tile in
   indigo tint, title, description) for dashboard highlight rows. colSpan/
   rowSpan let one card stretch across the grid. */

export function BentoGrid({ children, className = "", style }) {
  return <div className={`bento-grid ${className}`.trim()} style={style}>{children}</div>;
}

export function BentoCard({ icon, title, description, colSpan = 1, rowSpan = 1, style }) {
  return (
    <div className="bento-card" style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, ...style }}>
      {icon}
      <div className="bento-card-title">{title}</div>
      {description && <div className="bento-card-desc">{description}</div>}
    </div>
  );
}
