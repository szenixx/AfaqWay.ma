"use client";

/* The compact journey step row, shared between the Journey page and the
   dashboard's Next Steps snapshot.

   STEP_ICON_TONE lives here rather than in JourneyRoadmap so the two surfaces
   cannot drift: a step that is amber on the Journey page is amber on the
   dashboard because they read the same map, not because someone kept two
   copies in step. The row uses the Journey module's own `.jr-step-*` classes
   for the same reason — this is the existing design, at a smaller size, not a
   second one. */

import { Lock } from "lucide-react";
import { STATE_BADGE, STATE_STATUS, type StepState } from "@/lib/journey";
import { StepIcon } from "@/lib/journeyStepIcons";
import { Status } from "@/components/ds";

/* Grey while it is still on the student (pending, or locked behind an earlier
   step), amber once it is with an advisor, red if it came back needing
   changes, green once it is settled — completed or skipped, both nothing more
   to do. */
export const STEP_ICON_TONE: Record<StepState, "grey" | "amber" | "red" | "green"> = {
  pending: "grey",
  locked: "grey",
  submitted: "amber",
  rejected: "red",
  completed: "green",
  skipped: "green",
};

export function StepPreviewRow({ title, stageTitle, state, blocked, onOpen }: {
  title: string;
  stageTitle: string;
  state: StepState;
  blocked: boolean;
  onOpen: () => void;
}) {
  const tone = STEP_ICON_TONE[state] ?? "grey";
  /* Held shut by the stage's own order. Still shown — knowing what is coming
     is the point of the snapshot — but plainly unavailable. */
  const shut = blocked || state === "locked";

  return (
    <button
      type="button"
      className={`jr-preview ${state}${shut ? " shut" : ""}`}
      onClick={onOpen}
    >
      <span className={`jr-step-ico tone-${tone}`}>
        {shut ? <Lock size={13} /> : <StepIcon size={14} title={title} />}
      </span>

      <span className="jr-preview-body">
        <span className="jr-preview-title">{title}</span>
        <span className="jr-preview-stage">{stageTitle}</span>
      </span>

      <Status
        state={STATE_STATUS[state]}
        label={shut && state === "pending" ? "Locked" : STATE_BADGE[state].label}
        size="xs"
      />
    </button>
  );
}
