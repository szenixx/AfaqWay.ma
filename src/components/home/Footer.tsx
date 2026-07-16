import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

const COLS: { head: string; links: string[] }[] = [
  { head: "Platform", links: ["Pricing", "How it works", "Destinations", "Templates", "FAQ"] },
  { head: "Company", links: ["About us", "Blog", "Careers", "Contact", "Press"] },
  { head: "Legal", links: ["Terms", "Privacy", "Cookies", "Refunds"] },
];

const colHead = { font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--ink-faint)", marginBottom: 16 };
const colLink = { display: "block", font: "500 14px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 10 };

function Social({ children }: { children: React.ReactNode }) {
  return (
    <Link href="/soon" className="af-navlink" style={{ color: "var(--ink-soft)", display: "inline-flex" }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </Link>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: "var(--subtle)", borderTop: "1px solid var(--line)", padding: "64px 24px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="af-footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <svg width="24" height="24" viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }}>
                <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M29 28 48 45 67 28" />
                  <path d="M29 54 48 71 67 54" />
                </g>
              </svg>
              <span style={{ font: "700 22px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.01em" }}>AfaqWay</span>
            </div>
            <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 300, marginTop: 12 }}>
              The study-abroad platform that treats students like adults.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <Social><path d="M4 4l12 12M16 4L4 16" /></Social>
              <Social><rect x="3" y="3" width="14" height="14" rx="4" /><circle cx="10" cy="10" r="3.4" /><circle cx="14.3" cy="5.7" r="0.4" fill="currentColor" /></Social>
              <Social><rect x="3" y="3" width="14" height="14" rx="2" /><path d="M6 8.5V14M6 6.2v.2M9.5 14v-3a1.5 1.5 0 0 1 3 0v3" /></Social>
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.head}>
              <div style={colHead}>{col.head}</div>
              {col.links.map((l) => (
                <Link key={l} className="af-navlink" href="/soon" style={colLink}>{l}</Link>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 40, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-faint)" }}>
            © 2026 AfaqWay. Built for students, not agencies.
          </span>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
