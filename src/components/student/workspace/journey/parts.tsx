"use client";

import type { ReactNode } from "react";
import {
  CircleCheck, CircleDashed, Clock3, Hourglass, Info, Lock, SkipForward, TriangleAlert,
} from "lucide-react";
import type { StepState } from "@/lib/journey";

/* Shared Journey pieces.

   Status is communicated by the icon itself, not by a separate badge, and every
   action button in the module comes from JrButton so heights, radii, padding and
   typography match everywhere. Defined once so no screen can drift. */

/* ── Status icons ─────────────────────────────────────────────────────────── */

export const STEP_ICON: Record<StepState, { Icon: typeof CircleCheck; tone: string; label: string }> = {
  completed: { Icon: CircleCheck,    tone: "green",  label: "Completed" },
  submitted: { Icon: Hourglass,      tone: "amber",  label: "Waiting review" },
  rejected:  { Icon: TriangleAlert,  tone: "red",    label: "Changes requested" },
  skipped:   { Icon: SkipForward,    tone: "grey",   label: "Skipped" },
  pending:   { Icon: Clock3,         tone: "orange", label: "Pending" },
  locked:    { Icon: Lock,           tone: "grey",   label: "Locked" },
};

/** The step's status, as a single icon with an accessible label. */
export function StepStatusIcon({ state, size = 18 }: { state: StepState; size?: number }) {
  const { Icon, tone, label } = STEP_ICON[state];
  return (
    <span className={`jr-status jr-status-${tone}`} title={label} role="img" aria-label={label}>
      <Icon size={size} />
    </span>
  );
}

/** In-progress marker used where a step is actively being worked on. */
export function InProgressIcon({ size = 18 }: { size?: number }) {
  return (
    <span className="jr-status jr-status-blue" title="In progress" role="img" aria-label="In progress">
      <CircleDashed size={size} />
    </span>
  );
}

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
