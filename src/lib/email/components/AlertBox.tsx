import { Section, Text } from "@react-email/components";
import { emailColors, emailFont, emailRadius } from "../tokens";

export type AlertKind = "info" | "warning" | "danger";

const KIND: Record<AlertKind, { tint: string; line: string; dark: string }> = {
  info: { tint: emailColors.indigoTint, line: emailColors.indigoLine, dark: emailColors.indigo600 },
  warning: { tint: emailColors.amberTint, line: emailColors.amberLine, dark: emailColors.amber },
  danger: { tint: emailColors.redTint, line: emailColors.redLine, dark: emailColors.red },
};

/** A left-accented inline callout for a single important line of body
 *  copy — "this link expires in 60 minutes," "this wasn't you? reset your
 *  password now," and similar. Unlike StatusBanner, this isn't the email's
 *  headline; it sits inside the normal content flow. */
export function AlertBox({ kind = "info", children }: { kind?: AlertKind; children: string }) {
  const c = KIND[kind];
  return (
    <Section
      style={{
        backgroundColor: c.tint,
        borderLeft: `3px solid ${c.dark}`,
        borderRadius: emailRadius.sm,
        padding: "12px 16px",
        margin: "16px 0",
      }}
    >
      <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 13, lineHeight: "19px", color: emailColors.ink }}>
        {children}
      </Text>
    </Section>
  );
}
