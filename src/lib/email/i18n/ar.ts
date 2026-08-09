import type { EmailDictionary } from "./locales";

/** Scaffolding, not a finished translation — see locales.ts for the
 *  fallback mechanism. Text is translated; layout direction (RTL) is a
 *  separate, still-unsolved problem — see the note in locales.ts. */
export const ar: Partial<EmailDictionary> = {
  tagline: "رحلتك نحو الدراسة في الخارج، بمرافقة.",
  footerSupport: "الدعم",
  footerPrivacy: "الخصوصية",
  footerTerms: "الشروط",
  footerRights: "جميع الحقوق محفوظة.",
  viewInBrowser: "عرض هذه الرسالة في المتصفح",
  ignoreIfNotYou: "إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة بأمان.",
};
