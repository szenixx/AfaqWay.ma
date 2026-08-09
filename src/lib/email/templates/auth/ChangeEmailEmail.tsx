import { Heading, Text } from "@react-email/components";
import { Layout, Header, Footer, Button, AlertBox, InformationCard } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.change-email", version: 1, category: "auth" };

/** Supabase "Change Email Address" template — the one the user specifically
 *  called out by name. `confirmationUrl` is `{{ .ConfirmationURL }}`;
 *  `oldEmail`/`newEmail` are `{{ .Email }}` / `{{ .NewEmail }}`. */
export type ChangeEmailEmailProps = { confirmationUrl: string; oldEmail: string; newEmail: string };

export default function ChangeEmailEmail({ confirmationUrl, oldEmail, newEmail }: EmailTemplateProps<ChangeEmailEmailProps>) {
  return (
    <Layout preview="Confirm your new email address for AfaqWay.">
      <Header variant="dark" eyebrow="Email change" />
      <div style={{ padding: "40px" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          Confirm your new email address
        </Heading>
        <Text style={{ margin: "0 0 20px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          You asked to change the email address on your AfaqWay account. Confirm below to finish the change.
        </Text>
        <InformationCard rows={[{ label: "Current email", value: oldEmail }, { label: "New email", value: newEmail }]} />
        <div style={{ marginTop: 20 }}>
          <Button href={confirmationUrl}>Confirm new email</Button>
        </div>
        <Text style={{ margin: "24px 0 0", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          This link expires in 24 hours.
        </Text>
        <AlertBox kind="warning">
          If you didn&rsquo;t request this change, secure your account by resetting your password and contacting support right away.
        </AlertBox>
      </div>
      <Footer />
    </Layout>
  );
}
