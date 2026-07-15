import React from 'react';
const SIZES = { lg: { w: 42, h: 30, r: 5 }, md: { w: 24, h: 18, r: 3 }, sm: { w: 16, h: 12, r: 2 } };
export function Flag({ src, stripes, emoji, size = 'md', unavailable, selected, style }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span style={{
      width: s.w, height: s.h, borderRadius: s.r, overflow: 'hidden', display: 'inline-flex', flexDirection: 'column', flex: 'none',
      border: selected ? '1.5px solid var(--indigo-600)' : '1px solid rgba(0,0,0,.08)',
      filter: unavailable ? 'grayscale(.55)' : 'none', opacity: unavailable ? 0.72 : 1,
      alignItems: 'center', justifyContent: 'center', fontSize: s.h * 0.8, lineHeight: 1, background: '#fff', ...style,
    }}>
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : stripes ? stripes.map((c, i) => <i key={i} style={{ flex: 1, alignSelf: 'stretch', background: c }} />)
        : emoji}
    </span>
  );
}