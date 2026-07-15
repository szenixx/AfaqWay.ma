import React from 'react';
import { STATUS } from './StatusBadge.jsx';
export function StatusPill({ status = 'not-started', children }) {
  const s = STATUS[status] || STATUS['not-started'];
  return (
    <span style={{ font: '600 10.5px/1 var(--font-sans)', letterSpacing: '.05em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 999, border: '1px solid ' + s.line, color: s.text, background: s.tint, display: 'inline-flex', alignItems: 'center' }}>
      {children || s.label}
    </span>
  );
}