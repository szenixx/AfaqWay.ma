"use client";

import { memo } from "react";
import { findUniversity, type University } from "@/lib/universities";
import { logoPath } from "@/lib/universityAssets";

/* University branding, everywhere on the platform.

   The logo comes from the files supplied under
   public/assets/universities/<slug>/, resolved through the static manifest, so
   lookups are instant and the component never waits on the network. Until a
   file is supplied it shows a quiet loading surface — never a stand-in mark. */

export type UniversityBrandProps = {
  /** University name from the data (profile, catalogue, card…). */
  name?: string | null;
  /** Or pass a resolved university directly. */
  university?: University | null;
  size?: number;
  /** `tile` draws the framed square used in cards; `bare` is the logo alone. */
  variant?: "tile" | "bare";
  /** Light treatment for dark surfaces. */
  onDark?: boolean;
  className?: string;
};

function UniversityBrandBase({ name, university, size = 44, variant = "tile", onDark, className }: UniversityBrandProps) {
  const uni = university ?? findUniversity(name);
  const src = logoPath(uni?.slug, onDark);
  const radius = variant === "tile" ? Math.round(size * 0.3) : 0;

  const frame: React.CSSProperties = {
    width: size, height: size, borderRadius: radius, flex: "none",
    display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    background: variant === "tile" ? (onDark ? "rgba(255,255,255,.92)" : "var(--card)") : "transparent",
    border: variant === "tile" ? `1px solid ${onDark ? "rgba(255,255,255,.5)" : "var(--line)"}` : "none",
    boxShadow: variant === "tile" ? "0 2px 8px rgba(23,35,58,.06)" : "none",
  };

  return (
    <span className={`ub${className ? " " + className : ""}`} style={frame} title={uni?.name ?? name ?? undefined}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src} alt={`${uni?.name ?? "University"} logo`} loading="lazy" decoding="async"
          width={Math.round(size * 0.82)} height={Math.round(size * 0.82)}
          onLoad={(e) => e.currentTarget.classList.add("in")}
          className="ub-img"
          style={{ width: Math.round(size * 0.82), height: Math.round(size * 0.82), objectFit: "contain" }}
        />
      ) : (
        /* No file supplied for this university yet. */
        <span className="ua-skeleton" aria-hidden />
      )}
    </span>
  );
}

export const UniversityBrand = memo(UniversityBrandBase);
export default UniversityBrand;
