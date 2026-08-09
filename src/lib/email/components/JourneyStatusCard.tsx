import { Section, Text } from "@react-email/components";
import { emailColors, emailFont, emailRadius } from "../tokens";
import type { StatusTone } from "./StatusBanner";

const TONE: Record<StatusTone, { tint: string; line: string; dark: string }> = {
  green: { tint: emailColors.greenTint, line: emailColors.greenLine, dark: emailColors.green },
  red: { tint: emailColors.redTint, line: emailColors.redLine, dark: emailColors.red },
  amber: { tint: emailColors.amberTint, line: emailColors.amberLine, dark: emailColors.amber },
  indigo: { tint: emailColors.indigoTint, line: emailColors.indigoLine, dark: emailColors.indigo600 },
};

/** The Stage → Step position within a student's journey, plus an optional
 *  advisor note — the email counterpart to the chat app's decision-message
 *  bubble (src/components/chat/parts.tsx DecisionCard), reusing the same
 *  four tones so a "changes requested" email and its originating chat
 *  message read as the same event. */
export function JourneyStatusCard({ tone = "indigo", stageTitle, stepTitle, note }: {
  tone?: StatusTone;
  stageTitle: string;
  stepTitle?: string;
  note?: string;
}) {
  const c = TONE[tone];
  const path = [stageTitle, stepTitle].filter(Boolean).join(" → ");
  return (
    <Section
      style={{
        backgroundColor: c.tint,
        border: `1px solid ${c.line}`,
        borderRadius: emailRadius.md,
        padding: "14px 18px",
        margin: "16px 0",
      }}
    >
      <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 12.5, fontWeight: 600, color: c.dark }}>
        {path}
      </Text>
      {note && (
        <>
          <Text style={{ margin: "8px 0 2px", fontFamily: emailFont, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: c.dark }}>
            Advisor Note
          </Text>
          <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 13, lineHeight: "19px", color: emailColors.ink }}>
            {note}
          </Text>
        </>
      )}
    </Section>
  );
}
