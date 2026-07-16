"use client";

import { useState } from "react";

const LANGS = [
  { code: "EN", label: "English", flag: "🇬🇧" },
  { code: "FR", label: "Français", flag: "🇫🇷" },
  { code: "AR", label: "العربية", flag: "🇲🇦" },
];

/* Visual language switcher (real i18n wiring comes later).
   variant "pill" = footer dropdown · variant "list" = row of flags for the mobile menu. */
export default function LanguageSwitcher({ variant = "pill" }: { variant?: "pill" | "list" }) {
  const [lang, setLang] = useState("EN");
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang)!;

  if (variant === "list") {
    return (
      <div style={{ display: "flex", gap: 8 }}>
        {LANGS.map((l) => {
          const active = l.code === lang;
          return (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 40,
                borderRadius: 10,
                cursor: "pointer",
                background: active ? "var(--indigo-100)" : "var(--card)",
                border: `1px solid ${active ? "var(--indigo-line)" : "var(--line)"}`,
                color: active ? "var(--indigo-600)" : "var(--ink)",
                font: "600 13px/1 var(--font-sans)",
              }}
            >
              <span style={{ fontSize: 15 }}>{l.flag}</span>
              {l.code}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px", cursor: "pointer" }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span style={{ font: "600 12px/16px var(--font-sans)", color: "var(--ink)" }}>{current.code}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--ink-faint)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l5 5 5-5" /></svg>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 25 }} aria-hidden />
          <div style={{ position: "absolute", bottom: "calc(100% + 8px)", right: 0, background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 10px 30px rgba(23,35,58,.14)", padding: 6, minWidth: 170, zIndex: 30 }}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: l.code === lang ? "var(--indigo-100)" : "transparent", border: "none", font: "500 13px/18px var(--font-sans)", color: "var(--ink)", textAlign: "left" }}
              >
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
