"use client";

/* The compact journey step row, used by the dashboard's Next Steps card.

   STEP_ICON_TONE lives here rather than in JourneyRoadmap so the two surfaces
   cannot drift: a step that is amber on the Journey page is amber on the
   dashboard because they read the same map, not because someone kept two
   copies in step.

   The four-way status a card reader actually wants (Completed, In Progress,
   Needs Attention, Upcoming) is a presentation label over the Journey
   engine's own six-state model, built here rather than in lib/journey.ts —
   the engine's own vocabulary (pending/locked/submitted/rejected/completed/
   skipped) is what every guard, trigger and other screen reads, and stays
   exactly as it is. This is a card labelling its shared truth, not a second
   status system to keep in sync. */

import { Lock, Play, Eye, TriangleAlert } from "lucide-react";
import { Button, Chip } from "@heroui/react";
import { type StepState } from "@/lib/journey";
import { StepIcon } from "@/lib/journeyStepIcons";

export const STEP_ICON_TONE: Record<StepState, "grey" | "amber" | "red" | "green"> = {
  pending: "grey",
  locked: "grey",
  submitted: "amber",
  rejected: "red",
  completed: "green",
  skipped: "green",
};

type CardStatus = "completed" | "in_progress" | "needs_attention" | "upcoming";

const CARD_STATUS: Record<StepState, CardStatus> = {
  completed: "completed",
  skipped: "completed",
  submitted: "in_progress",
  rejected: "needs_attention",
  pending: "upcoming",
  locked: "upcoming",
};

const STATUS_META: Record<CardStatus, { label: string; color: "success" | "warning" | "danger" | "default" }> = {
  completed: { label: "Completed", color: "success" },
  in_progress: { label: "In Progress", color: "warning" },
  needs_attention: { label: "Needs Attention", color: "danger" },
  upcoming: { label: "Upcoming", color: "default" },
};

export function NextStepRow({ title, description, stageTitle, state, blocked, highlighted, onOpen }: {
  title: string;
  description: string;
  stageTitle: string;
  state: StepState;
  /** Held shut by the stage's own order. Still shown — knowing what is coming
      is the point of the card — but plainly unavailable. */
  blocked: boolean;
  /** The one step the student should act on next — the only row a solid
      button and a tinted rail earn, so it stands out without every row
      shouting for attention. */
  highlighted: boolean;
  onOpen: () => void;
}) {
  const tone = STEP_ICON_TONE[state] ?? "grey";
  const shut = blocked || state === "locked";
  const status = CARD_STATUS[state];
  const meta = STATUS_META[status];
  const settled = status === "completed";

  /* A settled step has nothing left to do; a shut one has nothing to do
     yet — neither earns a button. Everything else (upcoming-and-open,
     in progress, needs attention) gets one, worded for what it actually is. */
  const actionLabel = settled || shut ? null
    : status === "needs_attention" ? "Fix it"
    : status === "in_progress" ? "View"
    : highlighted ? "Start" : "Continue";

  return (
    <li className={`dxs-steprow${highlighted ? " current" : ""}${status === "needs_attention" ? " attention" : ""}${shut ? " shut" : ""}`}>
      <button className="dxs-row-hit" disabled={shut} onClick={onOpen} type="button">
        <span className={`jr-step-ico tone-${tone}`}>
          {shut ? <Lock size={13} /> : <StepIcon size={14} title={title} />}
        </span>

        <span className="dxs-row-body">
          <span className="dxs-row-top">
            <span className="dxs-row-title">{title}</span>
            {highlighted && !shut && <Chip color="accent" size="sm" variant="soft">Up next</Chip>}
          </span>
          {description && <span className="dxs-row-desc">{description}</span>}
          <span className="dxs-row-stage">{stageTitle}</span>
        </span>
      </button>

      <span className="dxs-row-side">
        <Chip color={shut ? "default" : meta.color} size="sm" variant="soft">
          {shut && status === "upcoming" ? "Locked" : meta.label}
        </Chip>
        {actionLabel && (
          <Button
            className="dxs-row-cta" onPress={onOpen} size="sm"
            variant={highlighted || status === "needs_attention" ? "primary" : "tertiary"}
          >
            {status === "needs_attention" ? <TriangleAlert size={13} /> : highlighted ? <Play size={13} /> : <Eye size={13} />}
            {actionLabel}
          </Button>
        )}
      </span>
    </li>
  );
}
