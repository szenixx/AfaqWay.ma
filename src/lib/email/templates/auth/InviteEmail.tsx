import { Heading, Text } from "@react-email/components";
import { Layout, Header, Footer, Button } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.invite", version: 1, category: "auth" };

/** Supabase "Invite user" template. Not wired to any flow in the app today
 *  — admin creation writes directly to the `admins` table, not through
 *  Supabase Auth invites — but branded now for the same reason as
 *  MagicLinkEmail: the dashboard slot exists regardless of current usage.
 *  `confirmationUrl` is `{{ .ConfirmationURL }}`. */
export type InviteEmailProps = { confirmationUrl: string; inviterName?: string };

export default function InviteEmail({ confirmationUrl, inviterName }: EmailTemplateProps<InviteEmailProps>) {
  return (
    <Layout preview="You've been invited to AfaqWay.">
      <Header variant="dark" eyebrow="You're invited" />
      <div style={{ padding: "40px" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          You&rsquo;ve been invited to AfaqWay
        </Heading>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          {inviterName ? `${inviterName} has invited you to join AfaqWay.` : "You've been invited to join AfaqWay."} Accept below to set up your account.
        </Text>
        <Button href={confirmationUrl}>Accept invitation</Button>
        <Text style={{ margin: "24px 0 0", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          This invitation expires in 7 days.
        </Text>
      </div>
      <Footer />
    </Layout>
  );
}
