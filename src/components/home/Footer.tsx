import Link from "next/link";

// href for every footer link (all real routes now, no /soon placeholders)
const HREF: Record<string, string> = {
  Pricing: "/pricing", "How it works": "/how-it-works", Destinations: "/destinations",
  "About us": "/about", Contact: "/contact",
  Terms: "/terms", Privacy: "/privacy", Refunds: "/refund",
};
const COLS: { head: string; links: string[] }[] = [
  { head: "Platform", links: ["Pricing", "How it works", "Destinations"] },
  { head: "Company", links: ["About us", "Contact"] },
  { head: "Legal", links: ["Terms", "Privacy", "Refunds"] },
];

// TikTok URL is still a PLACEHOLDER — swap in the real handle when available.
const SOCIALS: { label: string; href: string; icon: React.ReactNode }[] = [
  { label: "Instagram", href: "https://www.instagram.com/afaqway.platform/", icon: <InstagramIcon /> },
  { label: "TikTok", href: "https://tiktok.com/@afaqway", icon: <TikTokIcon /> },
  { label: "WhatsApp", href: "https://wa.me/212632501155", icon: <WhatsAppIcon /> },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61588760870063", icon: <FacebookIcon /> },
];

const colHead = { font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase" as const, color: "var(--ink-faint)", marginBottom: 16 };
const colLink = { display: "block", font: "500 14px/20px var(--font-sans)", color: "var(--ink-soft)", marginTop: 10 };

function Social({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="af-navlink" style={{ color: "var(--ink-soft)", display: "inline-flex" }}>
      {children}
    </a>
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
              {SOCIALS.map((s) => (
                <Social key={s.label} label={s.label} href={s.href}>{s.icon}</Social>
              ))}
            </div>
          </div>
          {COLS.map((col) => (
            <div key={col.head}>
              <div style={colHead}>{col.head}</div>
              {col.links.map((l) => (
                <Link key={l} className="af-navlink" href={HREF[l] ?? "/soon"} style={colLink}>{l}</Link>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--line)", marginTop: 40, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ font: "400 13px/20px var(--font-sans)", color: "var(--ink-faint)" }}>
            © 2026 AfaqWay. Built for students, not agencies.
          </span>
        </div>
      </div>
    </footer>
  );
}

/* Brand glyphs (Lucide v1 dropped brand logos, so these are inline). */
function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5 3c.4 2.3 1.7 3.7 3.9 3.9v2.5c-1.3.1-2.5-.3-3.9-1.1v5.9c0 3.4-2.5 5.9-5.8 5.9-3 0-5.2-2.2-5.2-5.1 0-3.1 2.6-5.4 5.9-4.9v2.7c-.4-.1-.9-.2-1.3-.2-1.4 0-2.4 1-2.4 2.4 0 1.4 1 2.4 2.4 2.4 1.5 0 2.5-1.1 2.5-2.9V3h3.9z" />
    </svg>
  );
}
function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 20.5l1.3-4.2A8 8 0 1 1 8 19.4l-4.5 1.1z" />
      <path d="M9 9.2c.2-.6.4-.6.7-.6h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.5l-.5.6c-.1.1-.2.3-.1.5.3.6 1.3 1.7 2.3 2.1.2.1.4.1.5-.1l.5-.6c.2-.2.3-.2.5-.1l1.5.8c.2.1.3.2.3.4 0 .5-.4 1.3-.8 1.5-.5.3-1.4.5-3-.2-2-.9-3.3-3-3.5-3.3-.1-.2-.9-1.3-.9-2.4 0-1.1.6-1.6.8-1.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 8.5V7c0-.8.2-1.2 1.3-1.2h1.5V3h-2.4C11.7 3 11 4.4 11 6.6v1.9H9V11h2v10h3V11h2.2l.4-2.5H14z" />
    </svg>
  );
}
