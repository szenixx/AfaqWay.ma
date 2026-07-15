import React from 'react';
export function Field({ label, optional, hint, as = 'input', children, style, ...rest }) {
  const Tag = as;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label ? (
        <span style={{ font: '500 13px/20px var(--font-sans)', color: 'var(--ink)' }}>
          {label}{optional ? <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}> ({optional})</span> : null}
        </span>
      ) : null}
      <Tag className="af" {...rest}>{as === 'select' || as === 'textarea' ? children : undefined}</Tag>
      {hint ? <span style={{ font: '400 12px/17px var(--font-sans)', color: 'var(--ink-faint)' }}>{hint}</span> : null}
    </label>
  );
}