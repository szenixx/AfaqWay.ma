import { Button as EmailButton } from "@react-email/components";
import { emailColors, emailFont, emailRadius } from "../tokens";

/** The one CTA button style every template uses. `secondary` matches the
 *  app's outline-button treatment for a lower-emphasis action in the same
 *  email (e.g. "View in app" next to a primary "Verify email"). */
export function Button({ href, children, variant = "primary" }: {
  href: string;
  children: string;
  variant?: "primary" | "secondary";
}) {
  const primary = variant === "primary";
  return (
    <EmailButton
      href={href}
      style={{
        display: "inline-block",
        padding: "12px 28px",
        borderRadius: emailRadius.sm,
        fontFamily: emailFont,
        fontSize: 14.5,
        fontWeight: 700,
        textDecoration: "none",
        backgroundColor: primary ? emailColors.indigo600 : emailColors.card,
        color: primary ? "#FFFFFF" : emailColors.indigo600,
        border: primary ? "none" : `1px solid ${emailColors.indigoLine}`,
      }}
    >
      {children}
    </EmailButton>
  );
}
