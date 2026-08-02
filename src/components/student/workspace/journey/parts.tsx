"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EllipsisVertical, Info } from "lucide-react";

/* Shared Journey pieces.

   Status is communicated by the shared Status component, and every action
   button in the module comes from JrButton so heights, radii, padding and
   typography match everywhere. Defined once so no screen can drift. */

/* ── Buttons ──────────────────────────────────────────────────────────────── */

export type JrButtonTone = "primary" | "quiet" | "outline" | "danger" | "success";

/**
 * The single action button of the Journey module. Every View Details, Mark as
 * Done, Skip, Open Documents, Preview and Download uses it, so they are always
 * the same height, radius, padding and weight.
 */
export function JrButton({
  tone = "quiet", size = "sm", icon, children, onClick, disabled, title, fullWidth, type = "button",
}: {
  tone?: JrButtonTone;
  size?: "sm" | "md";
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  fullWidth?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} title={title}
      className={`jr-btn jr-btn-${tone} jr-btn-${size}${fullWidth ? " jr-btn-full" : ""}`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ── Overflow menu ────────────────────────────────────────────────────────── */

/**
 * The three-dot menu.
 *
 * Extracted rather than copied: the admin chat draws the same popup with inline
 * styles, and a second hand-styled copy is how two menus start disagreeing about
 * radius, shadow and spacing. This one owns the behaviour too — click outside,
 * scroll and Escape all close it, which the inline version only half did.
 */
export function JrMenu({ label = "Options", items }: {
  label?: string;
  items: { label: string; icon?: ReactNode; danger?: boolean; onSelect: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "keydown" && (e as KeyboardEvent).key !== "Escape") return;
      // A click inside the menu is a selection, not a dismissal.
      if (e.type === "pointerdown" && root.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <div className="jr-menu" ref={root}>
      <button
        type="button" className="jr-menu-btn" title={label} aria-label={label}
        aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <EllipsisVertical size={16} />
      </button>
      {open && (
        <div className="jr-menu-pop" role="menu">
          {items.map((item) => (
            <button
              key={item.label} type="button" role="menuitem"
              className={`jr-menu-item${item.danger ? " danger" : ""}`}
              onClick={() => { setOpen(false); item.onSelect(); }}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Information card ─────────────────────────────────────────────────────── */

/**
 * The module's explanatory card: large rounded frame, soft tint, leading icon.
 * Replaces the small grey sentences that used to carry this information.
 */
export function InfoCard({
  title, children, tone = "blue", icon,
}: {
  title: string;
  children: ReactNode;
  tone?: "blue" | "grey" | "amber" | "green" | "red";
  icon?: ReactNode;
}) {
  return (
    <div className={`jr-info jr-info-${tone}`}>
      <span className="jr-info-ico">{icon ?? <Info size={18} />}</span>
      <div className="jr-info-body">
        <div className="jr-info-title">{title}</div>
        <div className="jr-info-text">{children}</div>
      </div>
    </div>
  );
}
