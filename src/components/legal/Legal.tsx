import type { ReactNode } from "react";
import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";

/* Shared layout for legal documents (Terms, Refund Policy). Marketing chrome
   (SiteHeader + Footer), a readable prose column. */
export function LegalPage({ title, updated, intro, children }: { title: string; updated: string; intro?: string; children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)", display: "flex", flexDirection: "column" }}>
      <SiteHeader />
      <main style={{ flex: 1, width: "100%", maxWidth: 820, margin: "0 auto", padding: "28px 20px 64px" }}>
        <h1 style={{ font: "700 34px/42px var(--font-sans)", color: "var(--ink)", margin: 0, letterSpacing: "-0.01em" }}>{title}</h1>
        <p style={{ font: "400 13px/19px var(--font-sans)", color: "var(--ink-faint)", margin: "8px 0 0" }}>Last updated: {updated}</p>
        {intro && <p style={{ font: "400 15px/24px var(--font-sans)", color: "var(--ink-soft)", margin: "18px 0 0" }}>{intro}</p>}
        <div className="legal-prose" style={{ marginTop: 26 }}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ font: "600 18px/24px var(--font-sans)", color: "var(--ink)", margin: "0 0 10px" }}>{n}. {title}</h2>
      {children}
    </section>
  );
}
