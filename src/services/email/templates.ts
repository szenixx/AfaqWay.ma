import { EMAIL_BRAND, type EmailChannel } from "@/config/email";

/* Email templates.
 *
 * Pure functions: content in, { subject, text, html } out. No network, no
 * database, no secrets, so a template can be rendered in a test or a script
 * without sending anything.
 *
 * Both templates are deliberately plain. No banner, no image, no card, no
 * colour, no button. A notification is read in two seconds on a phone, and
 * decoration only delays the sentence that matters. The HTML exists solely so
 * the text wraps and spaces properly in clients that ignore plain text.
 *
 * To add a template: add a builder below and a case in `renderEmail`. Nothing
 * else in the system needs to change. */

export type EmailContent = { subject: string; text: string; html: string };

/** Escapes anything that came from a human before it enters the HTML part. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Turns plain text into paragraphs, preserving the author's line breaks. */
function paragraphs(body: string): string {
  return body
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 16px">${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/* One typographic shell for both templates: a readable column, system fonts so
   nothing has to load, and no styling beyond that. */
const shell = (inner: string) => `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff">
<div style="max-width:560px;margin:0 auto;font:400 15px/24px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#17233A">
${inner}
</div></body></html>`;

const linkStyle = "color:#2755DF;text-decoration:none";

/* ── Platform announcement ─────────────────────────────────────────────────
   Sent by the platform itself: journey decisions, document requests, payment
   updates, maintenance, announcements. The body is the message and nothing
   else, then the signature block. */

export function announcementEmail(input: { subject: string; message: string }): EmailContent {
  const text = [
    input.message.trim(),
    "",
    "—",
    "AfaqWay",
    "",
    EMAIL_BRAND.website,
    EMAIL_BRAND.support,
  ].join("\n");

  const html = shell(`
${paragraphs(input.message.trim())}
<p style="margin:32px 0 0;color:#5A6B85">—</p>
<p style="margin:8px 0 0">AfaqWay</p>
<p style="margin:16px 0 0">
  <a href="${EMAIL_BRAND.websiteUrl}" style="${linkStyle}">${EMAIL_BRAND.website}</a><br>
  <a href="mailto:${EMAIL_BRAND.support}" style="${linkStyle}">${EMAIL_BRAND.support}</a>
</p>`);

  return { subject: input.subject, text, html };
}

/* ── Advisor message ───────────────────────────────────────────────────────
   Sent when an administrator emails a student from the chat. Addressed to the
   person, signed by the advisor, and nothing in between. */

export function advisorEmail(input: { subject: string; message: string; recipientName?: string | null }): EmailContent {
  const name = (input.recipientName ?? "").trim();
  const greeting = name ? `Hello, ${name}` : "Hello";

  const text = [
    greeting,
    "",
    input.message.trim(),
    "",
    "By AfaqWay Advisor.",
    "",
    EMAIL_BRAND.website,
    EMAIL_BRAND.support,
  ].join("\n");

  const html = shell(`
<p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
${paragraphs(input.message.trim())}
<p style="margin:24px 0 0">By AfaqWay Advisor.</p>
<p style="margin:16px 0 0">
  <a href="${EMAIL_BRAND.websiteUrl}" style="${linkStyle}">${EMAIL_BRAND.website}</a><br>
  <a href="mailto:${EMAIL_BRAND.support}" style="${linkStyle}">${EMAIL_BRAND.support}</a>
</p>`);

  return { subject: input.subject, text, html };
}

/** Renders the template that belongs to a channel. */
export function renderEmail(
  channel: EmailChannel,
  input: { subject: string; message: string; recipientName?: string | null },
): EmailContent {
  return channel === "advisor" ? advisorEmail(input) : announcementEmail(input);
}
