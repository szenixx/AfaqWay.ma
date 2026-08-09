import { Text } from "@react-email/components";
import { Layout, Header, Footer } from "../../components";
import { Paragraphs } from "../../utils/paragraphs";
import { emailColors, emailFont } from "../../tokens";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "advisor.message", version: 1, category: "advisor" };

/** Direct React Email replacement for the old services/email/templates.ts
 *  `advisorEmail()` — sent when an admin emails a student from AdminChat.
 *  Same greeting + message + signature shape, branded shell instead of
 *  the old unstyled one. */
export type AdvisorMessageEmailProps = { message: string; recipientName?: string | null };

export default function AdvisorMessageEmail({ message, recipientName }: EmailTemplateProps<AdvisorMessageEmailProps>) {
  const name = (recipientName ?? "").trim();
  const greeting = name ? `Hello, ${name}` : "Hello";

  return (
    <Layout preview={message.trim().slice(0, 140)}>
      <Header variant="light" />
      <div style={{ padding: "40px" }}>
        <Text style={{ margin: "0 0 16px", fontFamily: emailFont, fontSize: 15, lineHeight: "24px", color: emailColors.ink }}>
          {greeting}
        </Text>
        <Paragraphs>{message}</Paragraphs>
        <Text style={{ margin: "24px 0 0", fontFamily: emailFont, fontSize: 14, fontWeight: 600, color: emailColors.inkSoft }}>
          By AfaqWay Advisor.
        </Text>
      </div>
      <Footer />
    </Layout>
  );
}
