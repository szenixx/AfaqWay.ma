import { Container, SectionHead, StatusCircle, IconRing, IconPlane, IconClock, IconCheck, type Tone } from "./ui";

const STEPS: { tone: Tone; icon: React.ReactNode; step: string; title: string; desc: string }[] = [
  { tone: "grey", icon: <IconRing />, step: "Step 01", title: "Build your profile", desc: "Tell us about your background, target country, and budget. Takes 5 minutes." },
  { tone: "indigo", icon: <IconPlane />, step: "Step 02", title: "Get your roadmap", desc: "A step-by-step plan built for your country, program, and intake date." },
  { tone: "amber", icon: <IconClock />, step: "Step 03", title: "Get your file ready", desc: "Complete each document with step-by-step guidance and expert checks along the way." },
  { tone: "green", icon: <IconCheck />, step: "Step 04", title: "Accepted & departure-ready", desc: "Admission letter, visa prep, and a post-arrival checklist, all covered." },
];

export default function HowItWorks() {
  return (
    <div style={{ background: "var(--card)", padding: "56px 24px" }}>
      <Container>
        <SectionHead eyebrow="How it works" title="Four steps. One clear path." />
        <div style={{ position: "relative", marginTop: 40 }}>
          {/* Animated dashed connector, shows the four steps are linked */}
          <div aria-hidden className="af-step-connector" style={{ position: "absolute", left: 0, right: 0, top: 24, height: 2, zIndex: 0 }}>
            <svg width="100%" height="2" style={{ display: "block", overflow: "visible" }}>
              <line x1="12%" y1="1" x2="88%" y2="1" stroke="var(--indigo-line)" strokeWidth="1.5" strokeDasharray="6 8" style={{ animation: "afDashFlow 1.1s linear infinite" }} />
            </svg>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <span style={{ display: "inline-flex", animation: "afPulseScale 2.6s ease-in-out infinite", animationDelay: `${i * 0.35}s` }}>
                  <StatusCircle size={48} tone={s.tone}>{s.icon}</StatusCircle>
                </span>
                <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)", marginTop: 16 }}>{s.step}</div>
                <div style={{ font: "600 17px/24px var(--font-sans)", color: "var(--ink)", marginTop: 8 }}>{s.title}</div>
                <div style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", marginTop: 8, maxWidth: 250 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
