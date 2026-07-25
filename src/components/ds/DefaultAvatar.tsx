"use client";

import { UserAvatar, type UserAvatarUser } from "./UserAvatar";

/* Compatibility wrapper: existing call sites keep working while every avatar on
   the platform renders through the single UserAvatar component (uploaded photo
   → generated avatar). New code should use UserAvatar directly. */
export function DefaultAvatar({ size = 36, src, verified, user }: {
  size?: number; src?: string | null; verified?: boolean; user?: UserAvatarUser | null;
}) {
  return <UserAvatar size={size} user={{ ...(user ?? {}), avatarUrl: src ?? user?.avatarUrl ?? null, verified }} />;
}
