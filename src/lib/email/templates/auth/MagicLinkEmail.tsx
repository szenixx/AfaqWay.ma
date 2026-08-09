import { Heading, Text } from "@react-email/components";
import { Layout, Header, Footer, Button, AlertBox } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.magic-link", version: 1, category: "auth" };

/** Supabase "Magic Link" template. Not wired to any sign-in flow in the app
 *  today — no page calls `signInWithOtp` — but the Supabase dashboard has a
 *  fixed slot for it regardless, so it's built and branded now rather than
 *  left showing Supabase's default unbranded email if the flow is enabled
 *  later. `confirmationUrl` is `{{ .ConfirmationURL }}`. */
export type MagicLinkEmailProps = { confirmationUrl: string };

export default function MagicLinkEmail({ confirmationUrl }: EmailTemplateProps<MagicLinkEmailProps>) {
  return (
    <Layout preview="Your AfaqWay sign-in link.">
      <Header variant="dark" eyebrow="Sign-in link" />
      <div style={{ padding: "40px" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          Sign in to AfaqWay
        </Heading>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          Click below to sign in, no password needed.
        </Text>
        <Button href={confirmationUrl}>Sign in</Button>
        <Text style={{ margin: "24px 0 0", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          This link expires in 60 minutes and can only be used once.
        </Text>
        <AlertBox kind="info">
          If you didn&rsquo;t request this link, you can safely ignore this email.
        </AlertBox>
      </div>
      <Footer />
    </Layout>
  );
}
