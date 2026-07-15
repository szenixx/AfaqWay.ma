import Link from "next/link";

export const metadata = {
  title: "Coming soon — AfaqWay",
};

export default function Soon() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24,
        gap: 16,
      }}
    >
      <span className="pill pill-indigo">Coming soon</span>
      <h1 style={{ font: "700 34px/42px var(--font-sans)", color: "var(--ink)", margin: 0 }}>
        This page isn&apos;t built yet
      </h1>
      <p style={{ font: "400 16px/28px var(--font-sans)", color: "var(--ink-soft)", maxWidth: 460, margin: 0 }}>
        We&apos;re building AfaqWay one step at a time. This part of the platform is on the way.
      </p>
      <Link
        className="af-btn-primary"
        href="/"
        style={{ display: "inline-flex", alignItems: "center", height: 48, padding: "0 26px", borderRadius: 999, font: "600 15px/1 var(--font-sans)", marginTop: 8 }}
      >
        Back to home
      </Link>
    </main>
  );
}
