import { Layout, Header, Footer } from "../../components";
import { Paragraphs } from "../../utils/paragraphs";
import type { EmailTemplateProps, TemplateMeta } from "../../types";

export const meta: TemplateMeta = { id: "notifications.announcement", version: 1, category: "notifications" };

/** Direct React Email replacement for the old services/email/templates.ts
 *  `announcementEmail()` — same "the message is the email" philosophy
 *  (src/lib/notifications.ts publishUpdate() → journey decisions, document
 *  requests, payment updates, maintenance notices), now with the shared
 *  brand shell instead of an unstyled `shell()` string. */
export type AnnouncementEmailProps = { message: string };

export default function AnnouncementEmail({ message }: EmailTemplateProps<AnnouncementEmailProps>) {
  return (
    <Layout preview={message.trim().slice(0, 140)}>
      <Header variant="light" />
      <div style={{ padding: "40px" }}>
        <Paragraphs>{message}</Paragraphs>
      </div>
      <Footer />
    </Layout>
  );
}
