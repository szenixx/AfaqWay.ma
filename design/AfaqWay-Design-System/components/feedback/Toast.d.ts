import type { ReactNode } from "react";

export type ToastType = "success" | "info" | "warning" | "error" | "loading";

export interface ToastOptions {
  type?: ToastType;
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  /** ms before auto-dismiss; 0 disables. Default 4500. */
  duration?: number;
}

/** Fire a toast from anywhere. Returns the toast id (pass to dismissToast). */
export function toast(options: ToastOptions): number;
export function dismissToast(id: number): void;

/**
 * Mount once (root layout) to render the toast stack bottom-right. Fire with
 * `toast({ type, title, description })` from anywhere — no provider needed.
 *
 * @startingPoint section="Feedback" subtitle="Push notification stack — call toast() from anywhere" viewport="420x160"
 */
export function Toaster(): JSX.Element;
