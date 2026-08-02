import type { ReactNode } from "react";

/**
 * The general-purpose modal — settings panels, forms, previews. Same overlay
 * shell as <AlertDialog>, plus a corner close (X) and a bordered, tinted
 * footer bar. Use <AlertDialog> instead for confirmations/destructive actions.
 *
 * @startingPoint section="Feedback" subtitle="General modal — header, footer, corner close" viewport="700x320"
 */
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shows the top-right X close button. Default true. */
  showCloseButton?: boolean;
  size?: "default" | "sm";
  children?: ReactNode;
}
export function Dialog(props: DialogProps): JSX.Element | null;

export interface DialogSlotProps { children?: ReactNode }
export function DialogHeader(props: DialogSlotProps): JSX.Element;
export function DialogTitle(props: DialogSlotProps): JSX.Element;
export function DialogDescription(props: DialogSlotProps): JSX.Element;
export function DialogFooter(props: DialogSlotProps): JSX.Element;

export interface DialogCloseProps {
  children?: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "neutral" | "destructive";
}
/** Always closes the dialog on click, in addition to firing onClick. */
export function DialogClose(props: DialogCloseProps): JSX.Element;
