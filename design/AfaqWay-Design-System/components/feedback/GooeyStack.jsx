import React, { Children } from "react";

/* AfaqWay GooeyStack — a collapsible notification stack: collapsed shows
   peeking card edges (gooey/melded look via overlap + scale falloff);
   expanded spreads items with `expandedGap`. Used atop the notification tray. */

export function GooeyStack({ children, collapsed = true, expandedGap = 18, radius = 22, style }) {
  const items = Children.toArray(children);
  return (
    <div className="gstack" style={{ "--gstack-radius": `${radius}px`, ...style }}>
      {items.map((child, i) => {
        const back = items.length - 1 - i;
        const collapsedStyle = { transform: `translateY(${back * 8}px) scale(${1 - back * 0.035})`, zIndex: items.length - i, opacity: back > 2 ? 0 : 1 };
        const expandedStyle = { transform: "none", marginBottom: i === items.length - 1 ? 0 : expandedGap, zIndex: items.length - i, opacity: 1 };
        return (
          <div key={child.key ?? i} className="gstack-item" style={collapsed ? collapsedStyle : expandedStyle}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
