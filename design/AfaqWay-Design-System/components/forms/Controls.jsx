import React, { useState, useRef, useEffect } from "react";

/* AfaqWay Controls — one input, textarea, dropdown, toggle and checkbox for the
   whole platform. Every field carries a leading icon; the error slot is always
   reserved so validation never shifts the layout. Ported from Controls.tsx. */

const IChevron = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>);
const ICheck = ({ s = 15 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>);
const IX = ({ s = 13 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>);

export function Input({ icon, label, error, hint, trailing, containerStyle, className, id, ...rest }) {
  return (
    <div style={containerStyle}>
      {label && <label className="af-label" htmlFor={id}>{label}</label>}
      <div className={`af-field${icon ? " has-icon" : ""}${trailing ? " has-trailing" : ""}`}>
        {icon && <span className="af-field-ico">{icon}</span>}
        <input id={id} className={`af${className ? " " + className : ""}`} aria-invalid={error ? "true" : undefined} {...rest} />
        {trailing && <span className="af-field-trail">{trailing}</span>}
      </div>
      {(error || hint) && <span className="af-error" style={!error && hint ? { color: "var(--ink-faint)" } : undefined}>{error || hint}</span>}
    </div>
  );
}

export function TextArea({ icon, label, error, hint, rows = 4, containerStyle, className, id, ...rest }) {
  return (
    <div style={containerStyle}>
      {label && <label className="af-label" htmlFor={id}>{label}</label>}
      <div className={`af-field${icon ? " has-icon" : ""}`} style={{ alignItems: "flex-start" }}>
        {icon && <span className="af-field-ico is-textarea">{icon}</span>}
        <textarea id={id} rows={rows} className={`af${className ? " " + className : ""}`} aria-invalid={error ? "true" : undefined} {...rest} />
      </div>
      {(error || hint) && <span className="af-error" style={!error && hint ? { color: "var(--ink-faint)" } : undefined}>{error || hint}</span>}
    </div>
  );
}

export function Select({ options = [], value, onChange, placeholder = "Select…", icon, label, disabled, error, id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [open]);
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = opts.find((o) => o.value === value);
  return (
    <div style={{ width: "100%" }}>
      {label && <label className="af-label" htmlFor={id}>{label}</label>}
      <div className={`af-select${open ? " open" : ""}`} ref={ref}>
        <button type="button" id={id} className="af-select-btn" disabled={disabled} data-invalid={error ? "true" : undefined}
          aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {icon && <span className="af-select-ico">{icon}</span>}
          <span className={`af-select-val${selected ? "" : " placeholder"}`}>{selected ? selected.label : placeholder}</span>
          <span className="af-select-chev"><IChevron /></span>
        </button>
        {open && (
          <div className="af-menu" role="listbox">
            {opts.map((o) => (
              <button key={o.value} type="button" role="option" aria-selected={o.value === value}
                className={`af-opt${o.value === value ? " selected" : ""}`}
                onClick={() => { onChange && onChange(o.value); setOpen(false); }}>
                {o.label}
                {o.value === value && <span className="af-opt-check"><ICheck s={14} /></span>}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <span className="af-error">{error}</span>}
    </div>
  );
}

export function Toggle({ checked, onChange, disabled, label, description, size = "default", id }) {
  const btn = (
    <button type="button" id={id} className={`af-toggle${size === "sm" ? " sm" : ""}`} role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange && onChange(!checked)}>
      <span className="af-toggle-ico off"><IX s={size === "sm" ? 9 : 13} /></span>
      <span className="af-toggle-thumb" />
    </button>
  );
  if (!label) return btn;
  const row = <label className="af-toggle-row" style={{ cursor: disabled ? "not-allowed" : "pointer" }}>{btn}{label}</label>;
  if (!description) return row;
  return (
    <div>
      {row}
      <span style={{ display: "block", font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", marginTop: 4, marginLeft: 62 }}>{description}</span>
    </div>
  );
}

export const Controls = { Input, TextArea, Select, Toggle, Checkbox };

export function Checkbox({ checked, onChange, disabled, invalid, label, description, error, id }) {
  const box = (
    <button type="button" id={id} className="af-check" role="checkbox" aria-checked={checked} disabled={disabled}
      data-invalid={invalid || error ? "true" : undefined} onClick={() => onChange && onChange(!checked)}>
      {checked && <ICheck s={11} />}
    </button>
  );
  if (!label) return box;
  return (
    <div>
      <label className="af-check-row">
        {box}
        <span>
          <span style={{ display: "block" }}>{label}</span>
          {description && <span style={{ display: "block", font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{description}</span>}
        </span>
      </label>
      {error && <span className="af-error" style={{ marginLeft: 30 }}>{error}</span>}
    </div>
  );
}
