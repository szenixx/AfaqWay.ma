import type { CSSProperties, ReactNode } from "react";

export interface FloatingToolbarAction {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

/**
 * A floating group of icon actions (rich-text formatting, selection toolbars).
 * Equal spacing, minimal separators, one active state per action.
 *
 * @startingPoint section="Navigation" subtitle="Floating icon-action group — text formatting, selection" viewport="360x64"
 */
export interface FloatingToolbarProps {
  open?: boolean;
  actions: FloatingToolbarAction[];
  style?: CSSProperties;
}
export function FloatingToolbar(props: FloatingToolbarProps): JSX.Element | null;
