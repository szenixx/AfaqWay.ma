import React, { createContext, useContext, useEffect } from "react";
import { Button } from "../core/Button";

/* AfaqWay Dialog — the general-purpose modal (settings panels, forms, previews)
   alongside <AlertDialog> (confirmations/destructive actions). Same overlay +
   popup shell; adds a corner close (X) and a bordered, tinted footer bar. */

const Ctx = createContext(null);

const IX = ({ s = 16 }) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>);

export function Dialog({ open, onOpenChange, showCloseButton = true, size = "default", children }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onOpenChange && onOpenChange(false); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <Ctx.Provider value={{ close: () => onOpenChange && onOpenChange(false) }}>
      <div className="ad-overlay" onClick={() => onOpenChange && onOpenChange(false)}>
        <div className={`ad-popup dlg-popup${size === "sm" ? " sm" : ""}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          {children}
          {showCloseButton && (
            <button type="button" className="dlg-close-x" aria-label="Close" onClick={() => onOpenChange && onOpenChange(false)}>
              <IX />
            </button>
          )}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function DialogHeader({ children }) {
  return <div className="dlg-header">{children}</div>;
}

export function DialogTitle({ children }) {
  return <h2 className="dlg-title">{children}</h2>;
}

export function DialogDescription({ children }) {
  return <p className="dlg-desc">{children}</p>;
}

export function DialogFooter({ children }) {
  return <div className="dlg-footer">{children}</div>;
}

export function DialogClose({ children = "Close", onClick, variant = "neutral", ...rest }) {
  const ctx = useContext(Ctx);
  return (
    <Button variant={variant} onClick={() => { onClick && onClick(); ctx && ctx.close(); }} {...rest}>
      {children}
    </Button>
  );
}
