import Link from "next/link";
import { Container, SectionHead, Flag } from "./ui";
import { DESTINATIONS as DESTS } from "@/lib/destinations";

export default function Destinations() {
  return (
    <div style={{ padding: "56px 24px" }}>
      <Container width={1280}>
        <SectionHead
          eyebrow="Destinations"
          title="Where our students land"
          sub="Lithuania is open today. More destinations unlock soon."
        />
        <div className="af-dest-grid" style={{ marginTop: 32 }}>
          {DESTS.map((d) => (
            <div key={d.name} style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow-card)", padding: 18, display: "flex", flexDirection: "column", gap: 10, boxSizing: "border-box" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Flag country={d.name} open={d.open} />
                <span style={{ font: "600 18px/24px var(--font-sans)", color: d.open ? "var(--ink)" : "var(--ink-soft)", flex: 1 }}>{d.name}</span>
                {d.open ? <span className="pill pill-green">Available now</span> : <span className="pill pill-grey">Coming soon</span>}
              </div>
              {d.open && (
                <div style={{ font: "600 11.5px/16px var(--font-sans)", color: "var(--green)" }}>
                  Academic study, Bachelor &amp; Master degrees
                </div>
              )}
              {d.open && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, font: "500 12px/17px var(--font-sans)", color: "var(--ink-soft)", flexWrap: "wrap" }}>
                  <span>{d.universities}</span>
                  <span style={{ color: "var(--ink-faint)" }}>·</span>
                  <span>{d.tuition}</span>
                  <span style={{ color: "var(--ink-faint)" }}>·</span>
                  <span>{d.intakes}</span>
                </div>
              )}
              <Link href="/destinations" style={{ font: "600 13px/20px var(--font-sans)", color: "var(--indigo-600)" }}>
                Explore {d.name} →
              </Link>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
