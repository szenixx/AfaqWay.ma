import { Heading, Text } from "@react-email/components";
import { Layout, Header, Footer, Button, AlertBox } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.reset-password", version: 1, category: "auth" };

/** Supabase "Reset Password" template. `confirmationUrl` is Supabase's
 *  `{{ .ConfirmationURL }}`, already carrying the recovery token. */
export type ResetPasswordEmailProps = { confirmationUrl: string };

export default function ResetPasswordEmail({ confirmationUrl }: EmailTemplateProps<ResetPasswordEmailProps>) {
  return (
    <Layout preview="Reset your AfaqWay password.">
      <Header variant="dark" eyebrow="Password reset" />
      <div style={{ padding: "40px" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          Reset your password
        </Heading>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          We received a request to reset the password on your AfaqWay account. Choose a new password below.
        </Text>
        <Button href={confirmationUrl}>Reset password</Button>
        <Text style={{ margin: "24px 0 0", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          This link expires in 60 minutes.
        </Text>
        <AlertBox kind="warning">
          If you didn&rsquo;t request a password reset, you can safely ignore this email, your password will not change.
        </AlertBox>
      </div>
      <Footer />
    </Layout>
  );
}
