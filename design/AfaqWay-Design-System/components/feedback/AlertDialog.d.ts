import type { ReactNode } from "react";

/**
 * The platform's one dialog shell — confirmations, destructive actions, simple
 * modals. Backdrop blur, fade+zoom in/out, dialog radius (32px), optional
 * leading media icon, title + description, footer built on <Button>.
 *
 * @startingPoint section="Feedback" subtitle="Default dialog shell — media, title, description, footer" viewport="700x300"
 */
export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "default" (max-width 22rem) or "sm" (20rem). */
  size?: "default" | "sm";
  children?: ReactNode;
}
export function AlertDialog(props: AlertDialogProps): JSX.Element | null;

export interface AlertDialogSlotProps { children?: ReactNode }
export function AlertDialogMedia(props: AlertDialogSlotProps): JSX.Element;
export function AlertDialogHeader(props: AlertDialogSlotProps): JSX.Element;
export function AlertDialogTitle(props: AlertDialogSlotProps): JSX.Element;
export function AlertDialogDescription(props: AlertDialogSlotProps): JSX.Element;
export function AlertDialogFooter(props: AlertDialogSlotProps): JSX.Element;

export interface AlertDialogActionProps {
  children?: ReactNode;
  onClick?: () => void;
  /** Default "primary" for Action, "neutral" for Cancel. */
  variant?: "primary" | "ghost" | "neutral" | "destructive";
}
export function AlertDialogAction(props: AlertDialogActionProps): JSX.Element;
/** Always closes the dialog on click, in addition to firing onClick. */
export function AlertDialogCancel(props: AlertDialogActionProps): JSX.Element;
