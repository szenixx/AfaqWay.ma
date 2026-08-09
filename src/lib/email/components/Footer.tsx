import { Hr, Link, Section, Text } from "@react-email/components";
import { emailColors, emailFont } from "../tokens";
import { EMAIL_BRAND } from "../senders";
import { getDictionary, type Locale } from "../i18n/locales";
import { SocialLinks } from "./SocialLinks";

const linkStyle = { color: emailColors.inkSoft, textDecoration: "none", fontSize: 12.5, fontFamily: emailFont };

/** `unsubscribeUrl` is optional and deliberately not defaulted to anything —
 *  there is no working unsubscribe/preferences flow in the app yet, and per
 *  the project rule against dead links, the line simply doesn't render until
 *  a real one exists. Pass it once that flow ships (needed for any
 *  notification-category send, not transactional auth/receipt mail). */
export function Footer({ locale = "en", unsubscribeUrl }: { locale?: Locale; unsubscribeUrl?: string }) {
  const t = getDictionary(locale);
  const year = new Date().getFullYear();
  return (
    <Section style={{ backgroundColor: emailColors.footerBg, padding: "24px 32px 28px", textAlign: "center" }}>
      <Text style={{ margin: "0 0 10px", fontFamily: emailFont, fontSize: 14, fontWeight: 700, color: emailColors.indigo600 }}>
        {t.footerPlatform}
      </Text>

      <Text style={{ margin: "0 0 12px" }}>
        <Link href={`${EMAIL_BRAND.websiteUrl}/contact`} style={linkStyle}>{t.footerSupport}</Link>
        <span style={{ color: emailColors.line }}> &middot; </span>
        <Link href={`${EMAIL_BRAND.websiteUrl}/privacy`} style={linkStyle}>{t.footerPrivacy}</Link>
        <span style={{ color: emailColors.line }}> &middot; </span>
        <Link href={`${EMAIL_BRAND.websiteUrl}/terms`} style={linkStyle}>{t.footerTerms}</Link>
      </Text>

      <SocialLinks />

      <Hr style={{ borderColor: emailColors.lineSoft, margin: "16px 0" }} />

      <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 11.5, color: emailColors.inkFaint }}>
        &copy; {year} {t.footerPlatform}. {t.footerRights}
      </Text>
      {unsubscribeUrl && (
        <Text style={{ margin: "4px 0 0", fontFamily: emailFont, fontSize: 11.5, color: emailColors.inkFaint }}>
          <Link href={unsubscribeUrl} style={{ color: emailColors.inkFaint, textDecoration: "underline" }}>
            Unsubscribe
          </Link>
        </Text>
      )}
    </Section>
  );
}
