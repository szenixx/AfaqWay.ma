"use client";

/* The official AfaqWay logo.

   Sourced from design/AfaqWay-Design-System/assets/brand and rendered to
   transparent PNGs in public/assets/brand, so the app never draws its own
   version of the mark.

   `glyph` is the bare chevrons, for places that supply their own frame, and is
   the default. `mark` is the full lockup: white chevrons on the indigo rounded
   square. `app` is the favicon artwork — the same mark with the app-icon
   treatment (blue gradient, soft depth) — for places that stand in for the
   product itself, like the advisor's avatar in chat.

   Deliberately a plain <img>, not next/image: this is a fixed-size static asset
   that must render on first paint in the sidebar, and going through the image
   optimizer adds a request that can fail and leave the header empty. */

const SRC = {
  mark: "/assets/brand/logo-mark.png",
  glyph: "/assets/brand/logo-glyph.png",
  app: "/assets/brand/logo-app.webp",
} as const;

export function BrandLogo({ variant = "glyph", size = 32, className, alt = "AfaqWay" }: {
  variant?: "mark" | "glyph" | "app";
  size?: number;
  className?: string;
  alt?: string;
}) {
  const src = SRC[variant] ?? SRC.glyph;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      decoding="async"
      style={{ display: "block", width: size, height: size, objectFit: "contain", flex: "none" }}
    />
  );
}

export default BrandLogo;
