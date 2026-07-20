import { LegalPage } from "@/components/legal/Legal";
import { RefundBody, LEGAL_UPDATED } from "@/components/legal/LegalContent";

export const metadata = { title: "Refund Policy — AfaqWay" };

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      updated={LEGAL_UPDATED}
      intro="This Refund Policy explains when payments made to AfaqWay (operated by Abel SARL) can and cannot be refunded. It forms part of our Terms of Service. Please read it before purchasing a plan."
    >
      <RefundBody />
    </LegalPage>
  );
}
