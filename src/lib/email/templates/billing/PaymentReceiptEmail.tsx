import { Text } from "@react-email/components";
import { Layout, Header, Footer, StatusBanner, PaymentSummary } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "billing.payment-receipt", version: 1, category: "billing" };

/** Sent when an admin approves a payment in PaymentReviews.tsx — the app's
 *  only payment-approval trigger point, previously silent (no email at
 *  all, only a PDF download elsewhere in the app). Deliberately plain per
 *  the original billing scope: a simple confirmation now, a fully
 *  branded/itemized invoice can replace PaymentSummary's contents later
 *  without touching this template's structure. */
export type PaymentReceiptEmailProps = {
  studentName: string;
  planName: string;
  amount: string;
  method: string;
  reference?: string;
  reviewedDate: string;
};

export default function PaymentReceiptEmail({
  studentName, planName, amount, method, reference, reviewedDate,
}: EmailTemplateProps<PaymentReceiptEmailProps>) {
  return (
    <Layout preview={`Your ${planName} payment has been approved.`}>
      <Header variant="dark" eyebrow="Payment receipt" />
      <div style={{ padding: "40px" }}>
        <Text style={{ margin: "0 0 20px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.ink }}>
          Hello {studentName}, your payment has been reviewed and approved. Here&rsquo;s your receipt.
        </Text>
        <StatusBanner tone="green" title="Payment approved" subtitle={planName} />
        <PaymentSummary
          items={[{ label: "Plan", amount: planName }, { label: "Payment method", amount: method }]}
          total={{ label: "Amount paid", amount }}
          reference={reference ? `Ref ${reference}` : undefined}
          date={reviewedDate}
        />
        <Text style={{ margin: "20px 0 0", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          Keep this email as your receipt. Questions about this payment? Reply to this email or reach support.
        </Text>
      </div>
      <Footer />
    </Layout>
  );
}
