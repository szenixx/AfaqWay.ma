import Link from "next/link";
import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";
import {
  Container, SectionHead, StatusCircle,
  IconCompass, IconDoc, IconTracker, IconCalendar, IconChat, IconSpark,
  IconCheck, IconClock, IconArrow,
} from "@/components/home/ui";

export const metadata = {
  title: "Our service, AfaqWay",
  description: "What AfaqWay does for students: a personalized roadmap, human-reviewed documents, a live tracker, transparent pricing, and real human support.",
};

const WHY_US: { icon: React.ReactNode; title: string; desc: string }[] = [
  { icon: <IconCompass />, title: "Personalized roadmap", desc: "A step-by-step plan built around your country, program level, budget and timeline, not a generic checklist. Every task is ordered so you always know exactly what comes next." },
  { icon: <IconDoc />, title: "Human-reviewed documents", desc: "A real reviewer checks every document you upload, not a bot. We catch formatting, translation and content issues before they reach an embassy or university, usually within 48 hours." },
  { icon: <IconTracker />, title: "Live progress tracker", desc: "Every step shows one of five clear statuses, so you always know what is done, what is under review, and what needs your attention. No more wondering where things stand." },
  { icon: <IconSpark />, title: "Transparent pricing", desc: "One clear price, shown up front, with no hidden fees and no commission games. You see exactly what you pay and exactly what you get before you commit to anything." },
  { icon: <IconCalendar />, title: "Deadline engine", desc: "Every deadline for your intake is tracked and surfaced before it matters, so a missed date never quietly ends your application." },
  { icon: <IconChat />, title: "24/7 real human support", desc: "When you want a person, real people back the system up, any time. No bots, no scripts, just clear answers from people who know your file." },
];

const AGENCY_ROWS: { label: string; agency: string; afaq: string }[] = [
  { label: "Cost", agency: "€2,000–5,000+, often with hidden commissions", afaq: "One transparent flat price, shown up front" },
  { label: "Transparency", agency: "You rarely see what is happening with your file", afaq: "Full visibility on every step, in real time" },
  { label: "Response time", agency: "Days of waiting on email or phone calls", afaq: "24/7 access with real human support" },
  { label: "Tracking", agency: "No live tracking, you chase them for updates", afaq: "Live tracker with five clear statuses" },
  { label: "Advice", agency: "Generic, one-size-fits-all templates", afaq: "A roadmap personalized to your exact profile" },
];

const DIY_RISKS: { icon: React.ReactNode; title: string; desc: string }[] = [
  { icon: <IconCalendar />, title: "Missed deadlines", desc: "Each intake has strict, moving dates across universities, visas and migration offices. Miss one and you can lose an entire semester." },
  { icon: <IconDoc />, title: "Document mistakes", desc: "One wrong translation, format or missing stamp is enough for a rejection, and you often only find out weeks later." },
  { icon: <IconClock />, title: "Visa rejections", desc: "Small, avoidable errors in a visa file cost months of delay and non-refundable fees, and sometimes a second attempt entirely." },
  { icon: <IconCompass />, title: "Outdated rules", desc: "Country requirements change often. Forums and old blog posts are frequently wrong, and following them quietly puts your application at risk." },
];

const sectionPad = { padding: "72px 24px" };

export default function OurService() {
  return (
    <main>
      <SiteHeader />

      {/* Hero / intro */}
      <section style={{ padding: "56px 24px 8px" }}>
        <Container width={1080}>
          <div className="af-two-col" style={{ alignItems: "center" }}>
            <div>
              <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--indigo-600)" }}>Our service</div>
              <h1 style={{ font: "800 var(--font-sans)", fontSize: "clamp(30px, 5vw, 50px)", lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--ink)", margin: "14px 0 0" }}>
                Everything you need to study abroad, in one guided place.
              </h1>
              <p style={{ font: "400 16px/27px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 520, margin: "18px 0 0" }}>
                AfaqWay turns a confusing, stressful process into one clear, guided plan. From your first profile to the day you land on campus, you get a personalized roadmap, human-reviewed documents, a live progress tracker, and real people ready to help, all in one place and at a fraction of what an agency charges.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                <Link className="af-btn-primary" href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 999, font: "600 15px/1 var(--font-sans)" }}>
                  Start your roadmap
                </Link>
                <Link className="af-btn-ghost" href="/how-it-works" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 24px", borderRadius: 999, border: "1.5px solid var(--indigo-600)", color: "var(--indigo-600)", font: "600 15px/1 var(--font-sans)", boxSizing: "border-box" }}>
                  See how it works
                  <IconArrow size={16} />
                </Link>
              </div>
            </div>

            {/* Supporting visual — a mini live tracker */}
            <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "var(--shadow-card)", padding: "22px 24px" }}>
              <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-faint)" }}>Your journey</div>
              {[
                { tone: "green" as const, icon: <IconCheck size={15} />, label: "Passport", status: "Approved", color: "var(--green)" },
                { tone: "green" as const, icon: <IconCheck size={15} />, label: "Motivation letter", status: "Approved", color: "var(--green)" },
                { tone: "amber" as const, icon: <IconClock size={15} />, label: "Translated diploma", status: "Under review", color: "var(--amber)" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, marginTop: i === 0 ? 16 : 12, paddingTop: i === 0 ? 0 : 12, borderTop: i === 0 ? "none" : "1px solid var(--line-soft)" }}>
                  <StatusCircle size={28} tone={r.tone}>{r.icon}</StatusCircle>
                  <span style={{ font: "500 13.5px/18px var(--font-sans)", color: "var(--ink)", flex: 1 }}>{r.label}</span>
                  <span style={{ font: "600 11.5px/14px var(--font-sans)", color: r.color }}>{r.status}</span>
                </div>
              ))}
              <div style={{ height: 6, borderRadius: 999, background: "var(--grey-tint)", marginTop: 18, overflow: "hidden" }}>
                <div style={{ width: "62%", height: "100%", borderRadius: 999, background: "var(--indigo-600)" }} />
              </div>
              <div style={{ font: "400 11.5px/16px var(--font-sans)", color: "var(--ink-faint)", marginTop: 7 }}>8 of 13 steps done</div>
            </div>
          </div>
        </Container>
      </section>

      {/* Why us */}
      <section style={{ ...sectionPad, background: "var(--card)" }}>
        <Container>
          <SectionHead eyebrow="Why AfaqWay" title="What makes us different" sub="The same outcome an expensive agency promises, delivered with more clarity, more control, and a real human whenever you need one." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14, marginTop: 34 }}>
            {WHY_US.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 14, padding: "18px 20px", boxSizing: "border-box" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--indigo-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--indigo-600)", flex: "none" }}>{f.icon}</div>
                <div>
                  <div style={{ font: "600 15.5px/21px var(--font-sans)", color: "var(--ink)" }}>{f.title}</div>
                  <div style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why not agencies */}
      <section style={sectionPad}>
        <Container width={980}>
          <SectionHead eyebrow="Why not an agency" title="Built for students, not commissions" sub="Traditional study-abroad agencies cost more and tell you less. Here is the honest comparison." />
          <div style={{ marginTop: 34, border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", background: "var(--card)", boxShadow: "var(--shadow-card)" }}>
            <div className="af-compare-head" style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr 1.4fr", background: "var(--subtle)", borderBottom: "1px solid var(--line)" }}>
              <div style={{ padding: "14px 18px", font: "600 12px/16px var(--font-sans)", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: ".06em" }}>&nbsp;</div>
              <div style={{ padding: "14px 18px", font: "600 13px/18px var(--font-sans)", color: "var(--ink-soft)" }}>Traditional agency</div>
              <div style={{ padding: "14px 18px", font: "700 13px/18px var(--font-sans)", color: "var(--indigo-600)", background: "var(--indigo-tint)" }}>AfaqWay</div>
            </div>
            {AGENCY_ROWS.map((r, i) => (
              <div key={r.label} className="af-compare-row" style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr 1.4fr", borderBottom: i < AGENCY_ROWS.length - 1 ? "1px solid var(--line-soft)" : "none" }}>
                <div style={{ padding: "16px 18px", font: "600 13.5px/19px var(--font-sans)", color: "var(--ink)" }}>{r.label}</div>
                <div style={{ padding: "16px 18px", display: "flex", gap: 9, font: "400 13px/19px var(--font-sans)", color: "var(--ink-soft)" }}>
                  <StatusCircle size={22} tone="red"><XGlyph /></StatusCircle>{r.agency}
                </div>
                <div style={{ padding: "16px 18px", display: "flex", gap: 9, font: "500 13px/19px var(--font-sans)", color: "var(--ink)", background: "rgba(43,76,155,.035)" }}>
                  <StatusCircle size={22} tone="green"><IconCheck size={13} /></StatusCircle>{r.afaq}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why not do it yourself */}
      <section style={{ ...sectionPad, background: "var(--card)" }}>
        <Container>
          <SectionHead eyebrow="Why not go alone" title="Going it alone is where most applications break" sub="Doing everything yourself is possible, but the process is unforgiving. A single missed step can cost a whole year." />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14, marginTop: 34 }}>
            {DIY_RISKS.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: "var(--subtle)", border: "1px solid var(--line-soft)", borderRadius: 14, padding: "18px 20px", boxSizing: "border-box" }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: "var(--red-tint)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--red)", flex: "none" }}>{f.icon}</div>
                <div>
                  <div style={{ font: "600 15.5px/21px var(--font-sans)", color: "var(--ink)" }}>{f.title}</div>
                  <div style={{ font: "400 13.5px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 4 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ font: "400 15px/24px var(--font-sans)", color: "var(--ink-soft)", textAlign: "center", maxWidth: 640, margin: "28px auto 0" }}>
            AfaqWay keeps the control in your hands, but never leaves you guessing. You do the work that matters, and we make sure nothing important slips.
          </p>
        </Container>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 24px" }}>
        <Container width={760}>
          <div style={{ background: "linear-gradient(135deg, var(--indigo-600), #4263C7)", borderRadius: 22, padding: "48px 32px", textAlign: "center", boxShadow: "0 20px 50px rgba(43,76,155,.28)" }}>
            <h2 style={{ font: "800 var(--font-sans)", fontSize: "clamp(26px, 3.4vw, 36px)", lineHeight: 1.2, color: "#fff", margin: 0 }}>Ready to start your roadmap?</h2>
            <p style={{ font: "400 15px/24px var(--font-sans)", color: "rgba(255,255,255,.9)", maxWidth: 480, margin: "14px auto 0" }}>
              Build your profile, see your personalized plan, and take the first guided step toward your European campus.
            </p>
            <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 50, padding: "0 30px", borderRadius: 999, background: "#fff", color: "var(--indigo-600)", font: "700 15px/1 var(--font-sans)", marginTop: 26 }}>
              Start your roadmap
              <IconArrow size={16} />
            </Link>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

function XGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l8 8M14 6l-8 8" />
    </svg>
  );
}
