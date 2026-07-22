import { UserRound } from "lucide-react";

/* Avatar. Shows the user's uploaded photo when `src` is provided, otherwise a
   neutral generic silhouette (Facebook-style) on an AfaqWay-blue tint. Circular. */
export function DefaultAvatar({ size = 36, src }: { size?: number; src?: string | null }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: 999, flex: "none", objectFit: "cover", border: "1px solid rgba(43,76,155,.12)" }} />;
  }
  return (
    <span style={{ width: size, height: size, borderRadius: 999, flex: "none", background: "linear-gradient(180deg, #EEF2F9, #E1E8F3)", border: "1px solid rgba(43,76,155,.10)", color: "#93A2BA", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <UserRound size={Math.round(size * 0.56)} strokeWidth={2} />
    </span>
  );
}
