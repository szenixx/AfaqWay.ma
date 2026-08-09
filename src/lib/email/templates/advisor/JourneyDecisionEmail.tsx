import { Text } from "@react-email/components";
import { Layout, Header, Footer, StatusBanner, JourneyStatusCard, Button } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import { EMAIL_BRAND } from "../../senders";
import type { StatusTone } from "../../components/StatusBanner";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "advisor.journey-decision", version: 1, category: "advisor" };

const TITLE: Record<string, string> = {
  approved: "Step approved",
  rejected: "Step rejected",
  changes_requested: "Changes requested",
};
const TONE: Record<string, StatusTone> = {
  approved: "green",
  rejected: "red",
  changes_requested: "amber",
};

/** The email counterpart to the chat app's decision-message bubble
 *  (DecisionCard in src/components/chat/parts.tsx) and journeyNotify.ts's
 *  reviewMessage()/whatsappMessage() — same event (an advisor decides on a
 *  submitted step in JourneyApprovals.tsx), a third delivery channel. Every
 *  decision already reaches the student in-app; this just means it isn't
 *  missed if they aren't looking at the app right then. */
export type JourneyDecisionEmailProps = {
  studentName: string;
  outcome: "approved" | "rejected" | "changes_requested";
  stageTitle: string;
  stepTitle: string;
  note?: string;
};

export default function JourneyDecisionEmail({
  studentName, outcome, stageTitle, stepTitle, note,
}: EmailTemplateProps<JourneyDecisionEmailProps>) {
  const tone = TONE[outcome] ?? "indigo";
  const title = TITLE[outcome] ?? "Journey update";
  return (
    <Layout preview={`${title}: ${stageTitle} → ${stepTitle}`}>
      <Header variant="light" />
      <div style={{ padding: "40px" }}>
        <Text style={{ margin: "0 0 20px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.ink }}>
          Hello {studentName}, your advisor has reviewed your submission.
        </Text>
        <StatusBanner tone={tone} title={title} />
        <JourneyStatusCard tone={tone} stageTitle={stageTitle} stepTitle={stepTitle} note={note} />
        <div style={{ marginTop: 20 }}>
          <Button href={`${EMAIL_BRAND.websiteUrl}/dashboard`}>Open your workspace</Button>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
