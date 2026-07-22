import Link from "next/link";
import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";
import { Container, IconArrow } from "@/components/home/ui";
import { LogoMark } from "@/components/hero/OnboardingHeroPanel";
import { STATS } from "@/components/home/Statistics";

export const metadata = {
  title: "About us — AfaqWay",
  description: "AfaqWay is a personalized platform guiding non-EU students through every step of studying abroad: roadmap, document review, deadline tracking, and real human support.",
};

const VALUES: { title: string; desc: string }[] = [
  { title: "Reliability", desc: "A system built on real, up-to-date country rules, so nothing important is forgotten or guessed." },
  { title: "Transparency", desc: "Clear pricing and full visibility into your application at every step, no black boxes." },
  { title: "Human support", desc: "Real people behind the platform, ready to help, never bots or scripts." },
  { title: "Student-first", desc: "Built for students, not commissions, treating you like an adult who deserves clarity." },
];

const TEAM: { name: string; role: string }[] = [
  { name: "Abderrahmane Almoustansir", role: "Founder" },
  { name: "Team member", role: "Student Success" },
  { name: "Team member", role: "Document Review" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ font: "700 24px/30px var(--font-sans)", color: "var(--ink)", margin: "0 0 10px", letterSpacing: "-0.01em" }}>{title}</h2>
      <div style={{ font: "400 15px/25px var(--font-sans)", color: "var(--ink-soft)" }}>{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />

      {/* Centered logo + wordmark */}
      <section style={{ padding: "40px 24px 8px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <LogoMark size={64} />
          <span style={{ font: "800 32px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.02em" }}>AfaqWay</span>
          <span style={{ font: "500 14px/20px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 460 }}>Built for students, not agencies.</span>
        </div>
      </section>

      <section style={{ padding: "16px 24px 72px" }}>
        <Container width={760}>
          <Block title="What AfaqWay does">
            AfaqWay is a personalized platform that guides non-EU students through every step of studying abroad. From your first profile to arrival, you get a personalized roadmap, human-reviewed documents, live deadline tracking, and real human support, all in one clear place.
          </Block>

          <Block title="The problem we solve">
            Study-abroad applications are usually scattered across emails, unclear requirements, and easy-to-miss deadlines, and the traditional alternative is an expensive agency that keeps you in the dark. AfaqWay centralizes the whole process into one clear, guided system, so you always know what is done, what is next, and what needs your attention.
          </Block>

          <Block title="How it works">
            It is simple: build your profile, receive your personalized roadmap, complete and upload your documents, have a real expert review them, track your deadlines and status live, and move step by step to accepted and departure-ready.
          </Block>

          <Block title="Who it's for">
            AfaqWay is for students applying to study abroad who want real structure and support, without the cost and opacity of a traditional agency.
          </Block>

          <Block title="Our story & mission">
            AfaqWay exists because studying abroad should not depend on who you know or how much you can pay an agency. We built it for students, not agencies, treating students like adults who deserve clarity, honest guidance, and fair pricing at every step.
          </Block>

          {/* Trust signals — reuse real homepage stats */}
          <Block title="Why students trust us">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 6 }}>
              {STATS.map((s) => (
                <div key={s.label} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "16px 18px" }}>
                  <div style={{ font: "700 28px/1 var(--font-sans)", color: "var(--indigo-600)", letterSpacing: "-0.01em" }}>{s.value}</div>
                  <div style={{ font: "600 13px/18px var(--font-sans)", color: "var(--ink)", marginTop: 8 }}>{s.label}</div>
                  <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 2 }}>{s.note}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 14 }}>Every document is reviewed by a real human expert, and a real support team, not bots, stands behind the platform.</p>
          </Block>

          {/* Team */}
          <Block title="Our team">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 6 }}>
              {TEAM.map((m, i) => (
                <div key={i} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: "20px 18px", textAlign: "center" }}>
                  <span style={{ width: 60, height: 60, borderRadius: 20, background: "linear-gradient(135deg,#3B5BDB,#845EF7)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", font: "800 24px/1 var(--font-sans)" }}>{m.name.charAt(0)}</span>
                  <div style={{ font: "600 14.5px/20px var(--font-sans)", color: "var(--ink)", marginTop: 12 }}>{m.name}</div>
                  <div style={{ font: "400 12.5px/17px var(--font-sans)", color: "var(--ink-soft)", marginTop: 2 }}>{m.role}</div>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 12, font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-faint)" }}>Full team bios coming soon.</p>
          </Block>

          {/* Values */}
          <Block title="Our values">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 6 }}>
              {VALUES.map((v) => (
                <div key={v.title} style={{ background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ font: "600 14.5px/20px var(--font-sans)", color: "var(--ink)" }}>{v.title}</div>
                  <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </Block>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 44 }}>
            <Link className="af-btn-primary" href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 50, padding: "0 28px", borderRadius: 999, font: "600 15px/1 var(--font-sans)" }}>
              Start your roadmap <IconArrow size={16} />
            </Link>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
