import Link from "next/link";

export default function FinalCta() {
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--indigo-600)", padding: "88px 24px", textAlign: "center" }}>
      {/* Hero-style backdrop, blue theme */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/hero-ambient.png)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12, mixBlendMode: "overlay", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,.10) 1.1px, transparent 1.1px)", backgroundSize: "22px 22px", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 780, margin: "0 auto" }}>
        <h2 style={{ font: "700 var(--font-sans)", fontSize: "clamp(28px, 4vw, 42px)", lineHeight: 1.2, color: "#fff", margin: 0 }}>
          {"Your future doesn’t wait. Start today."}
        </h2>
        <p style={{ font: "400 17px/28px var(--font-sans)", color: "var(--indigo-100)", margin: "16px 0 0" }}>
          Build your profile in five minutes and get a roadmap tailored to your goal.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
          <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 999, background: "#fff", color: "var(--indigo-600)", font: "600 15px/1 var(--font-sans)" }}>
            Start your roadmap
          </Link>
          <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 999, border: "1.5px solid rgba(255,255,255,.6)", color: "#fff", font: "600 15px/1 var(--font-sans)", boxSizing: "border-box" }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
