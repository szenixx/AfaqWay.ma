import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

/* Ported from design/AfaqWay-Design-System/components/forms/Field.jsx (label-over-value,
   input.af styling from ds.css), extended with an optional `trailing` slot for the
   password visibility toggle. */
export function Field({
  label,
  hint,
  trailing,
  containerStyle,
  ...rest
}: {
  label?: string;
  hint?: string;
  trailing?: ReactNode;
  containerStyle?: CSSProperties;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...containerStyle }}>
      {label ? <span style={{ font: "500 13px/20px var(--font-sans)", color: "var(--ink)" }}>{label}</span> : null}
      <div style={{ position: "relative", display: "flex" }}>
        <input className="af" style={{ width: "100%", paddingRight: trailing ? 42 : undefined }} {...rest} />
        {trailing ? (
          <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex" }}>{trailing}</span>
        ) : null}
      </div>
      {hint ? <span style={{ font: "400 12px/17px var(--font-sans)", color: "var(--ink-faint)" }}>{hint}</span> : null}
    </label>
  );
}
