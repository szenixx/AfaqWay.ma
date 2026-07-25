import { UserRound, BadgeCheck } from "lucide-react";

/* Avatar. Shows the user's uploaded photo when `src` is provided, otherwise a
   neutral generic silhouette (Facebook-style) on an AfaqWay-blue tint. Circular.
   `verified` overlays the paid-subscription badge on the bottom-right edge, so
   it never covers the subject of the picture. */
export function DefaultAvatar({ size = 36, src, verified }: { size?: number; src?: string | null; verified?: boolean }) {
  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: 999, flex: "none", objectFit: "cover", border: "1px solid rgba(43,76,155,.12)", display: "block" }} />
  ) : (
    <span style={{ width: size, height: size, borderRadius: 999, flex: "none", background: "linear-gradient(180deg, #EEF2F9, #E1E8F3)", border: "1px solid rgba(43,76,155,.10)", color: "#93A2BA", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <UserRound size={Math.round(size * 0.56)} strokeWidth={2} />
    </span>
  );

  if (!verified) return inner;

  // Badge scales with the avatar and sits on the lower-right edge.
  const badge = Math.max(14, Math.round(size * 0.34));
  return (
    <span style={{ position: "relative", display: "inline-flex", flex: "none", width: size, height: size }}>
      {inner}
      <span
        title="Active subscription"
        style={{
          position: "absolute", right: Math.round(-badge * 0.08), bottom: Math.round(-badge * 0.04),
          width: badge, height: badge, borderRadius: 999, background: "var(--card)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 6px rgba(23,35,58,.18)",
        }}
      >
        <BadgeCheck size={badge} strokeWidth={2.2} fill="var(--indigo-600)" color="var(--card)" />
      </span>
    </span>
  );
}
