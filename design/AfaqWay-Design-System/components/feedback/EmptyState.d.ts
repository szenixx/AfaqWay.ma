import type { ReactNode } from "react";

/**
 * The one empty-state pattern: swappable icon + title + description + actions.
 * Use for "no documents", "no results", "no messages" — never invent data,
 * pair with real copy about what's missing.
 *
 * @startingPoint section="Feedback" subtitle="Icon + title + description + actions" viewport="500x260"
 */
export interface EmptyStateProps {
  /** Any icon node — swap per call site (search, documents, inbox…). */
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  size?: "default" | "sm";
  children?: ReactNode;
}
export function EmptyState(props: EmptyStateProps): JSX.Element;
export namespace EmptyState {
  export function Actions(props: { children?: ReactNode }): JSX.Element;
}
