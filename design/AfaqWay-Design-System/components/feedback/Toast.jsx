import React, { useState, useEffect } from "react";

/* AfaqWay Toast — the platform's one push notification. A tiny module-level
   store (no context/provider needed) + toast()/dismissToast() to fire one from
   anywhere, and <Toaster/> mounted once to render the stack bottom-right. */

let listeners = [];
let toasts = [];
let uid = 0;

function emit() { listeners.forEach((l) => l([...toasts])); }

export function toast({ type = "info", title, description, actionLabel, onAction, duration = 4500 }) {
  const id = ++uid;
  toasts = [...toasts, { id, type, title, description, actionLabel, onAction }];
  emit();
  if (duration) setTimeout(() => dismissToast(id), duration);
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const ICONS = {
  success: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>),
  info: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>),
  warning: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z" /><path d="M12 9v4M12 17h.01" /></svg>),
  error: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>),
  loading: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: "afToastSpin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-9-9" /></svg>),
};
const TONE = { success: "green", info: "indigo", warning: "amber", error: "red", loading: "grey" };

function ToastCard({ t }) {
  const tone = TONE[t.type] || "indigo";
  return (
    <div className={`af-toast tone-${tone}`} role="status">
      {ICONS[t.type] && <span className="af-toast-ico">{ICONS[t.type]}</span>}
      <div className="af-toast-body">
        {t.title && <div className="af-toast-title">{t.title}</div>}
        {t.description && <div className="af-toast-desc">{t.description}</div>}
      </div>
      {t.actionLabel && <button className="af-toast-action" onClick={() => { t.onAction && t.onAction(); dismissToast(t.id); }}>{t.actionLabel}</button>}
      <button className="af-toast-close" aria-label="Close" onClick={() => dismissToast(t.id)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export const Toast = ToastCard;

export function Toaster() {
  const [list, setList] = useState(toasts);
  useEffect(() => {
    listeners.push(setList);
    return () => { listeners = listeners.filter((l) => l !== setList); };
  }, []);
  return (
    <div className="af-toast-viewport">
      {list.map((t) => <ToastCard key={t.id} t={t} />)}
    </div>
  );
}
