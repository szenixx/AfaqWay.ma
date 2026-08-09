import type { ReactElement } from "react";
import type { SenderId } from "./senders";
import type { Locale } from "./i18n/locales";

/** What every template must ultimately resolve to before it can be sent
 *  or logged. Mirrors the old services/email/templates.ts shape (subject,
 *  html, text) so nothing about the send path had to change, just how
 *  these three strings get produced. */
export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

/** Attached to every template component so email_log can record which
 *  template + version actually produced a given send, and so a template
 *  can be revised without breaking whatever already shipped referencing
 *  the old copy/layout. Bump `version` whenever a template's rendered
 *  output changes in a way worth distinguishing in the log. */
export type TemplateMeta = {
  id: string;
  version: number;
  category: "auth" | "advisor" | "admin" | "notifications" | "billing";
};

export type EmailCategory = TemplateMeta["category"];

/** Input to the send service. `react` is rendered to html+text internally;
 *  pass `html`/`text` directly only for the rare case of no React template
 *  (e.g. a pre-rendered Supabase auth template body). */
export type SendEmailInput = {
  to: string | string[];
  sender: SenderId;
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  replyTo?: string;
  template?: TemplateMeta;
  locale?: Locale;
  /** Resend "tags" — surfaced back on webhook events for correlation. */
  tags?: Record<string, string>;
};

export type SendEmailResult =
  | { status: "sent"; id: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

/** Every template component takes its own typed props plus this — locale
 *  is threaded through explicitly rather than read from context, since
 *  templates render server-side with no request-scoped provider tree. */
export type EmailTemplateProps<T> = T & { locale?: Locale };
