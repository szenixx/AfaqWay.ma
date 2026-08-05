"use client";

import { memo, useState, type CSSProperties } from "react";
import { BadgeCheck, User } from "lucide-react";
import type { Gender } from "@/lib/avatarIdentity";

/* The platform's only avatar component.

   Priority: uploaded photo → default person silhouette. Nobody without a
   photo gets a generated face; they get the same neutral placeholder, same
   as Facebook's fallback avatar. */

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
      <User size={Math.round(size * 0.56)} strokeWidth={1.75} color="var(--neutral-300)" aria-hidden />
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

export const UserAvatar = memo(UserAvatarBase);
export default UserAvatar;
