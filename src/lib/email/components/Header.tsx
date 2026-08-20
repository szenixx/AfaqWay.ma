import { Img, Section, Text } from "@react-email/components";
import { emailColors, emailFont } from "../tokens";
import { EMAIL_BRAND } from "../senders";

const LOGO_URL = `${EMAIL_BRAND.websiteUrl}/assets/brand/logo-mark.png`;

/** The one brand header every template opens with. `dark` is the indigo
 *  banner variant (auth flows, anything that wants weight up top); `light`
 *  is the quiet variant for routine notifications. `eyebrow` is the small
 *  uppercase label some auth emails carry ("EMAIL VERIFICATION"). */
export function Header({ variant = "light", eyebrow, tagline }: {
  variant?: "light" | "dark";
  eyebrow?: string;
  tagline?: string;
}) {
  const dark = variant === "dark";
  return (
    <Section
      style={{
        backgroundColor: dark ? emailColors.indigo600 : emailColors.greyTint,
        padding: "28px 32px",
        textAlign: "center",
      }}
    >
      <Img src={LOGO_URL} width={40} height={40} alt="AfaqWay" style={{ margin: "0 auto 12px" }} />
      {eyebrow && (
        <Text
          style={{
            margin: 0,
            fontFamily: emailFont,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: dark ? "#B3B8ED" : emailColors.inkFaint,
          }}
        >
          {eyebrow}
        </Text>
      )}
      {tagline && (
        <Text
          style={{
            margin: "4px 0 0",
            fontFamily: emailFont,
            fontSize: 14,
            fontWeight: 500,
            color: dark ? "#FFFFFF" : emailColors.inkSoft,
          }}
        >
          {tagline}
        </Text>
      )}
    </Section>
  );
}
