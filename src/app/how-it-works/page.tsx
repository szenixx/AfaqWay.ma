import Link from "next/link";
import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";
import {
  Container, SectionHead, StatusCircle, type Tone,
  IconCompass, IconDoc, IconTracker, IconCalendar, IconCheck, IconClock, IconChat, IconPlane, IconRing, IconArrow,
} from "@/components/home/ui";

export const metadata = {
  title: "How it works — AfaqWay",
  description: "The full AfaqWay journey, from creating your account to landing on campus: profile, roadmap, documents, human review, tracking, admission, visa, and arrival.",
};

const STEPS: { tone: Tone; icon: React.ReactNode; n: string; title: string; desc: string }[] = [
  { tone: "grey", icon: <IconRing />, n: "01", title: "Sign up & create your account", desc: "Create your free AfaqWay account in a minute. This is your home base for everything that follows, no scattered emails or spreadsheets." },
  { tone: "grey", icon: <IconCompass />, n: "02", title: "Build your profile", desc: "Tell us about your academic background, your target country, your budget, and your timeline. This is what makes everything after it personal to you." },
  { tone: "indigo", icon: <IconPlane />, n: "03", title: "Receive your personalized roadmap", desc: "We turn your profile into a step-by-step plan built for your country, program level, and intake, ordered so you always know exactly what to do next." },
  { tone: "indigo", icon: <IconDoc />, n: "04", title: "Upload & complete your documents", desc: "Work through each document with guided steps, clear requirements, and templates, so nothing is missing and nothing is in the wrong format." },
  { tone: "amber", icon: <IconClock />, n: "05", title: "Human expert review", desc: "A real reviewer checks each document you upload, catching mistakes before they ever reach a university or embassy, usually within about 48 hours." },
  { tone: "amber", icon: <IconTracker />, n: "06", title: "Track deadlines & status live", desc: "Your live tracker shows every task with a clear status, done, under review, needs changes, and surfaces every deadline before it matters." },
  { tone: "green", icon: <IconCheck />, n: "07", title: "Admission received", desc: "With a complete, checked application submitted on time, you receive your admission decision and move on to the next stage with confidence." },
  { tone: "green", icon: <IconCalendar />, n: "08", title: "Visa preparation & appointment", desc: "We guide your visa file, help you prepare for the appointment, and make sure the right documents are ready in the right order." },
  { tone: "green", icon: <IconChat />, n: "09", title: "Post-arrival & departure-ready", desc: "A post-arrival checklist covers the practical steps once you land, so you arrive organized and ready to start your studies." },
];

export default function HowItWorksPage() {
  return (
    <main>
      <SiteHeader />

      <section style={{ padding: "48px 24px 8px" }}>
        <Container width={860}>
          <SectionHead eyebrow="How it works" title="From sign up to campus, one clear path" sub="Every step of your study-abroad journey, guided and in order. Here is exactly what happens from the moment you create your account to the day you arrive." />
        </Container>
      </section>

      <section style={{ padding: "40px 24px 72px" }}>
        <Container width={780}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 18, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-card)", padding: "20px 22px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
                  <StatusCircle size={48} tone={s.tone}>{s.icon}</StatusCircle>
                  {i < STEPS.length - 1 && <span style={{ width: 2, flex: 1, minHeight: 14, background: "var(--line)", marginTop: 6 }} />}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Step {s.n}</div>
                  <div style={{ font: "600 18px/24px var(--font-sans)", color: "var(--ink)", marginTop: 5 }}>{s.title}</div>
                  <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "6px 0 0" }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", marginTop: 34 }}>
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
