"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";

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
