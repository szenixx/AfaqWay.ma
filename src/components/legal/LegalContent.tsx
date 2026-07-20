"use client";

import { Section } from "@/components/legal/Legal";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";

/* Single source of truth for the Terms + Refund text. Used by the /terms and
   /refund pages AND the in-app agreement viewer (onboarding roadmap step). */

export const LEGAL_UPDATED = "19 July 2026";

export function TermsBody() {
  return (
    <>
      <Section n={1} title="What the Platform provides">
        <p>AfaqWay is a study-abroad guidance platform. We help students plan and organize their applications to universities abroad through digital tools and services, which may include a personalized roadmap, program-matching guidance, document checklists, templates, guides and learning resources, human review of documents you upload, and support (with a dedicated advisor on some plans).</p>
        <p>The Platform provides <strong>guidance and assistance only</strong>. Decisions about admission, visas, scholarships, and residence permits are made solely by the relevant universities, embassies, and government authorities, over which we have no control.</p>
      </Section>
      <Section n={2} title="Plans and what each includes">
        <p>The exact features and price of each paid plan are shown on the pricing page at the time of purchase and form part of these Terms. In summary:</p>
        <ul>
          <li><strong>Self Service</strong> — you drive your application: a personalized roadmap with checklists, human review on every document you upload, learning resources, full document-status visibility, and support access.</li>
          <li><strong>Full Service</strong> — everything in Self Service, plus a dedicated advisor who manages your file, a live tracker, direct messaging, interview preparation, and post-arrival support.</li>
        </ul>
      </Section>
      <Section n={3} title="No guarantee of outcomes">
        <p>AfaqWay <strong>does not guarantee</strong> admission by any university, approval of any visa or residence permit, award of any scholarship, or any specific timeline or immigration outcome. Our services improve your chances by keeping you organized and reducing avoidable mistakes, but the final decision always rests with the universities, embassies, and authorities involved.</p>
      </Section>
      <Section n={4} title="Your responsibilities">
        <p>You are responsible for providing <strong>truthful, accurate, and complete</strong> information and documents, for completing the required steps and submitting documents on time, and for not submitting forged or fraudulent documents. We are not responsible for consequences arising from inaccurate, incomplete, late, or fraudulent information you provide.</p>
      </Section>
      <Section n={5} title="Document review">
        <p>Where your plan includes document review, a human reviewer checks the documents you upload to help catch errors before submission. Document review <strong>reduces mistakes but does not guarantee</strong> acceptance by any university, embassy, or authority, and is not legal, immigration, or financial advice.</p>
      </Section>
      <Section n={6} title="Payment terms">
        <p>Prices are shown on the pricing page and are payable in advance. For manual methods, access is activated after we verify your receipt, which must be valid and truthful. Repeated invalid or fraudulent proof, or abuse of the submission system, may lead to restrictions or suspension. Refunds are governed by our Refund Policy.</p>
      </Section>
      <Section n={7} title="Accounts and account sharing">
        <p>Your account is personal to you. You must keep your credentials confidential and must not <strong>share, sell, transfer, or allow unauthorized access</strong> to your account. Each paid plan is for a single user unless stated otherwise.</p>
      </Section>
      <Section n={8} title="Intellectual property">
        <p>All content and materials — templates, checklists, guides, roadmaps, learning resources, software, AI tools, text, and design — are the property of AfaqWay (Abel SARL) or its licensors. You receive a limited, personal, non-transferable licence to use them for your own application while your plan is active. You may not copy, redistribute, resell, or create derivative works without our written permission.</p>
      </Section>
      <Section n={9} title="Limitation of liability">
        <p>To the maximum extent permitted by law, AfaqWay and Abel SARL are not liable for indirect or consequential losses, or for losses arising from third-party decisions, your failure to complete steps or submit on time, inaccurate information you provide, or events outside our reasonable control. Where liability cannot be excluded, our total liability is limited to the amount you paid for the plan in question.</p>
      </Section>
      <Section n={10} title="Suspension and termination">
        <p>We may suspend or terminate your access if you breach these Terms, provide false information or documents, attempt fraud, share your account, or misuse the Platform. Sections that by their nature should survive termination continue to apply.</p>
      </Section>
      <Section n={11} title="Changes to the service and to these Terms">
        <p>We may change, improve, or discontinue parts of the Platform and update these Terms from time to time. Material changes update the “Last updated” date; continuing to use the Platform means you accept the updated Terms.</p>
      </Section>
      <Section n={12} title="Governing law">
        <p>These Terms are governed by the laws of the Kingdom of Morocco, subject to the jurisdiction of the competent Moroccan courts, without prejudice to any mandatory consumer-protection rights you may have where you live.</p>
      </Section>
      <Section n={13} title="Contact">
        <p>Questions? Contact us at <a href="mailto:support@afaqway.com">support@afaqway.com</a>.</p>
      </Section>
    </>
  );
}

export function RefundBody() {
  return (
    <>
      <Section n={1} title="Payments are generally non-refundable">
        <p>Our service is <strong>digital and begins immediately after purchase</strong>. As soon as your plan is active you get access to digital content and tools — your roadmap, checklists, templates, guides, learning resources, and document review. Because these are delivered right away and cannot be “returned”, all payments are <strong>generally non-refundable</strong>. By purchasing a plan you acknowledge the service starts immediately and agree to this policy.</p>
      </Section>
      <Section n={2} title="No refund for change of mind">
        <p>We do not provide refunds simply because you changed your mind, no longer need the service, or decided not to continue after purchasing.</p>
      </Section>
      <Section n={3} title="No refund for application rejections">
        <p>We do not provide refunds if a university, embassy, immigration authority, or any other institution rejects, delays, or does not approve your application, visa, scholarship, or residence permit. These decisions are made by third parties and are outside our control, and we do not guarantee any outcome.</p>
      </Section>
      <Section n={4} title="No refund for incomplete steps or missed deadlines">
        <p>We do not provide refunds if you fail to complete the required steps, do not submit your documents, or miss the deadlines set by universities, embassies, or authorities.</p>
      </Section>
      <Section n={5} title="When a refund may be issued">
        <p>Refunds may only be issued where required by <strong>applicable law</strong> or a mandatory consumer-protection right you cannot waive, or where <strong>we are unable to deliver the purchased service</strong> for reasons attributable to us. Any refund is limited to the amount you paid for the affected service.</p>
      </Section>
      <Section n={6} title="How to request a refund">
        <p>If you believe you qualify, contact <a href="mailto:support@afaqway.com">support@afaqway.com</a> with your payment ID and details. We will review and respond within a reasonable time.</p>
      </Section>
    </>
  );
}

/* Full-screen in-app viewer for the agreement checkboxes. */
export function LegalDocModal({ doc, onClose }: { doc: "terms" | "refund"; onClose: () => void }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(23,35,58,.55)", overflowY: "auto", padding: "48px 16px" }}>
      <button type="button" onClick={onClose} aria-label="Close" style={{ position: "fixed", top: 16, right: 16, zIndex: 121, width: 40, height: 40, borderRadius: 999, border: "none", cursor: "pointer", background: "var(--card)", boxShadow: "var(--shadow-card)", color: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5l10 10M15 5L5 15" /></svg>
      </button>
      <div style={{ maxWidth: 780, margin: "0 auto", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-card)", padding: "32px 36px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}><LogoMark size={30} /><span style={{ font: "700 22px/1 var(--font-sans)", color: "var(--ink)" }}>AfaqWay</span></div>
        </div>
        <h1 style={{ font: "700 26px/32px var(--font-sans)", color: "var(--ink)", margin: 0, textAlign: "center" }}>{doc === "terms" ? "Terms of Service" : "Refund Policy"}</h1>
        <p style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-faint)", textAlign: "center", margin: "6px 0 20px" }}>Last updated: {LEGAL_UPDATED}</p>
        <div className="legal-prose">{doc === "terms" ? <TermsBody /> : <RefundBody />}</div>
      </div>
    </div>
  );
}
