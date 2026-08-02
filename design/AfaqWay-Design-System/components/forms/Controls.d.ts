import type { CSSProperties, ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * The platform's single control set. One input, one textarea, one dropdown, one
 * toggle, one checkbox — a second variant of any is a bug. Every field carries a
 * leading icon; the error slot is reserved so validation never reflows the form.
 *
 * @startingPoint section="Forms" subtitle="Input / Select / Toggle / Checkbox" viewport="700x360"
 */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Leading icon (17px indigo glyph). */
  icon?: ReactNode;
  label?: string;
  /** Sets aria-invalid and shows the message in red. */
  error?: string;
  /** Helper text in the (always-reserved) message slot. */
  hint?: string;
  /** Trailing node, e.g. a password reveal. */
  trailing?: ReactNode;
  containerStyle?: CSSProperties;
}
export function Input(props: InputProps): JSX.Element;

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: ReactNode;
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: CSSProperties;
}
export function TextArea(props: TextAreaProps): JSX.Element;

export type SelectOption = string | { value: string; label: string };
export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  label?: string;
  disabled?: boolean;
  error?: string;
  id?: string;
}
export function Select(props: SelectProps): JSX.Element;

export interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: ReactNode;
  /** Optional supporting line under the row, indented past the track. */
  description?: string;
  /** "default" (52×30, icon inside thumb track) or "sm" (36×20, no icon — for dense rows). */
  size?: "default" | "sm";
  id?: string;
}
export function Toggle(props: ToggleProps): JSX.Element;

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  invalid?: boolean;
  label?: ReactNode;
  /** Optional supporting line under the label. */
  description?: string;
  /** Validation message under the row; also marks the box invalid. */
  error?: string;
  id?: string;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
