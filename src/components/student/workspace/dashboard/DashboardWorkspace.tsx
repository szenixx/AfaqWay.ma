"use client";

/* The AfaqWay dashboard — a full-viewport application, not a card on a page.

   There is no outer frame and no max-width: the sidebar (rendered by
   WorkspaceShell), the main column and the right utility panel divide the
   browser window between them and each fills its full height. The page
   background IS the dashboard background; only the internal cards are white.

   Main column, top to bottom: welcome card → the live rings, an open slot
   and the journey → the Next Steps snapshot beside the card deck. Right panel:
   calendar → the community → an open slot.

   Neither column scrolls the page. If content outruns the height it scrolls
   inside its own panel, but the sizing is tuned so it normally does not. */

import { useJourneySummary, type PreviewStep } from "@/lib/useJourneySummary";
import { MetricsRow, NextSteps, Welcome } from "./center";
import { SocialSection } from "./social";
import { UtilityPanel } from "./panel";
import type { WsProfile } from "../Modules";

export function DashboardWorkspace({ profile, onNav }: {
  profile: WsProfile; onNav: (id: string) => void;
}) {
  /* The CTA names the next real action, so it reads the real journey. */
  const j = useJourneySummary(profile.userId, profile.plan, profile.academic?.targetDegree, profile.tester);
  const started = j.stepsDone > 0 || j.pct > 0;

  /* Same hand-off JourneyRoadmap already reads coming back from an upload
     (see its "af.journey.open" effect) — reused here rather than duplicated,
     so a Next Steps row opens the Journey page with that exact step already
     expanded instead of leaving the student to find it again. */
  const openStep = (step: PreviewStep) => {
    try { sessionStorage.setItem("af.journey.open", JSON.stringify({ stepId: step.id })); } catch { /* storage blocked */ }
    onNav("journey");
  };
  /* The greeting is the signed-in student's own first name, never the
     demo constant — the rest of the card is placeholder, this is not. */
  const firstName = (profile.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return (
    /* Two zones straight onto the app background — no wrapper, no frame. */
    <div className="dx-app">
      <div className="dx-center">
        <Welcome name={firstName} started={started} onAction={() => onNav("journey")} />
        <MetricsRow academic={profile.academic} j={j} study={profile.study} onChat={() => onNav("messages")} />
        {/* The Next Steps snapshot and the social modules share the last row.
            Support, student life and the Learning Center replace the old
            highlights deck, whose figures were invented rather than read. */}
        <div className="dx-lastrow">
          <NextSteps done={j.stepsDone} loading={j.loading} onOpen={() => onNav("journey")} onOpenStep={openStep} steps={j.nextSteps} total={j.stepsTotal} />
          <SocialSection
            deck
            unlocked={profile.verified || profile.tester}
            onUpgrade={() => onNav("subscription")}
          />
        </div>
      </div>

      <UtilityPanel />
    </div>
  );
}

export default DashboardWorkspace;
