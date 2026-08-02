import React, { useState, useRef, useEffect } from "react";

/* AfaqWay MegaMenu — top-bar nav with expandable panels (Product/Resources
   style). Items without `sections` are plain links. Adapted from a reference
   MegaMenu onto our own tokens (no external mega-menu package here). */

export function MegaMenu({ items = [] }) {
  const [open, setOpen] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (open == null) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <nav className="mmenu" ref={ref}>
      {items.map((item, i) => (
        <div key={item.label} className="mmenu-item">
          {item.sections ? (
            <>
              <button type="button" className={`mmenu-trigger${open === i ? " open" : ""}`} onClick={() => setOpen(open === i ? null : i)}>
                {item.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {open === i && (
                <div className="mmenu-panel">
                  {item.sections.map((sec, si) => (
                    <div key={si} className="mmenu-section">
                      {sec.heading && <div className="mmenu-heading">{sec.heading}</div>}
                      {sec.links.map((l) => (
                        <a key={l.label} href={l.href} className="mmenu-link" onClick={() => setOpen(null)}>
                          {l.icon && <span className="mmenu-link-ico">{l.icon}</span>}
                          <span>
                            <span className="mmenu-link-label">{l.label}</span>
                            {l.description && <span className="mmenu-link-desc">{l.description}</span>}
                          </span>
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <a href={item.href} className="mmenu-trigger plain">{item.label}</a>
          )}
        </div>
      ))}
    </nav>
  );
}
