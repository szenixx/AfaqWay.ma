import React, { useState } from 'react';
import { Icon } from '../icons/Icon.jsx';
import { Flag } from '../flags/Flag.jsx';
function IconBtn({ name, dot, label }) {
  const [h, setH] = useState(false);
  return (
    <button aria-label={label} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ position: 'relative', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: h ? 'var(--indigo-100)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: h ? 'var(--ink)' : 'var(--ink-soft)', transition: 'background 120ms cubic-bezier(.4,0,.2,1)' }}>
      <Icon name={name} size={20} />
      {dot ? <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: '50%', background: 'var(--indigo-600)' }} /> : null}
    </button>
  );
}
function MenuRow({ icon, children, danger, right }) {
  const [h, setH] = useState(false);
  return (
    <button onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 36, padding: '0 12px', borderRadius: 8, border: 'none', cursor: 'pointer', background: h ? 'var(--indigo-100)' : 'transparent', font: '500 13px/20px var(--font-sans)', color: danger ? 'var(--red)' : h ? 'var(--ink)' : 'var(--ink-soft)', transition: 'background 120ms cubic-bezier(.4,0,.2,1)' }}>
      {icon ? <Icon name={icon} size={16} color={danger ? 'var(--red)' : undefined} /> : null}
      <span style={{ flex: 1, textAlign: 'left' }}>{children}</span>{right}
    </button>
  );
}
export function TopBar({ name = 'Student name', role = 'Student', avatar, unreadBell = true, unreadMail = false, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <header style={{ position: 'relative', height: 60, background: 'var(--card)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px', fontFamily: 'var(--font-sans)' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 96 96" aria-hidden="true"><rect width="96" height="96" rx="24" fill="var(--indigo-600)" /><g fill="none" stroke="#FFFFFF" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter"><path d="M29 28 48 45 67 28" /><path d="M29 54 48 71 67 54" /></g></svg>
        <span style={{ font: '700 17px/24px var(--font-sans)', color: 'var(--ink)', letterSpacing: '-0.01em' }}>AfaqWay</span>
      </span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 360, height: 38, background: 'var(--subtle)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', color: 'var(--ink-faint)' }}>
          <Icon name="search" size={16} />
          <span style={{ font: '400 13px/20px var(--font-sans)' }}>Search</span>
        </div>
      </div>
      <IconBtn name="bell" dot={unreadBell} label="Notifications" />
      <IconBtn name="email" dot={unreadMail} label="Messages" />
      <span style={{ width: 1, height: 24, background: 'var(--line)', margin: '0 12px' }} />
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 10 }}>
        <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--indigo-100)', color: 'var(--indigo-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 13px/1 var(--font-sans)', boxShadow: '0 0 0 2px var(--card)', overflow: 'hidden' }}>
          {avatar ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.split(' ').map(w => w[0]).slice(0, 2).join('')}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ font: '600 13px/16px var(--font-sans)', color: 'var(--ink)' }}>{name}</span>
          <span style={{ font: '500 11px/14px var(--font-sans)', color: 'var(--ink-soft)' }}>{role}</span>
        </span>
        <Icon name="chevron-down" size={12} color="var(--ink-faint)" />
      </button>
      {open ? (
        <div style={{ position: 'absolute', top: 60, right: 20, marginTop: 6, minWidth: 200, background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, boxShadow: 'var(--shadow-card)', padding: 6, zIndex: 20 }}>
          <MenuRow icon="passport">My profile</MenuRow>
          <MenuRow icon="settings">Settings</MenuRow>
          <MenuRow right={<Flag size="sm" emoji="🇬🇧" />}>Language</MenuRow>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', margin: '6px 0' }} />
          <MenuRow icon="logout" danger>Log out</MenuRow>
        </div>
      ) : null}
    </header>
  );
}