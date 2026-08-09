import type { EmailDictionary } from "./locales";

/** The base dictionary. Every other locale falls back to this for any key
 *  it hasn't translated yet, so this file must stay complete. */
export const en: EmailDictionary = {
  tagline: "Your journey to studying abroad, guided.",
  footerPlatform: "AfaqWay",
  footerSupport: "Support",
  footerPrivacy: "Privacy",
  footerTerms: "Terms",
  footerRights: "All rights reserved.",
  viewInBrowser: "View this email in your browser",
  ignoreIfNotYou: "If you didn't request this, you can safely ignore this email.",
};
