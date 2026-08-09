import { Row, Column, Section, Text } from "@react-email/components";
import { emailColors, emailFont, emailRadius } from "../tokens";

export type InfoRow = { label: string; value: string };

/** The generic bordered label/value card. UserInfoSection, JourneyStatusCard
 *  and PaymentSummary each wrap this rather than reimplementing the card
 *  chrome, so every "block of facts" in an email shares one look. */
export function InformationCard({ title, rows }: { title?: string; rows: InfoRow[] }) {
  return (
    <Section
      style={{
        backgroundColor: emailColors.page,
        border: `1px solid ${emailColors.line}`,
        borderRadius: emailRadius.md,
        padding: "16px 20px",
        margin: "16px 0",
      }}
    >
      {title && (
        <Text style={{ margin: "0 0 10px", fontFamily: emailFont, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: emailColors.inkFaint }}>
          {title}
        </Text>
      )}
      {rows.map((r, i) => (
        <Row key={r.label} style={{ marginTop: i === 0 ? 0 : 8 }}>
          <Column>
            <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 13, color: emailColors.inkSoft }}>{r.label}</Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 13, fontWeight: 600, color: emailColors.ink, textAlign: "right" }}>
              {r.value}
            </Text>
          </Column>
        </Row>
      ))}
    </Section>
  );
}
