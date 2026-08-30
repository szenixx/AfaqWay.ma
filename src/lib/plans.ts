/* Plan catalog + payment methods (Lithuania / MAD). Feature copy from
   /Paid.Plan/plan.prompt.md. Reused across countries later.

   Prices are NOT defined here. They come from src/config/pricing.ts, the single
   source of truth for every amount on the platform. */

import { CURRENCY_SHORT, priceOf, type PlanId } from "@/config/pricing";

export type { PlanId };

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  popular: boolean;
  tagline: string;
  highlights: string[]; // the few shown on the card
  features: string[]; // full English list (for the doc)
  featuresAr: string[]; // full Arabic list (meaning, not literal)
}

/** Payment reference shown to the student and matched by the admin review. */
export const genRef = () => "AFQ-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export const PLANS: Plan[] = [
  {
    id: "self_service",
    name: "Self Service",
    price: priceOf("self_service"),
    currency: CURRENCY_SHORT,
    popular: true,
    tagline: "For students who drive it themselves.",
    highlights: [
      "Free program-matching before you pay",
      "Personalized 6-stage roadmap",
      "Human review on every document",
      "Live document status on every upload",
      "Learning resources on every step",
      "24/7 support access",
      "Reminders before every deadline",
      "A calendar with every deadline and intake",
      "One inbox for every update on your file",
      "A downloadable invoice for every payment",
      "Fees and English requirements kept current",
      "You mark your own steps done",
    ],
    features: [
      "Free program-matching guidance before you pay for anything",
      "A personalized 6-stage roadmap with step-by-step checklists you tick off yourself",
      "Human document review on every upload, a real reviewer, not a robot (avg 48h)",
      "Learning resources on every step: links, PDFs, videos, and plain-language explanations",
      "Full visibility into document status: Under review, Needs changes, or Approved",
      "24/7 support access",
      "Automatic reminders before every deadline and appointment",
      "A calendar carrying every deadline, appointment and intake date",
      "One inbox for every update on your file, so nothing arrives only by email",
      "Your programme's fees, deadlines and English requirements kept current for you",
      "The steps that are genuinely yours to call, you mark done yourself",
      "A downloadable invoice for every payment you make",
    ],
    featuresAr: [
      "توجيه مجاني لاختيار البرنامج المناسب قبل أن تدفع أي شيء",
      "خارطة طريق مخصّصة من 6 مراحل مع قوائم مهام تنجزها بنفسك خطوة بخطوة",
      "مراجعة بشرية لكل وثيقة ترفعها، مراجِع حقيقي وليس آلة (بمعدّل 48 ساعة)",
      "موارد تعليمية في كل خطوة: روابط وملفات PDF وفيديوهات وشروحات مبسّطة",
      "رؤية كاملة لحالة كل وثيقة: قيد المراجعة، تحتاج تعديلات، أو مقبولة",
      "دعم متاح على مدار الساعة طوال أيام الأسبوع",
      "تذكيرات تلقائية قبل كل موعد نهائي وكل موعد رسمي",
      "تقويم يجمع كل المواعيد النهائية والمواعيد الرسمية وتواريخ الالتحاق",
      "صندوق واحد يجمع كل التحديثات على ملفك، فلا يصلك شيء عبر البريد وحده",
      "رسوم برنامجك ومواعيده وشروط اللغة الإنجليزية، محدّثة لك دائماً",
      "الخطوات التي يعود قرارها إليك حقاً، تؤشّر إنجازها بنفسك",
      "فاتورة قابلة للتحميل عن كل دفعة تقوم بها",
    ],
  },
  {
    id: "full_service",
    name: "Full Service",
    price: priceOf("full_service"),
    currency: CURRENCY_SHORT,
    popular: false,
    tagline: "We handle it, you just track it.",
    highlights: [
      "Everything in Self Service, done for you",
      "A dedicated admin runs your whole file",
      "Live tracker of your application",
      "Document requests and updates by chat",
      "Interview preparation coaching",
      "Priority review, from start to settled",
      "Service and support after you arrive",
      "Post-arrival checklist once your permit lands",
      "One inbox for every update on your file",
      "Fees and requirements kept current for you",
      "The platform drives every step, not just guides it",
      "Human document review, average 48 hours",
    ],
    features: [
      "Free program-matching guidance before you pay for anything",
      "A personalized 6-stage roadmap with step-by-step checklists",
      "Human document review on every upload, a real reviewer, not a robot (avg 48h)",
      "Learning resources on every step: links, PDFs, videos, and plain-language explanations",
      "Full visibility into document status: Under review, Needs changes, or Approved",
      "24/7 support access",
      "Automatic reminders before every deadline and appointment",
      "A calendar carrying every deadline, appointment and intake date",
      "One inbox for every update on your file, so nothing arrives only by email",
      "Your programme's fees, deadlines and English requirements kept current for you",
      "The steps that are genuinely yours to call, you mark done yourself",
      "A downloadable invoice for every payment you make",
      "The platform drives every step for you, not just guides it",
      "A dedicated admin manages your entire application file",
      "Live tracker showing exactly where your application stands",
      "Dedicated service and support after you arrive in your study country",
      "Document requests and updates sent to you by chat",
      "Full interview preparation coaching for university and migration interviews",
      "Post-arrival support checklist after your residence permit is approved",
      "Priority human review and hands-on guidance from start to settled",
    ],
    featuresAr: [
      "توجيه مجاني لاختيار البرنامج المناسب قبل أن تدفع أي شيء",
      "خارطة طريق مخصّصة من 6 مراحل مع قوائم مهام خطوة بخطوة",
      "مراجعة بشرية لكل وثيقة ترفعها، مراجِع حقيقي وليس آلة (بمعدّل 48 ساعة)",
      "موارد تعليمية في كل خطوة: روابط وملفات PDF وفيديوهات وشروحات مبسّطة",
      "رؤية كاملة لحالة كل وثيقة: قيد المراجعة، تحتاج تعديلات، أو مقبولة",
      "دعم متاح على مدار الساعة طوال أيام الأسبوع",
      "تذكيرات تلقائية قبل كل موعد نهائي وكل موعد رسمي",
      "تقويم يجمع كل المواعيد النهائية والمواعيد الرسمية وتواريخ الالتحاق",
      "صندوق واحد يجمع كل التحديثات على ملفك، فلا يصلك شيء عبر البريد وحده",
      "رسوم برنامجك ومواعيده وشروط اللغة الإنجليزية، محدّثة لك دائماً",
      "الخطوات التي يعود قرارها إليك حقاً، تؤشّر إنجازها بنفسك",
      "فاتورة قابلة للتحميل عن كل دفعة تقوم بها",
      "المنصّة تتولّى كل خطوة نيابةً عنك، لا تكتفي بالإرشاد فقط",
      "مستشار مخصّص يدير ملف طلبك بالكامل",
      "متابعة مباشرة تُظهر بالضبط أين وصل طلبك",
      "خدمة ومرافقة مخصّصة بعد وصولك إلى بلد الدراسة",
      "طلبات الوثائق وتحديثاتها تصلك عبر المحادثة",
      "تدريب كامل على مقابلات الجامعة ومكتب الهجرة",
      "قائمة دعم ما بعد الوصول بعد الموافقة على تصريح الإقامة",
      "مراجعة بشرية ذات أولوية ومرافقة عملية من البداية حتى الاستقرار",
    ],
  },
];

export const planById = (id: string | null | undefined) => PLANS.find((p) => p.id === id) ?? null;

export type PayMethodKind = "instant" | "manual";

export interface PayMethod {
  id: string;
  name: string;
  desc: string;
  kind: PayMethodKind;
  available: boolean; // instant methods are not linked yet
  recommended?: boolean;
  logoSrc: string; // transparent logo in public/pay/
  color: string; // main brand color of the logo
  // platform details shown for manual transfers
  account?: { beneficiary: string; rib?: string; note?: string };
}

const AFAQ_ACCOUNT = { beneficiary: "Abel SARL", rib: "007201000814730040057065" };

// Static config (logo, kind, brand color). Availability + account details can be
// overridden from the payment_methods table by the super-admin (see catalog usage).
export const PAY_METHODS: PayMethod[] = [
  { id: "cashplus", name: "Cash Plus", desc: "Pay cash at any Cash Plus agency", kind: "manual", available: true, recommended: true, logoSrc: "/pay/cashplus.png", color: "#A6C21B", account: { beneficiary: "Abderrahmane Almoustansir" } },
  { id: "attijari", name: "Attijariwafa Bank", desc: "Bank transfer or deposit", kind: "manual", available: true, logoSrc: "/pay/attijari.png", color: "#E9761E", account: AFAQ_ACCOUNT },
  { id: "simple", name: "Simple", desc: "Transfer via Simple", kind: "manual", available: true, logoSrc: "/pay/simple.png", color: "#7A3BE8", account: AFAQ_ACCOUNT },
  { id: "bank", name: "Bank Transfer", desc: "Transfer from any bank", kind: "manual", available: true, logoSrc: "/pay/bank.png", color: "#16305C", account: AFAQ_ACCOUNT },
  { id: "card", name: "Credit / Debit Card", desc: "Visa or Mastercard", kind: "instant", available: false, logoSrc: "/pay/card.png", color: "#15171C" },
];

export const methodById = (id: string | null | undefined) => PAY_METHODS.find((m) => m.id === id) ?? null;

/** PAY_METHODS in whatever order the `payment_methods.sort` column says —
 *  the one thing a superadmin can actually rearrange from Payment Methods
 *  admin. Every surface that lists methods (checkout, admin, the Payments
 *  Review filter) calls this instead of reading PAY_METHODS' own array order
 *  directly, so reordering in one place is reordering everywhere.
 *
 *  A method with no row yet — never touched by an admin — sorts after every
 *  explicitly-ordered one, keeping its position in this array; that mirrors
 *  the `100 + index` convention Payment Methods admin seeds for exactly the
 *  same "not configured yet" case. */
export function orderedPayMethods(sortById: Record<string, number>): PayMethod[] {
  const fallback = (m: PayMethod) => 100 + PAY_METHODS.indexOf(m);
  return [...PAY_METHODS].sort((a, b) => (sortById[a.id] ?? fallback(a)) - (sortById[b.id] ?? fallback(b)));
}
