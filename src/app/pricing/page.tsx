import Link from "next/link";
import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";
import { Container, SectionHead, IconCompass, IconDoc, IconTracker, IconSpark, IconArrow } from "@/components/home/ui";

export const metadata = {
  title: "Pricing — AfaqWay",
  description: "How AfaqWay pricing works: it varies by destination country, application complexity, the features you use, and your degree level.",
};

const FACTORS: { icon: React.ReactNode; title: string; desc: string }[] = [
  { icon: <IconCompass />, title: "Destination country", desc: "Each country has its own process, requirements and workload. Pricing reflects what it actually takes to apply there, so it varies from one destination to another." },
  { icon: <IconDoc />, title: "Application complexity", desc: "Some applications need more documents, translations, and steps than others. The more complex your case, the more work is involved." },
  { icon: <IconTracker />, title: "Features & service level", desc: "Whether you drive your own application with our tools and reviews, or have our team manage more of it for you, changes what you pay." },
  { icon: <IconSpark />, title: "Degree level & profile", desc: "Bachelor, Master or other levels differ in requirements, and details of your profile can affect the scope of guidance you need." },
];

export default function PricingPage() {
  return (
    <main>
      <SiteHeader />

      <section style={{ padding: "48px 24px 8px" }}>
        <Container width={860}>
          <SectionHead eyebrow="Pricing" title="Pricing that fits your destination and your plan" sub="AfaqWay does not use one flat price for everyone. What you pay depends on where you are going and how much help you want, so you never overpay for a simpler application, or come up short on a harder one." />
        </Container>
      </section>

      <section style={{ padding: "40px 24px" }}>
        <Container width={980}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
            {FACTORS.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "18px 20px", boxSizing: "border-box" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--indigo-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-600)", flex: "none" }}>{f.icon}</div>
                <div>
                  <div style={{ font: "600 15.5px/21px var(--font-sans)", color: "var(--ink)" }}>{f.title}</div>
                  <div style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ font: "600 15px/21px var(--font-sans)", color: "var(--ink)" }}>Always transparent</div>
            <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0" }}>
              Whatever your case, the exact price and everything included are shown to you clearly before you pay, with no hidden fees and no commission games. You will always know what you are paying for and what you get.
            </p>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section style={{ padding: "48px 24px 80px" }}>
        <Container width={760}>
          <div style={{ background: "linear-gradient(135deg, var(--indigo-600), #4263C7)", borderRadius: 22, padding: "44px 32px", textAlign: "center", boxShadow: "0 20px 50px rgba(43,76,155,.28)" }}>
            <h2 style={{ font: "800 var(--font-sans)", fontSize: "clamp(24px, 3.2vw, 34px)", lineHeight: 1.2, color: "#fff", margin: 0 }}>Get your personalized price</h2>
            <p style={{ font: "400 15px/24px var(--font-sans)", color: "rgba(255,255,255,.9)", maxWidth: 480, margin: "14px auto 0" }}>
              Start your roadmap to see the plan and price built for your destination, or contact us for a personalized quote.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 26 }}>
              <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 50, padding: "0 28px", borderRadius: 999, background: "#fff", color: "var(--indigo-600)", font: "700 15px/1 var(--font-sans)" }}>
                Start your roadmap <IconArrow size={16} />
              </Link>
              <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", height: 50, padding: "0 28px", borderRadius: 999, background: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,.7)", font: "600 15px/1 var(--font-sans)", boxSizing: "border-box" }}>
                Contact for a quote
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
