import React from 'react';
export function Card({ eyebrow, title, children, padding = 24, style }) {
  return (
    <section style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', padding, ...style }}>
      {eyebrow ? <div style={{ font: '600 10.5px/14px var(--font-sans)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>{eyebrow}</div> : null}
      {title ? <h3 style={{ font: '600 18px/24px var(--font-sans)', color: 'var(--ink)', margin: '0 0 12px' }}>{title}</h3> : null}
      {children}
    </section>
  );
}
export function Divider({ margin = 16 }) {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: margin + 'px 0' }} />;
}