"use client";

import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { Input } from "./Controls";

/* Labelled text field. Thin wrapper over the platform Input, so every older call
   site (signup, onboarding, program search) inherits the unified control
   styling, the leading icon and the reserved error line automatically. */
export function Field({
  label, hint, icon, error, trailing, containerStyle, ...rest
}: {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  error?: string;
  trailing?: ReactNode;
  containerStyle?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement>) {
  return <Input label={label} hint={hint} icon={icon} error={error} trailing={trailing} containerStyle={containerStyle} {...rest} />;
}
