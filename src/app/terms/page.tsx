import { LegalPage } from "@/components/legal/Legal";
import { TermsBody, LEGAL_UPDATED } from "@/components/legal/LegalContent";

export const metadata = { title: "Terms of Service — AfaqWay" };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated={LEGAL_UPDATED}
      intro="These Terms of Service (the “Terms”) govern your use of AfaqWay (the “Platform”, “we”, “us”), operated by Abel SARL. By creating an account, purchasing a plan, or using the Platform, you agree to these Terms. If you do not agree, please do not use the Platform."
    >
      <TermsBody />
    </LegalPage>
  );
}
