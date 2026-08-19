/* AfaqWay's social destinations, in one place.

   Every URL here is deliberately empty until the real account is handed over.
   Nothing in the UI hard-codes a link: the cards read this file, and a card
   whose link is still blank renders as a clearly-marked "coming soon" state
   rather than a button that goes nowhere. Filling one in is the whole change
   — no component edit, no layout change.

   WhatsApp takes a phone number in international format WITHOUT the +, spaces
   or dashes (wa.me's own requirement), and the helper builds the link. */

export type SocialKey = "whatsapp" | "instagram" | "tiktok" | "youtube";

export const SOCIAL = {
  /* The AfaqWay support line, the same number the homepage footer dials.
     Digits only, no +, spaces or dashes — wa.me's own requirement. */
  whatsappNumber: "212632501155",
  /* Pre-filled in the student's WhatsApp composer, so support opens with
     context instead of a blank thread. */
  whatsappMessage: "Hello AfaqWay, I need help with my application.",
  instagramUrl: "https://www.instagram.com/afaqway.platform/",
  /* UNVERIFIED: this handle came over from the footer, where it was marked a
     placeholder. Confirm the real account before trusting it. */
  tiktokUrl: "https://tiktok.com/@afaqway",
  /* Not created yet. An empty value renders the card's locked state rather
     than a button that goes nowhere. */
  youtubeUrl: "",
} as const;

/** wa.me link, or null when no support number is configured yet. */
export function whatsappLink(): string | null {
  const digits = SOCIAL.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  const text = SOCIAL.whatsappMessage.trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** A configured http(s) URL, or null. Anything else is treated as unset. */
function httpLink(raw: string): string | null {
  const v = raw.trim();
  return /^https?:\/\//i.test(v) ? v : null;
}

export const socialLink = (key: SocialKey): string | null => {
  if (key === "whatsapp") return whatsappLink();
  if (key === "instagram") return httpLink(SOCIAL.instagramUrl);
  if (key === "tiktok") return httpLink(SOCIAL.tiktokUrl);
  return httpLink(SOCIAL.youtubeUrl);
};
