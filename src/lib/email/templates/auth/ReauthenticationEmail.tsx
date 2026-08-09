import { Heading, Text, Section } from "@react-email/components";
import { Layout, Header, Footer, AlertBox } from "../../components";
import { emailColors, emailFont, emailRadius } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.reauthentication", version: 1, category: "auth" };

/** Supabase "Reauthentication" template — a step-up confirmation code, not
 *  a link. Not wired to any flow in the app today (no `reauthenticate`
 *  call anywhere), branded now for the same reason as Invite/MagicLink.
 *  `token` is Supabase's `{{ .Token }}`, a 6-digit one-time code the user
 *  types back into the app. */
export type ReauthenticationEmailProps = { token: string };

export default function ReauthenticationEmail({ token }: EmailTemplateProps<ReauthenticationEmailProps>) {
  return (
    <Layout preview={`Your AfaqWay confirmation code is ${token}.`}>
      <Header variant="dark" eyebrow="Confirmation code" />
      <div style={{ padding: "40px", textAlign: "center" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          Confirm it&rsquo;s you
        </Heading>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          Enter this code to confirm the action on your AfaqWay account.
        </Text>
        <Section
          style={{
            display: "inline-block",
            backgroundColor: emailColors.page,
            border: `1px solid ${emailColors.line}`,
            borderRadius: emailRadius.md,
            padding: "16px 32px",
            margin: "0 auto 24px",
          }}
        >
          <Text style={{ margin: 0, fontFamily: "monospace", fontSize: 30, fontWeight: 700, letterSpacing: "0.3em", color: emailColors.indigo600 }}>
            {token}
          </Text>
        </Section>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 13, color: emailColors.inkFaint }}>
          This code expires in 10 minutes.
        </Text>
        <AlertBox kind="warning">
          If you didn&rsquo;t request this code, secure your account by changing your password.
        </AlertBox>
      </div>
      <Footer />
    </Layout>
  );
}
