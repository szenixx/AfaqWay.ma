import { Container, SectionHead, IconCompass, IconDoc, IconTracker, IconCalendar, IconChat, IconVideo } from "./ui";

const FEATURES: { icon: React.ReactNode; title: string; desc: string }[] = [
  { icon: <IconCompass />, title: "Personalized Roadmap", desc: "A step-by-step plan tailored to your country, program level, and timeline." },
  { icon: <IconDoc />, title: "Human Document Review", desc: "A real expert checks every upload and tells you exactly what to fix." },
  { icon: <IconTracker />, title: "Live Progress Tracker", desc: "Every task shows one of five statuses — you always know what is next." },
  { icon: <IconCalendar />, title: "Deadline Engine", desc: "Every deadline for your intake, tracked and surfaced before it matters." },
  { icon: <IconChat />, title: "24/7 Support", desc: "Real people on the platform, ready when you need a hand — not a bot." },
  { icon: <IconVideo />, title: "Interview Prep Videos", desc: "Guided videos that get you ready for your visa and admission interviews." },
];

export default function Platform() {
  return (
    <div style={{ background: "var(--card)", padding: "56px 24px" }}>
      <Container>
        <SectionHead eyebrow="The platform" title="Everything the agency does — done for a fraction of the price." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 20, marginTop: 32 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 12, padding: 24, minHeight: 180, boxSizing: "border-box" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--indigo-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-600)" }}>
                {f.icon}
              </div>
              <div style={{ font: "600 16px/22px var(--font-sans)", color: "var(--ink)", marginTop: 16 }}>{f.title}</div>
              <div style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", marginTop: 8 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
