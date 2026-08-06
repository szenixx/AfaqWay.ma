"use client";

import { useEffect, useState, type PropsWithChildren, type ReactNode } from "react";
import { X as CloseIcon, Menu as Menu02 } from "lucide-react";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";

/* Mobile navigation header — literally the marketing SiteHeader's mobile bar
   (same compact pill that hugs its own content, same logo/text size, same
   bare hamburger) plus the notification bell, the only addition. The
   dropdown below it is that same header's own mobile menu shape too: a
   centred rounded card under the bar, not a full-height side drawer. */

export const MobileNavigationHeader = ({ children, rightExtra, activeKey }: PropsWithChildren<{ rightExtra?: ReactNode; activeKey?: string }>) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /* Closes on any way the visible module can change — not just a click
     inside the dropdown itself. The chat FAB and the notification popover
     both sit above the dropdown's own backdrop (they need to stay usable
     while it's open) and a real device's back/forward swipe changes the
     route with no click at all, so a click-only close left the dropdown
     stuck open behind whatever page it navigated to. */
  useEffect(() => { setOpen(false); }, [activeKey]);

  return (
    <>
      <header className="mnav-header">
        <div className="mnav-pill">
          <div className="mnav-brand">
            <LogoMark size={34} />
            <span className="mnav-brand-name">AfaqWay</span>
          </div>
          {rightExtra}
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
        </div>
      </header>

      {open && (
        <>
          <div className="mnav-dropdown-backdrop" onClick={() => setOpen(false)} aria-hidden />
          {/* Closes on any click inside too — picking a module should
              dismiss the dropdown, not leave it hanging open. */}
          <div
            className="mnav-dropdown"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            {children}
          </div>
        </>
      )}
    </>
  );
};

export default MobileNavigationHeader;
