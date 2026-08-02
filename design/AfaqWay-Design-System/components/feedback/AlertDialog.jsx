import React, { createContext, useContext, useEffect } from "react";
import { Button } from "../core/Button";

/* AfaqWay AlertDialog — the platform's one dialog shell. Centred popup,
   backdrop blur, fade+zoom in/out, header (optional media + title +
   description) and a footer with Cancel/Action built on <Button>. Every
   confirmation, destructive-action and simple modal uses this. */

const Ctx = createContext(null);

export function AlertDialog({ open, onOpenChange, size = "default", children }) {
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
        <div className={`ad-popup${size === "sm" ? " sm" : ""}`} role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function AlertDialogMedia({ children }) {
  return <div className="ad-media">{children}</div>;
}

export function AlertDialogHeader({ children }) {
  return <div className="ad-header">{children}</div>;
}

export function AlertDialogTitle({ children }) {
  return <h2 className="ad-title">{children}</h2>;
}

export function AlertDialogDescription({ children }) {
  return <p className="ad-desc">{children}</p>;
}

export function AlertDialogFooter({ children }) {
  return <div className="ad-footer">{children}</div>;
}

export function AlertDialogAction({ children, onClick, variant = "primary", ...rest }) {
  return <Button variant={variant} onClick={onClick} {...rest}>{children}</Button>;
}

export function AlertDialogCancel({ children = "Cancel", onClick, variant = "neutral", ...rest }) {
  const ctx = useContext(Ctx);
  return (
    <Button variant={variant} onClick={() => { onClick && onClick(); ctx && ctx.close(); }} {...rest}>
      {children}
    </Button>
  );
}
