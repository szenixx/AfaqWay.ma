import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

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
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
