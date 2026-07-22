import { LegalPage, Section } from "@/components/legal/Legal";
import { LEGAL_UPDATED } from "@/components/legal/LegalContent";

export const metadata = { title: "Privacy Policy — AfaqWay" };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated={LEGAL_UPDATED}
      intro="This Privacy Policy explains what information AfaqWay (the “Platform”, “we”, “us”), operated by Abderrahmane Almoustansir, collects, how we use it, and the choices you have. It applies to your use of the Platform."
    >
      <div className="legal-prose">
        <Section n={1} title="Information we collect">
          <p>We collect information you provide to deliver the service, including:</p>
          <ul>
            <li><strong>Profile information</strong> — such as your name, date of birth, city, academic background, target country, budget, and program preferences.</li>
            <li><strong>Documents</strong> — files you upload for your application, such as transcripts, diplomas, passports, language certificates, and related paperwork.</li>
            <li><strong>Contact information</strong> — such as your email address and phone or WhatsApp number.</li>
            <li><strong>Account and usage data</strong> — such as login records, payment records, and basic technical information needed to run the Platform securely.</li>
          </ul>
        </Section>
        <Section n={2} title="How we use your information">
          <p>We use your information to generate your personalized roadmap, process and review your application documents, track your deadlines and status, communicate with you and provide support, process payments, and keep the Platform secure. We do not sell your personal information.</p>
        </Section>
        <Section n={3} title="Sharing your information">
          <p>We share information only as needed to provide the service, for example with service providers who help us operate the Platform (such as secure hosting and storage), and, where you ask us to assist with your application, with the relevant institutions. We may also disclose information where required by law.</p>
        </Section>
        <Section n={4} title="Storage and security">
          <p>Your documents and data are stored using reputable hosting and storage providers, with access controls in place so that only authorized people can access your file. We take reasonable technical and organizational measures to protect your information, though no method of transmission or storage is completely secure.</p>
        </Section>
        <Section n={5} title="Data retention">
          <p>We keep your information for as long as your account is active and as needed to provide the service, and thereafter only as required for legitimate business or legal purposes. You may ask us to delete your data, subject to any records we must retain by law.</p>
        </Section>
        <Section n={6} title="Your rights">
          <p>You may request access to the personal information we hold about you, ask us to correct inaccurate information, or request deletion of your data. To exercise these rights, contact us using the details below.</p>
        </Section>
        <Section n={7} title="Contact for data requests">
          <p>For any privacy question or data request, contact us at <a href="mailto:support@afaqway.com">support@afaqway.com</a>. The Platform is operated by Abderrahmane Almoustansir.</p>
        </Section>
      </div>
    </LegalPage>
  );
}
