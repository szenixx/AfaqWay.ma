import { Row, Column, Section, Text, Hr } from "@react-email/components";
import { emailColors, emailFont, emailRadius } from "../tokens";

export type PaymentLine = { label: string; amount: string };

/** A plain receipt block: line items, a total, an optional reference/date
 *  row. Amounts are pre-formatted strings — this component doesn't know
 *  about currencies or locale number formatting, the caller does. Kept
 *  deliberately simple per the initial billing-email scope (a final,
 *  more branded receipt design can replace this later without touching
 *  any template that uses it). */
export function PaymentSummary({ items, total, reference, date }: {
  items: PaymentLine[];
  total: PaymentLine;
  reference?: string;
  date?: string;
}) {
  return (
    <Section
      style={{
        backgroundColor: emailColors.card,
        border: `1px solid ${emailColors.line}`,
        borderRadius: emailRadius.md,
        padding: "18px 20px",
        margin: "16px 0",
      }}
    >
      {(reference || date) && (
        <Text style={{ margin: "0 0 10px", fontFamily: emailFont, fontSize: 12, color: emailColors.inkFaint }}>
          {[reference, date].filter(Boolean).join(" · ")}
        </Text>
      )}
      {items.map((line) => (
        <Row key={line.label} style={{ marginBottom: 6 }}>
          <Column>
            <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 13.5, color: emailColors.inkSoft }}>{line.label}</Text>
          </Column>
          <Column align="right">
            <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 13.5, color: emailColors.ink, textAlign: "right" }}>
              {line.amount}
            </Text>
          </Column>
        </Row>
      ))}
      <Hr style={{ borderColor: emailColors.lineSoft, margin: "10px 0" }} />
      <Row>
        <Column>
          <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 15, fontWeight: 800, color: emailColors.ink }}>{total.label}</Text>
        </Column>
        <Column align="right">
          <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 15, fontWeight: 800, color: emailColors.indigo600, textAlign: "right" }}>
            {total.amount}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
