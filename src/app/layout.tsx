import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
/* tailwind.css loads first on purpose: it only exists so the handful of
   installed shadcn/reui component primitives have utility classes and CSS
   variables to draw from. globals.css (the actual design system every page
   is built from) loads after it, so wherever a plain AfaqWay class and a
   Tailwind utility both target the same element, the design system always
   wins the cascade tie rather than the imported component's own theme. */
import "./tailwind.css";
import "./globals.css";
/* The dashboard's own sheet. Imported here rather than @import-ed from
   globals.css so Turbopack tracks it as its own entry and hot-reloads it. */
import "./dashboard.css";
/* The admin Overview's HeroUI theme + layout, scoped to `.afq-hui`. */
import "./admin-overview.css";
import "./admin-shared.css";
import "./admin-wallet.css";
import "./admin-paymethods.css";
import "./admin-management.css";
import "./admin-payment-reviews.css";
import "./admin-users.css";
/* The onboarding journey's own sheet, scoped to `.onb-root`. Separate from
   globals.css on purpose: /profile-setup is not built from the platform shell. */
import "./onboarding.css";
import { Geist, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
/* The one face on the platform that is not the system font, and it earns that
   by carrying exactly one thing: the "Most popular" mark on a plan. A wide
   grotesque holds its shape at badge size, where the body face turns to mush.
   One weight, nothing else uses it. */
const badge = Space_Grotesk({subsets:['latin'],weight:'700',variable:'--font-badge'});

const DESCRIPTION =
  "AfaqWay walks non-EU students through every step of the study-abroad journey, a personalized roadmap, human-reviewed documents, and a live tracker so nothing slips through the cracks.";

/* The favicon comes from the files beside this one — favicon.ico (16/32/48, the
   URL Google's crawler asks for), icon.png (512, for browsers and PWAs) and
   apple-icon.png (180, for iOS home screens). The App Router emits every
   <link rel="icon"> tag from those filenames, so there is no `icons` field
   here: declaring both would duplicate the tags.
   metadataBase makes the social URLs absolute, which crawlers require. */
export const metadata: Metadata = {
  metadataBase: new URL("https://afaqway.com"),
  title: "AfaqWay, Your path to studying abroad",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "AfaqWay",
    title: "AfaqWay, Your path to studying abroad",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/icon.png", width: 512, height: 512, alt: "AfaqWay" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, badge.variable)}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
