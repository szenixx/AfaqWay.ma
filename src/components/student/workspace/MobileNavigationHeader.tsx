"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { X as CloseIcon, Menu as Menu02 } from "lucide-react";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";

/* Mobile navigation header — same structure and sequence as the reference:
   header (logo + morphing menu/close button) → dismissable blurred overlay →
   fixed close button → modal panel → dialog holding the navigation.
   Only the colours, icons and primitives are ours (no react-aria-components). */

export const MobileNavigationHeader = ({ children }: PropsWithChildren) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="mnav-header">
        <LogoMark size={24} />

        <button
          type="button"
          aria-label="Expand navigation menu"
          aria-expanded={open}
          className="mnav-trigger group"
          onClick={() => setOpen((v) => !v)}
        >
          <Menu02 className="mnav-ico-menu" size={24} />
          <CloseIcon className="mnav-ico-close" size={24} />
        </button>
      </header>

      {open && (
        <div className="mnav-overlay" onClick={() => setOpen(false)}>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="mnav-close"
          >
            <CloseIcon size={24} />
          </button>

          <div className="mnav-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mnav-dialog" role="dialog" aria-modal="true" aria-label="Navigation">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigationHeader;
