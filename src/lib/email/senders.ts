/* The platform's sender identities.
 *
 * Names and addresses only — never a credential, so this file is safe to
 * import from both the browser and the server. Every address below must be
 * a verified sender on the active Resend domain, or delivery is refused.
 *
 * Real mailbox vs. alias: only "advisor" and "support" are expected to
 * receive replies from a real person. The other five are transactional —
 * their reply-to still routes to "support" so a reply is never dropped, but
 * nothing about sending them requires a real inbox to exist. */

export type SenderId =
  | "noreply" | "notifications" | "advisor" | "support"
  | "billing" | "security" | "admin";

const domain = () => (process.env.NEXT_PUBLIC_EMAIL_DOMAIN?.trim() || "afaqway.com");

export type Sender = { id: SenderId; name: string; address: string; repliable: boolean };

/** Built lazily so the domain env var (if overridden) is read at call time,
 *  not at module load — matters for tests that set env after import. */
export function SENDERS(): Record<SenderId, Sender> {
  const d = domain();
  return {
    noreply: { id: "noreply", name: "AfaqWay", address: `noreply@${d}`, repliable: false },
    notifications: { id: "notifications", name: "AfaqWay Notifications", address: `notifications@${d}`, repliable: false },
    advisor: { id: "advisor", name: "AfaqWay Advisor", address: `advisor@${d}`, repliable: true },
    support: { id: "support", name: "AfaqWay Support", address: `support@${d}`, repliable: true },
    billing: { id: "billing", name: "AfaqWay Billing", address: `billing@${d}`, repliable: false },
    security: { id: "security", name: "AfaqWay Security", address: `security@${d}`, repliable: true },
    admin: { id: "admin", name: "AfaqWay Admin", address: `admin@${d}`, repliable: false },
  };
}

/** RFC 5322 "Name <address>", what the Resend API expects as `from`. */
export function senderFor(id: SenderId): string {
  const s = SENDERS()[id];
  return `${s.name} <${s.address}>`;
}

/** Where a reply to a non-repliable sender should land instead. */
export function replyToFor(id: SenderId): string {
  const s = SENDERS()[id];
  return s.repliable ? s.address : SENDERS().support.address;
}

export const EMAIL_BRAND = {
  website: "AfaqWay.com",
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://afaqway.com",
} as const;
