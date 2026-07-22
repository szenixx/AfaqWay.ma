import SiteHeader from "@/components/home/SiteHeader";
import Footer from "@/components/home/Footer";
import { Container, IconChat } from "@/components/home/ui";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Contact — AfaqWay",
  description: "Get in touch with AfaqWay by email or WhatsApp.",
};

// NOTE: WhatsApp number below is a PLACEHOLDER — swap in the real number.
const WHATSAPP_URL = "https://wa.me/212600000000";

export default function ContactPage() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--paper)" }}>
      <SiteHeader />
      <section style={{ flex: 1, padding: "48px 24px 72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Container width={520}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: 20, boxShadow: "var(--shadow-card)", padding: "36px 32px", textAlign: "center" }}>
            <div style={{ font: "600 10.5px/14px var(--font-sans)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--indigo-600)" }}>Contact</div>
            <h1 style={{ font: "800 var(--font-sans)", fontSize: "clamp(26px, 4vw, 34px)", lineHeight: 1.15, color: "var(--ink)", margin: "10px 0 0" }}>Get in touch</h1>
            <p style={{ font: "400 15px/23px var(--font-sans)", color: "var(--ink-soft)", margin: "10px 0 0" }}>Reach us by email or WhatsApp and we&apos;ll help you out.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26 }}>
              <a href="mailto:support@afaqway.com" className="af-btn-primary" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 50, borderRadius: 14, font: "600 15px/1 var(--font-sans)" }}>
                <Mail size={18} /> support@afaqway.com
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, height: 50, borderRadius: 14, background: "#25D366", color: "#fff", font: "600 15px/1 var(--font-sans)" }}>
                <IconChat size={18} /> Message us on WhatsApp
              </a>
            </div>

            <p style={{ font: "500 13.5px/20px var(--font-sans)", color: "var(--ink)", marginTop: 22 }}>We&apos;ll get back to you as soon as possible.</p>
            <p style={{ font: "400 12.5px/18px var(--font-sans)", color: "var(--ink-faint)", marginTop: 8 }}>
              Tip: most of what you need is already on the website, our services, pricing, destinations, and how it works are all explained there, so it&apos;s worth a look first.
            </p>
          </div>
        </Container>
      </section>
      <Footer />
    </main>
  );
}
