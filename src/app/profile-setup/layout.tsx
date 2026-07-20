import type { Viewport } from "next";

// Onboarding-only viewport: render 10% zoomed out so the whole step frame fits
// on phones, and LOCK zoom so the phone never auto-zooms (e.g. when typing in a
// field). Scoped to /profile-setup so marketing pages keep normal pinch-zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 0.9,
  maximumScale: 1,
  userScalable: false,
};

export default function ProfileSetupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
