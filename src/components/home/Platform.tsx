import Link from "next/link";
import { Container, SectionHead, IconCompass, IconDoc, IconTracker, IconCalendar, IconChat, IconSpark, IconArrow } from "./ui";

/* A neutral subset of what the platform does, full list lives on the service page. */
const FEATURES: { icon: React.ReactNode; title: string; desc: string }[] = [
  { icon: <IconCompass />, title: "Personalized Roadmap", desc: "A step-by-step plan tailored to your country, program level, and timeline." },
  { icon: <IconDoc />, title: "Document Review", desc: "Your key documents checked and refined so they are ready to submit." },
  { icon: <IconTracker />, title: "Live Progress Tracker", desc: "Every task shows one of five statuses, so you always know what is next." },
  { icon: <IconCalendar />, title: "Deadline Engine", desc: "Every deadline for your intake, tracked and surfaced before it matters." },
  { icon: <IconSpark />, title: "Our system is our power", desc: "The engine runs on real, up-to-date rules for every country, so it never forgets a step and never guesses. Your file is checked the same careful way, every single time." },
  { icon: <IconChat />, title: "Human support, anytime", desc: "When you want a person, real people back the system up. No bots, no scripts, just clear answers." },
];

export default function Platform() {
  return (
    <div style={{ background: "var(--card)", padding: "56px 24px" }}>
      <Container>
        <SectionHead eyebrow="The platform" title="Everything the agency does, for a fraction of the price." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14, marginTop: 32 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 12, padding: "16px 18px", boxSizing: "border-box" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--indigo-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-600)", flex: "none" }}>
                {f.icon}
              </div>
              <div>
                <div style={{ font: "600 15px/20px var(--font-sans)", color: "var(--ink)" }}>{f.title}</div>
                <div style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)", marginTop: 3 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <Link className="af-btn-ghost" href="/our-service" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 22px", borderRadius: 999, border: "1.5px solid var(--indigo-600)", color: "var(--indigo-600)", font: "600 14px/1 var(--font-sans)", boxSizing: "border-box" }}>
            See more about our services
            <IconArrow size={16} />
          </Link>
        </div>
      </Container>
    </div>
  );
}
