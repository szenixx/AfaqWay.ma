"use client";

import { useEffect, useRef, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { Check, ChevronDown, X } from "lucide-react";

/* The platform's control set: Input, TextArea, Select, Toggle, Checkbox.
   Every form on every page uses these — there is no second style. Visuals live
   in ds.css (.af, .af-select, .af-toggle, .af-check) so the look is defined once. */

const ICON_SIZE = 17;

/* ── Input ────────────────────────────────────────────────────────────────── */

export type InputProps = {
  /** Leading icon, e.g. `fieldIcon("email")`. Stays visible when the field is filled. */
  icon?: ReactNode;
  label?: string;
  /** Error message rendered under the field; space is reserved so nothing jumps. */
  error?: string;
  hint?: string;
  trailing?: ReactNode;
  containerStyle?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ icon, label, error, hint, trailing, containerStyle, className, ...rest }: InputProps) {
  const field = (
    <span className={`af-field${icon ? " has-icon" : ""}${trailing ? " has-trailing" : ""}`}>
      {icon && <span className="af-field-ico">{icon}</span>}
      <input className={`af${className ? " " + className : ""}`} aria-invalid={error ? true : undefined} {...rest} />
      {trailing && <span className="af-field-trail">{trailing}</span>}
    </span>
  );
  if (!label && !error && !hint) return <span style={containerStyle}>{field}</span>;
  return (
    <label style={{ display: "block", ...containerStyle }}>
      {label && <span className="af-label">{label}</span>}
      {field}
      {error ? <span className="af-error">{error}</span> : hint ? <span className="af-error" style={{ color: "var(--ink-faint)" }}>{hint}</span> : null}
    </label>
  );
}

export type TextAreaProps = {
  icon?: ReactNode; label?: string; error?: string; hint?: string; containerStyle?: CSSProperties;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ icon, label, error, hint, containerStyle, className, ...rest }: TextAreaProps) {
  return (
    <label style={{ display: "block", ...containerStyle }}>
      {label && <span className="af-label">{label}</span>}
      <span className={`af-field${icon ? " has-icon" : ""}`}>
        {icon && <span className="af-field-ico is-textarea">{icon}</span>}
        <textarea className={`af${className ? " " + className : ""}`} aria-invalid={error ? true : undefined} {...rest} />
      </span>
      {error ? <span className="af-error">{error}</span> : hint ? <span className="af-error" style={{ color: "var(--ink-faint)" }}>{hint}</span> : null}
    </label>
  );
}

/* ── Select ───────────────────────────────────────────────────────────────── */

export type SelectOption = { value: string; label: string; icon?: ReactNode };

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Leading icon shown on the trigger, empty or filled. */
  icon?: ReactNode;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: CSSProperties;
  style?: CSSProperties;
  ariaLabel?: string;
};

export function Select({ value, onChange, options, icon, placeholder = "Choose…", label, error, disabled, containerStyle, style, ariaLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape — same behaviour for every dropdown.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  return (
    <div style={{ display: "block", ...containerStyle }}>
      {label && <span className="af-label">{label}</span>}
      <div ref={root} className={`af-select${open ? " open" : ""}`} style={style}>
        <button
          type="button" className="af-select-btn" disabled={disabled} aria-haspopup="listbox" aria-expanded={open}
          aria-label={ariaLabel ?? label} data-invalid={error ? "true" : undefined}
          onClick={() => setOpen((v) => !v)}
        >
          {icon && <span className="af-select-ico">{icon}</span>}
          <span className={`af-select-val${selected ? "" : " placeholder"}`}>{selected?.label ?? placeholder}</span>
          <span className="af-select-chev"><ChevronDown size={17} /></span>
        </button>
        {open && (
          <div className="af-menu" role="listbox">
            {options.map((o) => (
              <button
                key={o.value} type="button" role="option" aria-selected={o.value === value}
                className={`af-opt${o.value === value ? " selected" : ""}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.icon}
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.label}</span>
                {o.value === value && <span className="af-opt-check"><Check size={15} /></span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <span className="af-error">{error}</span>}
    </div>
  );
}

/* ── Toggle ───────────────────────────────────────────────────────────────── */

export function Toggle({ checked, onChange, label, disabled, id, ariaLabel }: {
  checked: boolean; onChange: (next: boolean) => void; label?: ReactNode; disabled?: boolean; id?: string; ariaLabel?: string;
}) {
  const control = (
    <button
      type="button" id={id} role="switch" aria-checked={checked} aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      className="af-toggle" disabled={disabled} onClick={() => onChange(!checked)}
    >
      <span className="af-toggle-ico off" aria-hidden><X size={12} strokeWidth={2.6} /></span>
      <span className="af-toggle-ico on" aria-hidden><Check size={12} strokeWidth={2.6} /></span>
      <span className="af-toggle-thumb" aria-hidden />
    </button>
  );
  if (!label) return control;
  return <span className="af-toggle-row">{control}{label}</span>;
}

/* ── Checkbox ─────────────────────────────────────────────────────────────── */

export function Checkbox({ checked, onChange, label, disabled, invalid, ariaLabel }: {
  checked: boolean; onChange: (next: boolean) => void; label?: ReactNode; disabled?: boolean; invalid?: boolean; ariaLabel?: string;
}) {
  const control = (
    <button
      type="button" role="checkbox" aria-checked={checked} data-invalid={invalid ? "true" : undefined}
      aria-label={ariaLabel ?? (typeof label === "string" ? label : undefined)}
      className="af-check" disabled={disabled} onClick={() => onChange(!checked)}
    >
      <Check size={13} strokeWidth={3} />
    </button>
  );
  if (!label) return control;
  return (
    <span className="af-check-row">
      {control}
      <span onClick={() => !disabled && onChange(!checked)} style={{ cursor: disabled ? "not-allowed" : "pointer" }}>{label}</span>
    </span>
  );
}

export { ICON_SIZE as CONTROL_ICON_SIZE };
