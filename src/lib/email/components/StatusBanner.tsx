import { Section, Text } from "@react-email/components";
import { emailColors, emailFont, emailRadius } from "../tokens";

export type StatusTone = "green" | "red" | "amber" | "indigo";

const TONE: Record<StatusTone, { tint: string; line: string; dark: string }> = {
  green: { tint: emailColors.greenTint, line: emailColors.greenLine, dark: emailColors.green },
  red: { tint: emailColors.redTint, line: emailColors.redLine, dark: emailColors.red },
  amber: { tint: emailColors.amberTint, line: emailColors.amberLine, dark: emailColors.amber },
  indigo: { tint: emailColors.indigoTint, line: emailColors.indigoLine, dark: emailColors.indigo600 },
};

/** A full-width status strip for the headline outcome of an email — the
 *  same four tones as the in-app decision-message bubble (chat/parts.tsx),
 *  so "approved" reads the same color in chat and in the follow-up email. */
export function StatusBanner({ tone = "indigo", title, subtitle }: {
  tone?: StatusTone;
  title: string;
  subtitle?: string;
}) {
  const c = TONE[tone];
  return (
    <Section
      style={{
        backgroundColor: c.tint,
        border: `1px solid ${c.line}`,
        borderRadius: emailRadius.md,
        padding: "16px 20px",
        margin: "0 0 20px",
        textAlign: "center",
      }}
    >
      <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 16, fontWeight: 800, color: c.dark, letterSpacing: "-0.1px" }}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ margin: "4px 0 0", fontFamily: emailFont, fontSize: 13, fontWeight: 500, color: emailColors.ink }}>
          {subtitle}
        </Text>
      )}
    </Section>
  );
}
