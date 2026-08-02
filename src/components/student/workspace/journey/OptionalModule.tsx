"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Handshake, Sparkles, Trash2 } from "lucide-react";
import { AnimatedModal, DialogHead, DialogFoot } from "@/components/ds";
import { JrButton, JrMenu } from "./parts";
import type { JourneyStep } from "@/lib/journey";

/* An optional module: steps a student switches on.
 *
 * Two states, one component.
 *
 *   OFF  a single card offering the feature. The steps behind it exist in the
 *        database but are hidden, uncounted and inert, so a student who does not
 *        need a sponsor finishes the stage without four sponsor uploads sitting
 *        unfinished in their progress.
 *   ON   the same card, expanded, listing its steps as ordinary journey steps.
 *
 * Nothing here is a new design language. The card is the stage card's frame, the
 * steps are the same `jr-step` rows the rest of the roadmap uses, the dialogs are
 * the shared DialogHead / DialogFoot, and the menu is the shared JrMenu. The only
 * new pieces are the tint and the large watermark icon behind the offer.
 */

/** Icons a module may name in its rules. Adding one is adding a line. */
const MODULE_ICONS: Record<string, typeof Handshake> = { handshake: Handshake };

export type ModuleDialogKind = "enable" | "disable" | "remind";

export function OptionalModule({ step, open, onToggleOpen, onEnable, onDisable, busy, renderStep }: {
  step: JourneyStep;
  open: boolean;
  onToggleOpen: () => void;
  onEnable: () => void;
  onDisable: () => void;
  busy: boolean;
  /** The roadmap's own step renderer, so a sub-step is not a second design. */
  renderStep: (child: JourneyStep) => ReactNode;
}) {
  const Icon = MODULE_ICONS[step.moduleIcon] ?? Handshake;
  const done = step.children.filter((c) => c.state === "completed" || c.state === "skipped").length;

  /* ── Off: the offer ── */
  if (!step.moduleEnabled) {
    return (
      <li className="jr-optional">
        <Icon className="jr-optional-art" size={132} aria-hidden />
        <div className="jr-optional-main">
          <span className="jr-optional-tag"><Sparkles size={12} aria-hidden />Optional Feature</span>
          <h3 className="jr-optional-title">{step.title}</h3>
          <p className="jr-optional-desc">{step.description}</p>
        </div>
        <div className="jr-optional-acts">
          <JrButton tone="primary" size="md" disabled={busy} onClick={onEnable}>
            {busy ? "Adding…" : "Start"}
          </JrButton>
        </div>
      </li>
    );
  }

  /* ── On: the container ── */
  return (
    <li className={`jr-modstep${open ? " open" : ""}`}>
      <div className="jr-modstep-head">
        <button
          type="button" className="jr-modstep-toggle" aria-expanded={open} onClick={onToggleOpen}
        >
          <span className="jr-modstep-ico"><Icon size={17} aria-hidden /></span>
          <span className="jr-modstep-meta">
            <span className="jr-modstep-tag">Optional module</span>
            <span className="jr-modstep-title">{step.title}</span>
          </span>
          <span className="jr-modstep-count">{done}/{step.children.length}</span>
          <ChevronDown size={17} className="jr-modstep-chev" aria-hidden />
        </button>
        <JrMenu
          label="Sponsorship module options"
          items={[{
            label: "Disable Sponsorship Module",
            icon: <Trash2 size={14} />,
            danger: true,
            onSelect: onDisable,
          }]}
        />
      </div>

      {open && (
        <ol className="jr-timeline jr-modstep-steps">
          {step.children.map((child) => renderStep(child))}
        </ol>
      )}
    </li>
  );
}

/* ── Dialogs ──────────────────────────────────────────────────────────────── */

/**
 * Enable, disable and the one-time reminder, which are the same shape: a
 * question, an explanation of the consequence, and two ways out. The reminder is
 * the only one whose cancel means "never ask again", so its label differs.
 */
export function ModuleDialog({ kind, step, open, busy, onCancel, onConfirm }: {
  kind: ModuleDialogKind;
  step: JourneyStep;
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const spec = step.moduleDialogs[kind];
  if (!spec) return null;
  const dismissLabel = kind === "remind"
    ? (step.moduleDialogs.remind?.dismissLabel ?? "No Thanks")
    : "Cancel";

  return (
    <AnimatedModal open={open} onClose={onCancel} className="dlg" ariaLabel={spec.title}>
      <DialogHead eyebrow={step.title} title={spec.title}>{spec.body}</DialogHead>
      <DialogFoot>
        <JrButton tone="quiet" size="md" onClick={onCancel}>{dismissLabel}</JrButton>
        <JrButton
          tone={kind === "disable" ? "danger" : "primary"} size="md"
          disabled={busy} onClick={onConfirm}
        >
          {busy ? "Working…" : spec.confirmLabel}
        </JrButton>
      </DialogFoot>
    </AnimatedModal>
  );
}

export default OptionalModule;
