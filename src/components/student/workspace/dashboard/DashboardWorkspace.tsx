"use client";

/* The AfaqWay dashboard — a full-viewport application, not a card on a page.

   There is no outer frame and no max-width: the sidebar (rendered by
   WorkspaceShell), the main column and the right utility panel divide the
   browser window between them and each fills its full height. The page
   background IS the dashboard background; only the internal cards are white.

   Main column, top to bottom: welcome card → performance card beside the
   journey card → media rows. Right panel: profile/tools → calendar →
   today's event → two actions.

   Neither column scrolls the page. If content outruns the height it scrolls
   inside its own panel, but the sizing is tuned so it normally does not. */

import { useJourneySummary } from "@/lib/useJourneySummary";
import { useNotifications } from "@/lib/notifications";
import { MediaSection, MetricsRow, Welcome } from "./center";
import { UtilityPanel } from "./panel";
import type { WsProfile } from "../Modules";

export function DashboardWorkspace({ profile, onNav }: {
  profile: WsProfile; onNav: (id: string) => void;
}) {
  const { unread } = useNotifications(profile.userId);
  /* The CTA names the next real action, so it reads the real journey. */
  const j = useJourneySummary(profile.userId, profile.plan, profile.academic?.targetDegree, profile.tester);
  const started = j.stepsDone > 0 || j.pct > 0;
  /* The greeting is the signed-in student's own first name, never the
     demo constant — the rest of the card is placeholder, this is not. */
  const firstName = (profile.fullName ?? "").trim().split(/\s+/)[0] || "there";

  return (
    /* Two zones straight onto the app background — no wrapper, no frame. */
    <div className="dx-app">
      <div className="dx-center">
        <Welcome name={firstName} started={started} onAction={() => onNav("journey")} />
        <MetricsRow />
        <MediaSection onAll={() => onNav("documents")} />
      </div>

      <UtilityPanel profile={profile} unread={unread} onNav={onNav} />
    </div>
  );
}

export default DashboardWorkspace;
