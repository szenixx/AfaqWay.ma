import Link from "next/link";
import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";
import { Container, SectionHead, Flag, IconArrow } from "@/components/home/ui";
import { DESTINATIONS } from "@/lib/destinations";

export const metadata = {
  title: "Destinations — AfaqWay",
  description: "Study-abroad destinations on AfaqWay: degree levels, universities, tuition and intakes for each country.",
};

export default function DestinationsPage() {
  return (
    <main>
      <SiteHeader />
      <section style={{ padding: "48px 24px 8px" }}>
        <Container width={1080}>
          <SectionHead eyebrow="Destinations" title="Where our students land" sub="Lithuania is open today, with more European destinations unlocking soon. Each country uses the same guided AfaqWay process." />
        </Container>
      </section>

      <section style={{ padding: "24px 24px 72px" }}>
        <Container width={1080}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {DESTINATIONS.map((d) => (
              <div key={d.code} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 18, boxShadow: "var(--shadow-card)", padding: "24px 26px", opacity: d.open ? 1 : 0.92 }}>
                <div className="af-two-col" style={{ gap: 24, alignItems: "flex-start" }}>
                  {/* Left: identity + facts */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <Flag country={d.name} open={d.open} />
                      <span style={{ font: "700 24px/30px var(--font-sans)", color: d.open ? "var(--ink)" : "var(--ink-soft)" }}>{d.name}</span>
                      {d.open ? <span className="pill pill-green">Available now</span> : <span className="pill pill-grey">Coming soon</span>}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
                      {d.degrees.map((deg) => (
                        <span key={deg} className="pill pill-indigo">{deg}</span>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0, marginTop: 18, border: "1px solid var(--line-soft)", borderRadius: 12, overflow: "hidden" }}>
                      {[["Universities", d.universities], ["Tuition", d.tuition], ["Intakes", d.intakes]].map(([k, v], i) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "11px 14px", background: i % 2 ? "var(--subtle)" : "transparent", font: "500 13px/18px var(--font-sans)", color: "var(--ink)" }}>
                          <span style={{ color: "var(--ink-soft)" }}>{k}</span><b>{v}</b>
                        </div>
                      ))}
                    </div>
                    {d.open && (
                      <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 16, font: "600 13.5px/20px var(--font-sans)", color: "var(--indigo-600)" }}>
                        Start your {d.name} roadmap <IconArrow size={15} />
                      </Link>
                    )}
                  </div>

                  {/* Right: descriptive paragraphs */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Para heading="What is it?" text={d.whatIs} />
                    <Para heading="Why this country?" text={d.whyCountry} />
                    <Para heading="Why students choose it" text={d.whyStudents} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Footer />
    </main>
  );
}

function Para({ heading, text }: { heading: string; text: string }) {
  return (
    <div>
      <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--indigo-600)" }}>{heading}</div>
      <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "5px 0 0" }}>{text}</p>
    </div>
  );
}
