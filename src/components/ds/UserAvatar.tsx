"use client";

import { memo, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { BadgeCheck } from "lucide-react";
import { avatarConfig, seedFromId, styleForGender, type Gender } from "@/lib/avatarIdentity";

/* The platform's only avatar component.

   Priority: uploaded photo → generated avatar. The generated face is produced
   by @avatune/react from the user's stored seed, so it is identical every time
   and is never regenerated on render. */

// The renderer and its theme are loaded lazily: they never enter the initial bundle.
const Avatar = dynamic(() => import("@avatune/react").then((m) => m.Avatar), {
  ssr: false,
  loading: () => <span className="ua-skeleton" aria-hidden />,
});

export type UserAvatarUser = {
  id?: string | null;
  /** Uploaded photo. When present it always wins. */
  avatarUrl?: string | null;
  gender?: Gender | string | null;
  avatarSeed?: string | null;
  avatarStyle?: string | null;
  name?: string | null;
  online?: boolean;
  verified?: boolean;
};

export type UserAvatarProps = {
  /** 24 · 32 · 40 · 48 · 56 · 64 · 96 · 128 · 160 */
  size?: 24 | 32 | 40 | 48 | 56 | 64 | 96 | 128 | 160 | number;
  user?: UserAvatarUser | null;
  className?: string;
  showStatus?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
};

function UserAvatarBase({ size = 40, user, className, showStatus, clickable, onClick, style }: UserAvatarProps) {
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const seed = user?.avatarSeed || seedFromId(user?.id || user?.name || "afaqway");
  const styleName = user?.avatarStyle || styleForGender((user?.gender as Gender) ?? "prefer_not_to_say");
  // Generated once per identity, then reused: never recomputed on a rerender.
  const config = useMemo(() => avatarConfig(seed, styleName), [seed, styleName]);

  const uploaded = user?.avatarUrl && !broken;
  const badge = Math.max(14, Math.round(size * 0.34));

  const inner = uploaded ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user!.avatarUrl as string} alt="User Avatar" width={size} height={size} loading="lazy"
      className={`ua-img${loaded ? " in" : ""}`} style={{ width: size, height: size }}
      onLoad={() => setLoaded(true)} onError={() => setBroken(true)}
    />
  ) : (
    <span className="ua-gen in" style={{ width: size, height: size }}>
      <GeneratedFace size={size} config={config} />
    </span>
  );

  const content = (
    <span className={`ua${clickable ? " ua-click" : ""}${className ? " " + className : ""}`} style={{ width: size, height: size, ...style }}>
      {inner}
      {showStatus && <span className={`ua-status${user?.online ? " online" : ""}`} title={user?.online ? "Online" : "Offline"} />}
      {user?.verified && (
        <span className="ua-verified" title="Active subscription" style={{ width: badge, height: badge, right: Math.round(-badge * 0.08), bottom: Math.round(-badge * 0.04) }}>
          <BadgeCheck size={badge} strokeWidth={2.2} fill="var(--indigo-600)" color="var(--card)" />
        </span>
      )}
    </span>
  );

  if (!clickable) return content;
  return (
    <button type="button" className="ua-btn" onClick={onClick} aria-label={user?.name ? `${user.name} profile` : "User Avatar"}>
      {content}
    </button>
  );
}

/* Kept separate so the memoised config is the only thing the renderer sees. */
function GeneratedFace({ size, config }: { size: number; config: Record<string, unknown> }) {
  const [theme, setTheme] = useState<unknown>(null);
  useMemo(() => { void import("@avatune/yanliu-theme/react").then((m) => setTheme(m.default)); }, []);
  if (!theme) return <span className="ua-skeleton" aria-hidden />;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const A = Avatar as any;
  return <A theme={theme} size={size} {...config} />;
}

export const UserAvatar = memo(UserAvatarBase);
export default UserAvatar;
