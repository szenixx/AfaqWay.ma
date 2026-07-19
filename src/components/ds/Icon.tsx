import type { CSSProperties } from "react";

/* Ported verbatim from design/AfaqWay-Design-System/components/icons/Icon.jsx,
   plus two new outline glyphs approved for the auth page: eye / eye-off.
   All glyphs are outline, 1.75px stroke (1.5px < 16px), rounded caps. */
const P: Record<string, string> = {
  "status-not-started": '<circle cx="10" cy="10" r="7"/>',
  "status-applied": '<path d="M17.5 2.5 2 9.6l6 2.3 2.3 6L17.5 2.5Z"/><path d="M10.3 11.9 13.7 8.5"/>',
  "status-under-review": '<circle cx="10" cy="10" r="7"/><path d="M10 6.5v3.7l2.6 1.7"/>',
  "status-needs-changes": '<circle cx="10" cy="10" r="7"/><path d="M10 6.7v4M10 13.6h.01"/>',
  "status-approved": '<circle cx="10" cy="10" r="7"/><path d="M7 10.3 9.2 12.5 13.3 7.8"/>',
  document: '<path d="M6 2.5h6l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z"/><path d="M12 2.5V6h3.5"/>',
  upload: '<path d="M10 13V4M6.5 7.5 10 4l3.5 3.5"/><path d="M4 14v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2"/>',
  passport: '<rect x="5" y="2.5" width="10" height="15" rx="2"/><circle cx="10" cy="8" r="2"/><path d="M8 13h4"/>',
  diploma: '<path d="M2 8l8-4 8 4-8 4-8-4Z"/><path d="M6 10v4c0 1 1.8 2 4 2s4-1 4-2v-4"/>',
  calendar: '<rect x="3" y="4" width="14" height="13" rx="2"/><path d="M3 8h14M7 2.5v3M13 2.5v3"/><circle cx="10" cy="12.5" r="1.3"/>',
  chat: '<path d="M3 4.5h14v9H8l-4 3.5v-3.5H3Z"/>',
  phone: '<path d="M4 3.5c0-.6.4-1 1-1h2.3c.5 0 .9.3 1 .8l.7 2.6c.1.4 0 .8-.3 1.1L7.4 8.3a11 11 0 0 0 4.3 4.3l1.3-1.3c.3-.3.7-.4 1.1-.3l2.6.7c.5.1.8.5.8 1V15c0 .6-.4 1-1 1h-1C9.8 16 4 10.2 4 4.5Z"/>',
  email: '<rect x="2.5" y="4.5" width="15" height="11" rx="1.5"/><path d="M3 5.5 10 11l7-5.5"/>',
  payment: '<rect x="2.5" y="5" width="15" height="10" rx="2"/><path d="M2.5 8.5h15"/>',
  search: '<circle cx="9" cy="9" r="6"/><path d="M17.5 17.5 14 14"/>',
  bell: '<path d="M10 2.5a5 5 0 0 0-5 5v3l-1.5 3h13L15 10.5v-3a5 5 0 0 0-5-5Z"/><path d="M8 16.5a2 2 0 0 0 4 0"/>',
  settings: '<circle cx="10" cy="10" r="2.6"/><path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.4 4.6l-1.4 1.4M6 12.6l-1.4 1.4M15.4 15.4l-1.4-1.4M6 7.4 4.6 6"/>',
  "chevron-down": '<path d="M5 8l5 5 5-5"/>',
  logout: '<path d="M8 3H4.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H8M12 6l4 4-4 4M16 10H8"/>',
  // --- new (approved for auth page) ---
  eye: '<path d="M10 4.5c-4.6 0-7.5 5.5-7.5 5.5s2.9 5.5 7.5 5.5 7.5-5.5 7.5-5.5-2.9-5.5-7.5-5.5Z"/><circle cx="10" cy="10" r="2.5"/>',
  "eye-off": '<path d="M10 4.5c-4.6 0-7.5 5.5-7.5 5.5a13.4 13.4 0 0 0 2.1 2.6M7.1 14.8c.9.4 1.9.7 2.9.7 4.6 0 7.5-5.5 7.5-5.5a13.4 13.4 0 0 0-1.7-2.3"/><path d="M8.2 8.2a2.5 2.5 0 0 0 3.6 3.6"/><path d="M4 4l12 12"/>',
  // --- new (approved for profile-setup: bare check for the stepper) ---
  check: '<path d="M4.5 10.5 8.5 14.5 15.5 6"/>',
};

export const ICON_NAMES = Object.keys(P);
export type IconName = keyof typeof P;

export function Icon({ name, size = 20, color, style }: { name: string; size?: number; color?: string; style?: CSSProperties }) {
  const body = P[name] || "";
  const sw = size < 16 ? 1.5 : 1.75;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color, flex: "none", ...style }}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
}
