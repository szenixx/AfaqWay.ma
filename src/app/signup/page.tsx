import Link from "next/link";

export const metadata = { title: "Get started — AfaqWay" };

export default function SignupGate() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32, textAlign: "center" }}>
        <svg width="48" height="48" viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }}>
          <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M29 28 48 45 67 28" />
            <path d="M29 54 48 71 67 54" />
          </g>
        </svg>
        <h1 style={{ font: "700 24px/32px var(--font-sans)", color: "var(--ink)", margin: "16px 0 0" }}>Get started with AfaqWay</h1>
        <p style={{ font: "400 14px/22px var(--font-sans)", color: "var(--ink-soft)", margin: "8px 0 24px" }}>
          Create your account or log in to continue your roadmap.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link className="af-btn-primary" href="/soon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 999, font: "600 15px/1 var(--font-sans)" }}>
            Create an account
          </Link>
          <Link className="af-btn-ghost" href="/soon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, borderRadius: 999, border: "1.5px solid var(--indigo-600)", color: "var(--indigo-600)", font: "600 15px/1 var(--font-sans)", boxSizing: "border-box" }}>
            Log in
          </Link>
        </div>
        <Link href="/" style={{ display: "inline-block", marginTop: 20, font: "500 13px/20px var(--font-sans)", color: "var(--ink-faint)" }}>
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
