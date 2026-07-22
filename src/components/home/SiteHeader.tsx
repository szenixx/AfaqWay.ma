"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronRight } from "lucide-react";

const navLink = { font: "600 14px/20px var(--font-sans)" };
const MOBILE_LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Our service", href: "/our-service" },
  { label: "About us", href: "/about" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 24, position: "relative", zIndex: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: "var(--card)",
          border: "1px solid var(--line)",
          borderRadius: 999,
          boxShadow: "var(--shadow-card)",
          padding: "10px 20px",
          height: 64,
          boxSizing: "border-box",
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <svg width="34" height="34" viewBox="0 0 96 96" style={{ color: "var(--indigo-600)" }}>
            <g fill="none" stroke="currentColor" strokeWidth="13" strokeLinecap="square" strokeLinejoin="miter">
              <path d="M29 28 48 45 67 28" />
              <path d="M29 54 48 71 67 54" />
            </g>
          </svg>
          <span style={{ font: "700 22px/1 var(--font-sans)", color: "var(--ink)", letterSpacing: "-0.01em" }}>AfaqWay</span>
        </Link>

        {/* Desktop nav */}
        <div className="af-nav-desktop" style={{ alignItems: "center", gap: 28 }}>
          <nav style={{ display: "inline-flex", alignItems: "center", gap: 24 }}>
            <Link className="af-navlink" href="/our-service" style={navLink}>Our service</Link>
            <Link className="af-navlink" href="/about" style={navLink}>About us</Link>
          </nav>
          <Link className="af-btn-primary" href="/signup" style={{ display: "inline-flex", alignItems: "center", height: 36, padding: "0 18px", borderRadius: 999, font: "600 14px/1 var(--font-sans)" }}>
            Sign up
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="af-hamburger"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          style={{ background: "none", border: "none", padding: 6, margin: 0, cursor: "pointer", color: "var(--ink-soft)", alignItems: "center" }}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 15 }} aria-hidden />
          <div
            style={{
              position: "absolute",
              top: 96,
              left: "50%",
              transform: "translateX(-50%)",
              width: "min(360px, calc(100vw - 32px))",
              background: "var(--card)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              boxShadow: "0 10px 30px rgba(23,35,58,.12)",
              padding: "8px 16px 16px",
              zIndex: 20,
            }}
          >
            {MOBILE_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 48, borderBottom: "1px solid var(--line-soft)", font: "500 15px/22px var(--font-sans)", color: "var(--ink)" }}
              >
                {l.label}
                <ChevronRight size={16} color="var(--ink-faint)" />
              </Link>
            ))}
            <Link
              className="af-btn-primary"
              href="/signup"
              onClick={() => setOpen(false)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 12, marginTop: 12, font: "600 15px/1 var(--font-sans)" }}
            >
              Sign up
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
