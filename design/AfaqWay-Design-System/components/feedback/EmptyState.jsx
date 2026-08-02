import React from "react";

/* AfaqWay EmptyState — icon + title + description + actions, for any empty
   frame (no documents, no results, no messages…). Icon is swappable per call
   site; never invent data — pair with real copy about what's missing. */

function Actions({ children }) {
  return <div className="es-actions">{children}</div>;
}

export function EmptyState({ icon, title, description, size = "default", children }) {
  return (
    <div className={`es${size === "sm" ? " sm" : ""}`}>
      {icon && <span className="es-icon">{icon}</span>}
      {title && <div className="es-title">{title}</div>}
      {description && <p className="es-desc">{description}</p>}
      {children}
    </div>
  );
}
EmptyState.Actions = Actions;
