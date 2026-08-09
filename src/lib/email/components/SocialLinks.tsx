import { Link, Text } from "@react-email/components";
import { emailColors, emailFont } from "../tokens";
import { EMAIL_BRAND } from "../senders";

/* Real accounts, taken from the live site footer (src/components/home/Footer.tsx)
 * — not invented for email. Icon images/SVGs are deliberately skipped: Outlook's
 * Word rendering engine doesn't support SVG, and there's no raster icon set in
 * the design system to fall back to, so plain text links are the reliable choice
 * across clients. */
const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/afaqway.platform/" },
  { label: "TikTok", href: "https://tiktok.com/@afaqway" },
  { label: "WhatsApp", href: "https://wa.me/212632501155" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61588760870063" },
] as const;

export function SocialLinks() {
  return (
    <Text style={{ margin: 0, fontFamily: emailFont, fontSize: 12.5, color: emailColors.inkFaint }}>
      {SOCIALS.map((s, i) => (
        <span key={s.label}>
          {i > 0 && <span style={{ color: emailColors.line }}> &middot; </span>}
          <Link href={s.href} style={{ color: emailColors.inkSoft, textDecoration: "none" }}>
            {s.label}
          </Link>
        </span>
      ))}
      <span style={{ color: emailColors.line }}> &middot; </span>
      <Link href={EMAIL_BRAND.websiteUrl} style={{ color: emailColors.inkSoft, textDecoration: "none" }}>
        {EMAIL_BRAND.website}
      </Link>
    </Text>
  );
}
