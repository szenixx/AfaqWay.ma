import type { Viewport } from "next";

/* The journey is composed at real scale on a phone — nothing is shrunk to fit —
   so it takes the plain viewport, and pinch-zoom stays available (locking it is
   an accessibility trap for anyone who needs to magnify a line of text).
   /profile-setup/classic overrides this with its own zoomed-out viewport. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function ProfileSetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
