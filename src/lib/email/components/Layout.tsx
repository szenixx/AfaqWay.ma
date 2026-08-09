import { Body, Container, Head, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import { emailColors, emailFont, emailRadius, EMAIL_WIDTH } from "../tokens";
import type { Locale } from "../i18n/locales";
import { isRtl } from "../i18n/locales";

/** The outer shell every template renders into. Handles the page background,
 *  the 600px safe-width card, and the preheader text (the snippet clients
 *  show next to the subject line before the email is opened) — nothing else,
 *  so a template stays free to compose Header/Footer/content in whatever
 *  order it needs. */
export function Layout({ preview, locale = "en", children }: {
  preview: string;
  locale?: Locale;
  children: ReactNode;
}) {
  const rtl = isRtl(locale);
  return (
    <Html lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: emailColors.page, margin: 0, padding: "32px 12px", fontFamily: emailFont }}>
        <Container
          style={{
            maxWidth: EMAIL_WIDTH,
            margin: "0 auto",
            backgroundColor: emailColors.card,
            borderRadius: emailRadius.lg,
            overflow: "hidden",
            border: `1px solid ${emailColors.line}`,
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
