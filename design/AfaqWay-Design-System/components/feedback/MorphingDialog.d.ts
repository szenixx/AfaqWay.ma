import type { CSSProperties, ReactNode } from "react";

/**
 * A card that expands in place into a full dialog (the trigger's own on-screen
 * rect is the animation's start point). Use on dashboard cards — university,
 * program, document, activity — that open into a detail view.
 *
 * @startingPoint section="Feedback" subtitle="Card that morphs into a dialog on click" viewport="300x160"
 */
export interface MorphingDialogProps { children?: ReactNode }
export function MorphingDialog(props: MorphingDialogProps): JSX.Element;

export interface MorphingDialogTriggerProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}
export function MorphingDialogTrigger(props: MorphingDialogTriggerProps): JSX.Element;

export interface MorphingDialogContentProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
export function MorphingDialogContent(props: MorphingDialogContentProps): JSX.Element | null;

export interface MorphingDialogCloseProps { children?: ReactNode }
export function MorphingDialogClose(props: MorphingDialogCloseProps): JSX.Element;
