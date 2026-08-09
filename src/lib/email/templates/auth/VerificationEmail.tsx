import { Heading, Text } from "@react-email/components";
import { Layout, Header, Footer, Button, AlertBox } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.verification", version: 1, category: "auth" };

/** Supabase "Confirm signup" template. `confirmationUrl` is Supabase's own
 *  `{{ .ConfirmationURL }}` — already carries the token and redirect, this
 *  component only renders it, never constructs it. */
export type VerificationEmailProps = { confirmationUrl: string };

export default function VerificationEmail({ confirmationUrl }: EmailTemplateProps<VerificationEmailProps>) {
  return (
    <Layout preview="Confirm your email address to activate your AfaqWay account.">
      <Header variant="dark" eyebrow="Email verification" />
      <div style={{ padding: "40px" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          Verify your email address
        </Heading>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          Welcome to AfaqWay. You&rsquo;re one step away from starting your study-abroad journey, confirm this is really you by verifying your email address below.
        </Text>
        <Button href={confirmationUrl}>Verify email address</Button>
        <Text style={{ margin: "24px 0 0", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          This link expires in 24 hours.
        </Text>
        <AlertBox kind="info">
          If you didn&rsquo;t create an AfaqWay account, you can safely ignore this email, no account will be created.
        </AlertBox>
      </div>
      <Footer />
    </Layout>
  );
}
