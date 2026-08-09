import { Heading, Text } from "@react-email/components";
import { Layout, Header, Footer, Button } from "../../components";
import { emailColors, emailFont } from "../../tokens";
import { EMAIL_BRAND } from "../../senders";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "auth.welcome", version: 1, category: "auth" };

/** Not a Supabase dashboard template — sent by our own app code right after
 *  a student's account is confirmed, so it's a real, already-existing
 *  trigger point rather than a speculative one. Copy adapted from the
 *  handoff folder's welcome.html. */
export type WelcomeEmailProps = { studentName: string };

export default function WelcomeEmail({ studentName }: EmailTemplateProps<WelcomeEmailProps>) {
  return (
    <Layout preview="Your AfaqWay account is verified and ready.">
      <Header variant="dark" tagline="Your journey to studying abroad, guided." />
      <div style={{ padding: "40px" }}>
        <Heading style={{ margin: "0 0 14px", fontFamily: emailFont, fontSize: 26, lineHeight: "34px", fontWeight: 700, color: emailColors.ink }}>
          Welcome to AfaqWay, {studentName}
        </Heading>
        <Text style={{ margin: "0 0 24px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.inkSoft }}>
          Your account is verified and ready. AfaqWay guides you step by step, from choosing a university to holding a visa in your hand, with a clear roadmap, human-reviewed documents, and a real advisor behind every step.
        </Text>
        <Button href={EMAIL_BRAND.websiteUrl}>Go to your workspace</Button>
      </div>
      <Footer />
    </Layout>
  );
}
