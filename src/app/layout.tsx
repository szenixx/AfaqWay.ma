import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AfaqWay, Your path to studying abroad",
  description:
    "AfaqWay walks non-EU students through every step of the study-abroad journey, a personalized roadmap, human-reviewed documents, and a live tracker so nothing slips through the cracks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
