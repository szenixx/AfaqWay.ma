import React, { useState } from 'react';
const FILLS = {
  primary: { bg: 'var(--indigo-600)', hover: 'var(--indigo-500)', press: 'var(--indigo-700)', color: '#FFFFFF', border: 'none' },
  ghost: { bg: 'transparent', hover: 'var(--indigo-100)', press: 'var(--indigo-100)', color: 'var(--indigo-600)', border: '1.5px solid var(--indigo-600)' },
  neutral: { bg: 'var(--subtle)', hover: '#EBEEF4', press: '#E3E8F0', color: 'var(--ink-soft)', border: '1px solid var(--line)' },
  destructive: { bg: 'var(--red)', hover: '#C04834', press: '#9E3322', color: '#FFFFFF', border: 'none' },
};
export function Button({ variant = 'primary', size = 'md', icon, disabled, children, onClick, style }) {
  const [st, setSt] = useState(0); // 0 rest, 1 hover, 2 press
  const v = FILLS[variant] || FILLS.primary;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setSt(1)} onMouseLeave={() => setSt(0)}
      onMouseDown={() => setSt(2)} onMouseUp={() => setSt(1)}
      style={{
        font: '600 ' + (size === 'lg' ? '15px' : '14px') + '/20px var(--font-sans)',
        height: size === 'lg' ? 44 : 40, padding: '0 20px', borderRadius: 'var(--radius-md)',
        background: st === 2 ? v.press : st === 1 ? v.hover : v.bg, color: v.color, border: v.border,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'background 120ms cubic-bezier(.4,0,.2,1)', ...style,
      }}>
      {icon}{children}
    </button>
  );
}