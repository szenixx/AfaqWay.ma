import React from "react";

/* AfaqWay FloatingToolbar — a floating group of icon actions (rich-text
   formatting, selection toolbars). One active state, equal spacing, minimal
   separators, matching the platform's floating-panel language. */

export function FloatingToolbar({ open = true, actions = [], style }) {
  if (!open) return null;
  return (
    <div className="ftbar" style={style}>
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          className={`ftbar-btn${a.active ? " active" : ""}`}
          aria-label={a.label}
          aria-pressed={a.active}
          title={a.label}
          onClick={a.onClick}
          disabled={a.disabled}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
}
