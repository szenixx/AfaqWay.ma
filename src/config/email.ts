/* Email identity, in one place.
 *
 * Names, addresses and links only — never a credential. This file is imported
 * by both the browser and the server, so nothing secret may live here; the API
 * key stays in the provider module, which is server-only.
 *
 * Change a sender name or the support address here and every template follows. */

/** Which system an email belongs to. Each has its own sender and template. */
export type EmailChannel = "announcement" | "advisor";

export const EMAIL_BRAND = {
  website: "AfaqWay.com",
  websiteUrl: "https://afaqway.com",
  support: "Support@afaqway.com",
} as const;

/**
 * The two senders.
 *
 * Deliberately distinct: an announcement is the platform talking, an advisor
 * email is a person talking, and a student should be able to tell them apart in
 * a crowded inbox before opening either.
 *
 * Addresses may be pointed at different mailboxes with EMAIL_FROM_ANNOUNCEMENT
 * and EMAIL_FROM_ALERTS, which is useful when replies to each should land in
 * different inboxes. Both fall back to one verified sender, so the platform
 * works with a single mailbox configured. Whatever is used must be a sender
 * ZeptoMail has verified for the domain, or delivery is refused.
 */
const DEFAULT_FROM = process.env.NEXT_PUBLIC_EMAIL_FROM?.trim() || "noreply@afaqway.com";

export const EMAIL_SENDERS: Record<EmailChannel, { name: string; address: string }> = {
  announcement: {
    name: "AfaqWay Announcement",
    address: process.env.NEXT_PUBLIC_EMAIL_FROM_ANNOUNCEMENT?.trim() || DEFAULT_FROM,
  },
  advisor: {
    name: "AfaqWay Alerts",
    address: process.env.NEXT_PUBLIC_EMAIL_FROM_ALERTS?.trim() || DEFAULT_FROM,
  },
};

/** RFC 5322 "Name <address>", which is what every provider expects as `from`. */
export function senderFor(channel: EmailChannel): string {
  const { name, address } = EMAIL_SENDERS[channel];
  return `${name} <${address}>`;
}

/** Where replies should go. Support, not the unattended sending address. */
export const REPLY_TO = EMAIL_BRAND.support;
